import fetch from 'node-fetch';

const WEBHOOK_URL = 'https://whatsapp-bot-backend.vercel.app/api/webhook';

// Test with multiple questions in one message
async function testMultipleQuestions() {
  console.log('🧪 Testing multiple questions in one message...');
  
  const formData = new URLSearchParams();
  formData.append('From', 'whatsapp:+919876543210');
  formData.append('Body', 'Who is the prime minister of india?\n\nwhat do they do?\nand what their real name?');
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
    console.log('✅ Multiple questions test:', response.status, result);
  } catch (error) {
    console.log('❌ Multiple questions test failed:', error.message);
  }
}

// Test the "done" command after sending multiple questions
async function testDoneCommand() {
  console.log('\n🧪 Testing "done" command after multiple questions...');
  
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

// Run tests
async function runTests() {
  console.log('🚀 Starting multiple questions tests...\n');
  
  await testMultipleQuestions();
  await testDoneCommand();
  
  console.log('\n✨ All tests completed!');
}

runTests();
