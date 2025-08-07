import admin from "firebase-admin";
import { readFileSync } from "fs";

// Load service account
const serviceAccount = JSON.parse(
  readFileSync("./serviceAccountKey.json", "utf8")
);

// Init Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://whatsapp-bot-a0b24-default-rtdb.firebaseio.com", // Replace!
  });
}

const db = admin.database();

const run = async () => {
  await db.ref("test-write").set({ message: "Hello from Ajay!" });
  console.log("✅ Firebase test write successful");
  process.exit();
};

run();