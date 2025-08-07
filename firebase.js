import { db } from "../../firebase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log("❌ Invalid method:", req.method);
    return res.status(405).send("Method not allowed");
  }

  try {
    const body = req.body;
    console.log("📩 Incoming body:", body);

    const from = body.From;
    const userId = from?.replace("whatsapp:", "");
    const numMedia = parseInt(body.NumMedia);
    const messageType = numMedia > 0 ? "image" : "text";

    let content;
    if (messageType === "text") {
      content = { type: "text", text: body.Body };
    } else {
      content = {
        type: "image",
        url: body.MediaUrl0,
        mediaType: body.MediaContentType0,
      };
    }

    const userRef = db.ref(`sessions/${userId}`);
    const now = Date.now();

    console.log("🔁 Writing to Firebase:", content);

    // Push message
    await userRef.child("messages").push({
      ...content,
      timestamp: now,
    });

    // Update last seen
    await userRef.update({ lastSeen: now });

    console.log("✅ Firebase write complete for user:", userId);
    res.status(200).send("Message stored.");
  } catch (err) {
    console.error("🔥 ERROR:", err);
    res.status(500).send("Internal server error.");
  }
}