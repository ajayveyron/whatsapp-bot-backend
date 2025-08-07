import getRawBody from "raw-body";
import querystring from "querystring";
import { db } from "../firebase.js";

export const config = {
  api: {
    bodyParser: false, // disable built-in parser so we can detect form vs JSON
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log("❌ Invalid method:", req.method);
    return res.status(405).send("Method not allowed");
  }

  // 1️⃣ Read raw request
  const raw = await getRawBody(req);
  const text = raw.toString();

  // 2️⃣ Try JSON parse, else parse form-encoded
  let body;
  try {
    body = JSON.parse(text);
    console.log("📥 Parsed JSON body");
  } catch {
    body = querystring.parse(text);
    console.log("📥 Parsed x-www-form-urlencoded body");
  }

  console.log("📩 Incoming body:", body);

  // 3️⃣ Extract message info
  const from = body.From || "";
  const userId = from.replace("whatsapp:", "");
  const numMedia = parseInt(body.NumMedia || "0", 10);
  const isImage = numMedia > 0;

  const content = isImage
    ? { type: "image", url: body.MediaUrl0, mediaType: body.MediaContentType0 }
    : { type: "text", text: body.Body };

  console.log("🔁 Writing to Firebase:", content);

  // 4️⃣ Write to Firebase
  const userRef = db.ref(`sessions/${userId}`);
  const now = Date.now();
  await userRef.child("messages").push({ ...content, timestamp: now });
  await userRef.update({ lastSeen: now });

  console.log("✅ Firebase write complete for user:", userId);
  res.status(200).send("Message stored.");
}