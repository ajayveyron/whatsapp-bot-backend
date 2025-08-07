import fetch from 'node-fetch';

const WEBHOOK_URL = 'https://whatsapp-bot-backend.vercel.app/api/webhook';

// Test 1: Simulate a regular message
async function testRegularMessage() {
  console.log('🧪 Testing regular message...');
  
  const formData = new URLSearchParams();
  formData.append('From', 'whatsapp:+919876543210');
  formData.append('Body', 'Hello, this is a test message');
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
    console.log('✅ Regular message test:', response.status, result);
  } catch (error) {
    console.log('❌ Regular message test failed:', error.message);
  }
}

// Test 2: Simulate the "done" command
async function testDoneCommand() {
  console.log('\n🧪 Testing "done" command...');
  
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

// Test 3: Simulate an image message
async function testImageMessage() {
  console.log('\n🧪 Testing image message...');
  
  const formData = new URLSearchParams();
  formData.append('From', 'whatsapp:+919876543210');
  formData.append('Body', '');
  formData.append('NumMedia', '1');
  formData.append('MediaUrl0', 'https://example.com/test-image.jpg');
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

// Run all tests
async function runTests() {
  console.log('🚀 Starting webhook tests...\n');
  
  await testRegularMessage();
  await testDoneCommand();
  await testImageMessage();
  
  console.log('\n✨ All tests completed!');
}

runTests();
