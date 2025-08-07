WhatsApp → PDF Question Generator

Project Goal:
A tool that allows users to forward a batch of WhatsApp messages (text or image) to a WhatsApp bot. After the user indicates they are done, the system uses Gemini LLM to extract questions, generates a styled multi-page PDF (one question per page), then sends the PDF back via WhatsApp.

⸻

🚀 Tech Stack
	•	WhatsApp API: Twilio WhatsApp Sandbox
	•	Hosting / Webhook: Vercel Edge Function (Node.js)
	•	Data Storage: Firebase Realtime Database (sessions/messages)
	•	PDF Generation: PDFKit (Node.js)
	•	AI Parsing: Google Gemini Vision API
	•	File Storage: Firebase Storage (public PDFs)
	•	Messaging: Twilio Node SDK for media messages
	•	Environment: Node.js ESM, environment variables via Vercel

⸻

📋 High-Level Workflow
	1.	User joins the Twilio sandbox and sends messages to the sandbox number.
	2.	Webhook (Vercel) receives each incoming POST from Twilio:
	•	Parses both JSON and form-encoded payloads.
	•	Extracts From, Body or MediaUrl.
	•	Saves each message under sessions/{phone}/messages in Firebase RTDB.
	3.	User sends done when all questions are forwarded.
	4.	Batch Processor (processBatchFor):
	•	Fetches all messages for that user from Firebase.
	•	Calls Gemini Vision API to extract structured questions.
	•	Generates a PDF (1 question per page) using PDFKit.
	•	Uploads the PDF to Firebase Storage (pdfs/{phone}.pdf).
	•	Sends the PDF back via WhatsApp (Twilio).
	•	Cleans up the user session in Firebase.

⸻

✅ Completed Steps
	•	Twilio Sandbox configured (sandbox number, join code).
	•	Vercel project created with /api/webhook.js route.
	•	Webhook parsing logic implemented (raw-body + querystring).
	•	Firebase Admin initialized via environment variable for service account.
	•	Message storage in Firebase RTDB verified (text/image).
	•	Environment variables set in Vercel and .env.local:
	•	FIREBASE_SERVICE_ACCOUNT_KEY
	•	TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
	•	GEMINI_API_KEY

⸻

🔎 Current State / Issues
	•	Full api/webhook.js includes both storage and processBatchFor logic.
	•	Sending done does not trigger the batch-processing logs or PDF generation.
	•	Likely cause: Twilio not forwarding the done message to the webhook, or webhook URL misconfiguration.

⸻

🛠️ Next Steps
	1.	Verify webhook invocation for done messages:
	•	Use curl to POST a form-encoded Body=done payload.
	•	Inspect Vercel Function logs (rocket log).
	•	Check Twilio Messaging Logs → Request Inspector.
	2.	Fix Twilio webhook URL or sandbox settings if Twilio isn’t calling the endpoint.
	3.	Test processBatchFor end-to-end locally via vercel dev.
	4.	Handle edge cases:
	•	Errors from Gemini or storage.
	•	User notifications on long processing.
	5.	Polish PDF template:
	•	Final styling (fonts, headers, footers).
	•	Custom branding option.
	6.	Production rollout:
	•	Migrate from sandbox to official WhatsApp Business API.
	•	Add rate limiting, retry logic, and persistent queue (e.g. Pub/Sub).

⸻

You can hand this README to your AI code editor to pick up exactly where we are and implement the pending debugging & batch-processing steps.