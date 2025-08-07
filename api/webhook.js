import { db } from "../../firebase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const body = req.body;
  const from = body.From;
  const userId = from.replace("whatsapp:", "");
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

  // Push message to Firebase
  await userRef.child("messages").push({
    ...content,
    timestamp: now,
  });

  // Store/update lastSeen
  await userRef.update({ lastSeen: now });

  console.log("✅ Message saved to Firebase for", userId);

  res.status(200).send("Message received.");
}