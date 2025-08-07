export default async function handler(req, res) {
  if (req.method === "POST") {
    const body = req.body;

    // Get user phone number
    const from = body.From; // e.g., 'whatsapp:+918888888888'

    // Check if it's text or image
    const numMedia = parseInt(body.NumMedia);
    let messageType = numMedia > 0 ? "image" : "text";

    let content;

    if (messageType === "text") {
      content = body.Body;
    } else {
      // Media URL + content type
      const mediaUrl = body.MediaUrl0;
      const contentType = body.MediaContentType0;
      content = { url: mediaUrl, type: contentType };
    }

    console.log("FROM:", from);
    console.log("TYPE:", messageType);
    console.log("CONTENT:", content);

    res.status(200).send("Captured message.");
  } else {
    res.status(405).send("Method not allowed");
  }
}