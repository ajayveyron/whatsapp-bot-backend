// api/webhook.js
import getRawBody from "raw-body";
import querystring from "querystring";
import fetch from "node-fetch";
import PDFDocument from "pdfkit";
import Twilio from "twilio";
import admin from "firebase-admin";
import OpenAI from "openai";
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
const bucket = admin.storage().bucket("whatsapp-bot-a0b24.appspot.com");

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Usage limits
const MAX_MONTHLY_PDFS = Number(process.env.MAX_MONTHLY_PDFS || 30);
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || null; // e.g. +91999...

function getMonthKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getUsageRef(userId, monthKey) {
  return db.ref(`usage/${monthKey}/${userId}`);
}

// 3️⃣ Extract text from images using OpenAI Vision
async function extractTextFromImage(imageUrl) {
  try {
    console.log('Extracting text from image:', imageUrl);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract ALL text from this image EXACTLY as it appears. Do not modify, summarize, or change any text. If there are questions with options, preserve the exact wording and format. Return only the raw extracted text without any modifications."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    });

    const extractedText = response.choices[0].message.content;
    console.log('Extracted text from image:', extractedText);
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    return null;
  }
}

// 4️⃣ Call ChatGPT to extract questions with structured output
async function extractQuestions(messages) {
  try {
    // Process all messages (text and images)
    const processedMessages = [];
    const imageTexts = [];
    
    for (const msg of messages) {
      if (msg.type === "text") {
        processedMessages.push(msg.text);
      } else if (msg.type === "image") {
        console.log('Processing image message:', msg.url);
        const extractedText = await extractTextFromImage(msg.url);
        if (extractedText) {
          imageTexts.push(extractedText);
          processedMessages.push(`[Image ${imageTexts.length}]: ${extractedText}`);
        }
      }
    }
    
    const conversationText = processedMessages.join('\n');
    console.log('Processing conversation:', conversationText);
    console.log('Total images processed:', imageTexts.length);
    
    // If no conversation text, return empty array
    if (!conversationText.trim()) {
      console.log('No conversation text to process');
      return [];
    }

                            const response = await openai.chat.completions.create({
                          model: "gpt-4o-mini",
                          messages: [
                            {
                              role: "system",
                              content: `You are a question extraction assistant. Extract ALL questions from the provided conversation, including from multiple images. Preserve the EXACT wording of questions and options as they appear in the original text. Do NOT modify, summarize, or change any text. If no questions are found, return an empty questions array. usually there will be some leading text with the question to set the stage and explain the question scenairo. include that as well in the question itself. do not cut short any questions and their supporting text.` 
                            },
                            {
                              role: "user",
                              content: `Extract ALL questions from this conversation and classify them. Process each image separately and extract all questions from each:

${conversationText}

IMPORTANT: 
- Extract questions from ALL images and text messages
- Preserve the EXACT wording of questions and options
- Do NOT modify, summarize, or change any text
- If questions are found, return them in the exact formatting as they appear
- If no questions are found, return an empty array
- do not cut short any questions and their supporting text.

Return the questions in this exact JSON format:
{
  "questions": []
}

If questions are found, use this format:
{
  "questions": [
    {
      "question": "The exact question text as it appears",
      "type": "mcq|short_answer|true_false",
      "options": ["A. exact option text", "B. exact option text", "C. exact option text", "D. exact option text"],
      "correct_answer": "A"
    }
  ]
}`
                            }
                          ],
                          response_format: { type: "json_object" },
                          temperature: 0.1,
                          max_tokens: 1000
                        });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('ChatGPT response:', JSON.stringify(result, null, 2));

    // Filter out example questions that might be returned
    const questions = result.questions
      .filter(q => {
        const questionText = q.question.toLowerCase();
        // Filter out common example questions - be more specific
        return !questionText.includes('what is the capital of france') &&
               !questionText.includes('what is your name') &&
               !questionText.includes('is the sky blue') &&
               !questionText.includes('example question') &&
               !questionText.includes('sample question');
      })
      .map(q => ({
        q: q.question,
        type: q.type,
        options: q.options,
        answer: q.correct_answer
      }));

    console.log('Questions extracted:', questions.length);
    return questions;
    
  } catch (error) {
    console.error('Error calling ChatGPT:', error);
    // Fallback: extract questions from messages (text and images)
    const questions = [];
    
    for (const msg of messages) {
      if (msg.type === "text" && msg.text.trim()) {
        const lines = msg.text.split('\n').filter(line => line.trim());
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && (
            trimmedLine.includes('?') || 
            trimmedLine.toLowerCase().startsWith('what') || 
            trimmedLine.toLowerCase().startsWith('who') || 
            trimmedLine.toLowerCase().startsWith('when') || 
            trimmedLine.toLowerCase().startsWith('where') || 
            trimmedLine.toLowerCase().startsWith('why') || 
            trimmedLine.toLowerCase().startsWith('how')
          )) {
            questions.push({
              q: trimmedLine,
              type: "short_answer",
              options: [],
              answer: ""
            });
          }
        });
      } else if (msg.type === "image") {
        try {
          const extractedText = await extractTextFromImage(msg.url);
          if (extractedText) {
            // Look for questions in the extracted text
            const lines = extractedText.split('\n').filter(line => line.trim());
            lines.forEach(line => {
              const trimmedLine = line.trim();
              if (trimmedLine && (
                trimmedLine.includes('?') || 
                trimmedLine.toLowerCase().startsWith('what') || 
                trimmedLine.toLowerCase().startsWith('who') || 
                trimmedLine.toLowerCase().startsWith('when') || 
                trimmedLine.toLowerCase().startsWith('where') || 
                trimmedLine.toLowerCase().startsWith('why') || 
                trimmedLine.toLowerCase().startsWith('how')
              )) {
                questions.push({
                  q: trimmedLine,
                  type: "short_answer",
                  options: [],
                  answer: ""
                });
              }
            });
          }
        } catch (imgError) {
          console.error('Error processing image in fallback:', imgError);
        }
      }
    }
    return questions;
  }
}

// 4️⃣ Build PDF with a clean template & upload to Firebase Storage
async function createAndUploadPdf(userId, questions) {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const fileName = `pdfs/${userId}/${now.getTime()}.pdf`;

    // Create a nicely formatted A4 document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 64, bottom: 72, left: 56, right: 56 }
    });

    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);
        const file = bucket.file(fileName);
        await file.save(pdfBuffer, {
          contentType: "application/pdf",
          public: true,
        });
        const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve(url);
      } catch (err) {
        reject(err);
      }
    });

    // Helpers: header and footer on every page
    const drawHeader = () => {
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#111')
        .text('Question Paper', { align: 'left' });
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#444')
        .text(now.toLocaleString(), { align: 'right' });
      doc.moveDown(0.5);
      doc.strokeColor('#e0e0e0').lineWidth(1).moveTo(doc.page.margins.left, 84).lineTo(doc.page.width - doc.page.margins.right, 84).stroke();
      doc.moveDown(0.8);
    };

    const drawFooter = () => {
      const pageNumber = doc.page.number;
      // Keep footer safely within the printable area to avoid triggering an auto page add
      const footerY = doc.page.height - doc.page.margins.bottom - 18; // inside bottom margin
      const lineY = footerY - 10;
      doc.strokeColor('#e0e0e0').lineWidth(1)
        .moveTo(doc.page.margins.left, lineY)
        .lineTo(doc.page.width - doc.page.margins.right, lineY)
        .stroke();
      doc.font('Helvetica').fontSize(9).fillColor('#666').text(
        `Page ${pageNumber}`,
        doc.page.margins.left,
        footerY,
        {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          align: 'center'
        }
      );
    };

    // Apply header/footer on new pages but ensure y is reset to safe area
    doc.on('pageAdded', () => {
      // Reset cursor to the top margin area before drawing chrome
      doc.y = doc.page.margins.top;
      drawHeader();
      drawFooter();
      // Ensure content starts below header
      doc.y = 100;
    });

    // Validate questions
    if (!Array.isArray(questions) || questions.length === 0) {
      questions = [{ q: 'No questions found', type: 'short_answer', options: [] }];
    }

    // First page chrome
    doc.y = doc.page.margins.top;
    drawHeader();
    drawFooter();
    doc.y = 100;

    // Render one question per page
    questions.forEach((question, index) => {
      if (index > 0) doc.addPage();

      const questionTitle = `Question ${index + 1}`;
      const questionText = typeof question.q === 'string' && question.q.trim().length > 0
        ? question.q.trim()
        : 'Untitled question';

      // Title
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#111').text(questionTitle, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      });
      doc.moveDown(0.5);

      // Question body
      doc.font('Helvetica').fontSize(12).fillColor('#111').text(questionText, {
        align: 'left',
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      });
      doc.moveDown(1);

      // Options / answer space based on type
      const normalizedType = (question.type || '').toLowerCase();

      if (normalizedType === 'mcq' && Array.isArray(question.options) && question.options.length > 0) {
        question.options.forEach((rawOption) => {
          const optionText = String(rawOption);
          // If option already includes a prefix like "A.", "(a)", do not add another
          const hasPrefix = /^(\(?[A-Da-d]\)?[\.|\)]\s)/.test(optionText.trim());
          doc.font('Helvetica').fontSize(12).text(hasPrefix ? optionText : optionText, { indent: 10 });
          doc.moveDown(0.2);
        });
      } else if (normalizedType === 'true_false') {
        const tfOptions = Array.isArray(question.options) && question.options.length > 0
          ? question.options
          : ['A. True', 'B. False'];
        tfOptions.forEach((opt) => {
          doc.font('Helvetica').fontSize(12).text(String(opt), { indent: 10 });
          doc.moveDown(0.2);
        });
      } else {
        // Short answer: draw a few lines for students to write
        doc.moveDown(0.5);
        const startX = doc.x;
        let currentY = doc.y + 6;
        const endX = doc.page.width - doc.page.margins.right;
        doc.strokeColor('#c7c7c7').lineWidth(0.5);
        for (let i = 0; i < 6; i += 1) {
          doc.moveTo(startX, currentY).lineTo(endX, currentY).stroke();
          currentY += 16;
        }
      }
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
  try {
    // 0) Enforce monthly usage limits
    const monthKey = getMonthKey();
    const usageRef = getUsageRef(userId, monthKey);
    const usageSnap = await usageRef.once('value');
    const usage = usageSnap.val() || { pdfCount: 0, questionCount: 0 };
    if (usage.pdfCount >= MAX_MONTHLY_PDFS) {
      const contact = ADMIN_WHATSAPP_NUMBER ? ` Reach out at whatsapp:${ADMIN_WHATSAPP_NUMBER}` : ' Reach out to the admin.';
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${userId}`,
        body: `Limit reached: You have used ${usage.pdfCount}/${MAX_MONTHLY_PDFS} PDFs this month.${contact}`,
      });
      return res.status(429).send("Monthly limit reached");
    }

  // A) Fetch messages
  const snap = await db.ref(`sessions/${userId}/messages`).once("value");
  const msgsObj = snap.val() || {};
  const messages = Object.values(msgsObj);

    console.log(`Processing ${messages.length} messages for user ${userId}`);

  // B) Extract questions
    const questions = await extractQuestions(messages);
    console.log('Questions extracted:', questions);

    // C) Option A: stream-on-demand PDF to avoid GCS bucket dependency
    // Persist questions to RTDB for a short period and share a link to /api/pdf
    const exportId = Date.now().toString();
    await db.ref(`exports/${userId}/${exportId}`).set({
      createdAt: Date.now(),
      questions,
    });

    // Always use a public, stable base URL for links
    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://whatsapp-bot-backend.vercel.app';
    const pdfLink = `${baseUrl}/api/pdf?userId=${encodeURIComponent(userId)}&exportId=${encodeURIComponent(exportId)}`;

    // Send a text message with a tappable link; most WhatsApp clients preview PDFs when tapped
    const listText = questions.map((q, i) => `${i + 1}. ${q.q}`).join('\n');
    const body = `🎉 Processing complete! Found ${questions.length} questions.\n\n${listText}\n\nTap to download your PDF: ${pdfLink}`;
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${userId}`,
      body,
    });

    // C2) Update monthly usage counters transactionally
    await usageRef.transaction((current) => {
      const next = current || { pdfCount: 0, questionCount: 0 };
      next.pdfCount = (next.pdfCount || 0) + 1;
      next.questionCount = (next.questionCount || 0) + (Array.isArray(questions) ? questions.length : 0);
      next.lastAt = Date.now();
      return next;
    });

    // D) Cleanup
  await db.ref(`sessions/${userId}`).remove();

    return res.status(200).send("🎉 Processing complete! PDF link sent.");
  } catch (error) {
    console.error('Error in processBatchFor:', error);
    return res.status(500).send("Error processing batch: " + error.message);
  }
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