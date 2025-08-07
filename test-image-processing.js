import fetch from 'node-fetch';

const WEBHOOK_URL = 'https://whatsapp-bot-backend.vercel.app/api/webhook';

// Test with text message
async function testTextMessage() {
  console.log('🧪 Testing text message...');
  
  const formData = new URLSearchParams();
  formData.append('From', 'whatsapp:+919876543210');
  formData.append('Body', 'What is the capital of France?');
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
    console.log('✅ Text message test:', response.status, result);
  } catch (error) {
    console.log('❌ Text message test failed:', error.message);
  }
}

// Test with image message
async function testImageMessage() {
  console.log('\n🧪 Testing image message...');
  
  const formData = new URLSearchParams();
  formData.append('From', 'whatsapp:+919876543210');
  formData.append('Body', '');
  formData.append('NumMedia', '1');
  formData.append('MediaUrl0', 'https://i.postimg.cc/vT9CxLCc/Screenshot-2025-08-07-at-12-45-13-PM.png');
  formData.append('MediaContentType0', 'image/jpeg');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    const result = await response.text();
    console.log('✅ Image message test:', response.status, result);
  } catch (error) {
    console.log('❌ Image message test failed:', error.message);
  }
}

// Test "done" command after mixed messages
async function testDoneCommand() {
  console.log('\n🧪 Testing "done" command after mixed messages...');
  
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
    console.log('✅ Done command test:', response.status, result);
  } catch (error) {
    console.log('❌ Done command test failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting image processing tests...\n');
  
  await testTextMessage();
  await testImageMessage();
  await testDoneCommand();
  
  console.log('\n✨ All tests completed!');
}

runTests();
