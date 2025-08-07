import fetch from 'node-fetch';

const WEBHOOK_URL = 'https://whatsapp-bot-backend.vercel.app/api/webhook';

// Test with a real image containing questions
async function testRealImage() {
  console.log('🧪 Testing with real image containing questions...');
  
  const formData = new URLSearchParams();
  formData.append('From', 'whatsapp:+919876543210');
  formData.append('Body', '');
  formData.append('NumMedia', '1');
  formData.append('MediaUrl0', 'https://i.postimg.cc/vT9CxLCc/Screenshot-2025-08-07-at-12-45-13-PM.png');
  formData.append('MediaContentType0', 'image/png');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    const result = await response.text();
    console.log('✅ Real image test:', response.status, result);
  } catch (error) {
    console.log('❌ Real image test failed:', error.message);
  }
}

// Test "done" command after image
async function testDoneAfterImage() {
  console.log('\n🧪 Testing "done" command after image...');
  
  const formData = new URLSearchParams();
  formData.append('From', 'whatsapp:+919876543210');
  formData.append('Body', 'done');
  formData.append('NumMedia', '0');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    const result = await response.text();
    console.log('✅ Done after image test:', response.status, result);
  } catch (error) {
    console.log('❌ Done after image test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting real image tests...\n');
  
  await testRealImage();
  await testDoneAfterImage();
  
  console.log('\n✨ All tests completed!');
}

runTests();
