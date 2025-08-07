import admin from "firebase-admin";

// Load the JSON from the environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://whatsapp-bot-a0b24-default-rtdb.firebaseio.com",
    storageBucket: "whatsapp-bot-a0b24.appspot.com"
  });
}

const storage = admin.storage();

async function testStorage() {
  try {
    // List all buckets
    const [buckets] = await storage.getBuckets();
    console.log('Available buckets:');
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name}`);
    });
    
    // Try to access the specific bucket
    const bucket = storage.bucket("whatsapp-bot-a0b24.appspot.com");
    const [exists] = await bucket.exists();
    console.log(`Bucket whatsapp-bot-a0b24.appspot.com exists: ${exists}`);
    
    if (exists) {
      // List files in the bucket
      const [files] = await bucket.getFiles();
      console.log(`Files in bucket: ${files.length}`);
      files.forEach(file => {
        console.log(`- ${file.name}`);
      });
    }
    
  } catch (error) {
    console.error('Storage test failed:', error.message);
  }
}

testStorage();
