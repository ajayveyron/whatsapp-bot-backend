// api/webhook.js
import getRawBody from "raw-body";
import querystring from "querystring";
import fetch from "node-fetch";
import PDFDocument from "pdfkit";
import Twilio from "twilio";
import admin from "firebase-admin";
import { db } from "./firebase.js";  // your firebase init

// 1️⃣ Disable Next.js body parsing so we can handle form-encoded
export const config = {
  api: { bodyParser: false },
};

// 2️⃣ Twilio + Firebase Storage setup
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const bucket = admin.storage().bucket();

// 3️⃣ Call Gemini to extract questions
async function callGemini(messages) {
  const payload = {
    instances: messages.map((m) =>
      m.type === "text"
        ? { text: m.text }
        : { image: { uri: m.url } }
    ),
    parameters: { /* customize if needed */ },
  };

  const res = await fetch(
    "https://api.gemini.com/v1/vision:analyze",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();
  // assume `data.questions` → [{ q, options: [...], answer }, …]
  return data.questions;
}

// 4️⃣ Build PDF & upload to Firebase Storage
async function createAndUploadPdf(userId, questions) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);
        const file = bucket.file(`pdfs/${userId}.pdf`);
        await file.save(pdfBuffer, {
          contentType: "application/pdf",
          public: true,
        });
        const url = `https://storage.googleapis.com/${bucket.name}/pdfs/${userId}.pdf`;
        resolve(url);
      } catch (err) {
        reject(err);
      }
    });

    // One question per page
    questions.forEach((q, idx) => {
      if (idx > 0) doc.addPage();
      doc.fontSize(18).text(q.q, { underline: true });
      q.options.forEach((opt, i) => {
        doc.moveDown(0.5).fontSize(14)
          .text(`${String.fromCharCode(65 + i)}. ${opt}`);
      });
    });

    doc.end();
  });
}

// 5️⃣ Send PDF back over WhatsApp
async function sendPdfOverWhatsApp(userId, pdfUrl) {
  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,       // e.g. "whatsapp:+14155238886"
    to: `whatsapp:${userId}`,                       // e.g. "whatsapp:+919876543210"
    mediaUrl: [pdfUrl],
    body: "Here’s your PDF with all the questions! 📄",
  });
}

// 6️⃣ Process a full batch when user types “done”
async function processBatchFor(userId, res) {
  // A) Fetch messages
  const snap = await db.ref(`sessions/${userId}/messages`).once("value");
  const msgsObj = snap.val() || {};
  const messages = Object.values(msgsObj);

  // B) Extract questions
  const questions = await callGemini(messages);

  // C) Build & upload PDF
  const pdfUrl = await createAndUploadPdf(userId, questions);

  // D) Send back on WhatsApp
  await sendPdfOverWhatsApp(userId, pdfUrl);

  // E) Cleanup
  await db.ref(`sessions/${userId}`).remove();

  return res.status(200).send("🎉 Your PDF is on its way!");
}

// 7️⃣ Main handler: route “done” vs “store message”
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  // Parse raw body (JSON or form-encoded)
  const raw = await getRawBody(req);
  let body;
  try {
    body = JSON.parse(raw.toString());
  } catch {
    body = querystring.parse(raw.toString());
  }

  console.log("Incoming body:", body);

  const from = body.From || "";
  const userId = from.replace("whatsapp:", "");
  const text = (body.Body || "").trim().toLowerCase();

  // If user is done, fire the batch
  if (text === "done") {
    return processBatchFor(userId, res);
  }

  // Otherwise store this one message
  const numMedia = parseInt(body.NumMedia || "0", 10);
  const content =
    numMedia > 0
      ? { type: "image", url: body.MediaUrl0, mediaType: body.MediaContentType0 }
      : { type: "text", text: body.Body };

  const now = Date.now();
  const userRef = db.ref(`sessions/${userId}`);
  await userRef.child("messages").push({ ...content, timestamp: now });
  await userRef.update({ lastSeen: now });

  console.log("Stored message for", userId);
  res.status(200).send("Message saved. Send “done” when finished.");
}