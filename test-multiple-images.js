import fetch from 'node-fetch';

const WEBHOOK_URL = 'https://whatsapp-bot-backend.vercel.app/api/webhook';

// Test with multiple images
async function testMultipleImages() {
  console.log('🧪 Testing multiple images...');
  
  // First image
  const formData1 = new URLSearchParams();
  formData1.append('From', 'whatsapp:+919876543210');
  formData1.append('Body', '');
  formData1.append('NumMedia', '1');
  formData1.append('MediaUrl0', 'https://i.postimg.cc/vT9CxLCc/Screenshot-2025-08-07-at-12-45-13-PM.png');
  formData1.append('MediaContentType0', 'image/png');
  
  try {
    const response1 = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData1.toString(),
    });
    
    const result1 = await response1.text();
    console.log('✅ First image test:', response1.status, result1);
  } catch (error) {
    console.log('❌ First image test failed:', error.message);
  }
  
  // Second image (same for testing)
  const formData2 = new URLSearchParams();
  formData2.append('From', 'whatsapp:+919876543210');
  formData2.append('Body', '');
  formData2.append('NumMedia', '1');
  formData2.append('MediaUrl0', 'https://i.postimg.cc/vT9CxLCc/Screenshot-2025-08-07-at-12-45-13-PM.png');
  formData2.append('MediaContentType0', 'image/png');
  
  try {
    const response2 = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData2.toString(),
    });
    
    const result2 = await response2.text();
    console.log('✅ Second image test:', response2.status, result2);
  } catch (error) {
    console.log('❌ Second image test failed:', error.message);
  }
}

// Test "done" command after multiple images
async function testDoneAfterMultipleImages() {
  console.log('\n🧪 Testing "done" command after multiple images...');
  
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
    console.log('✅ Done after multiple images test:', response.status, result);
  } catch (error) {
    console.log('❌ Done after multiple images test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting multiple images tests...\n');
  
  await testMultipleImages();
  await testDoneAfterMultipleImages();
  
  console.log('\n✨ All tests completed!');
}

runTests();
