import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync("./service_account_key.json", "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://whatsapp-bot-a0b24-default-rtdb.firebaseio.com", // replace with your Firebase DB URL
  });
}

const db = admin.database();
export { db };