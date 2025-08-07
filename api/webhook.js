let sessions = {}; // In-memory user sessions

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const body = req.body;
  const from = body.From; // e.g., 'whatsapp:+918888888888'
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

  // Store in session
  if (!sessions[userId]) {
    sessions[userId] = {
      messages: [],
      timeout: null,
    };
  }

  sessions[userId].messages.push(content);

  // Reset timeout if already set
  if (sessions[userId].timeout) {
    clearTimeout(sessions[userId].timeout);
  }

  // Start a new 60-second timeout
  sessions[userId].timeout = setTimeout(() => {
    console.log(`Processing batch for ${userId}...`);

    const allMessages = sessions[userId].messages;

    // TODO: send these to Gemini + build PDF

    console.log("Final batch of messages:", allMessages);

    // Clear session after processing
    delete sessions[userId];
  }, 60000); // 60 seconds

  res.status(200).send("Message added to session.");
}