export default async function handler(req, res) {
    if (req.method === "POST") {
      const incoming = req.body;
  
      console.log("Got message from Twilio:", incoming);
  
      // Just respond for now
      res.status(200).send("Received");
    } else {
      res.status(405).send("Method not allowed");
    }
  }