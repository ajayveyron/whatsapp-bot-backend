import { handler } from './api/webhook.js';

// Mock request and response objects
const mockRequest = {
  method: 'POST',
  body: {
    From: 'whatsapp:+919876543210',
    Body: 'Hello, this is a test message',
    NumMedia: '0'
  }
};

const mockResponse = {
  status: (code) => {
    console.log('Response status:', code);
    return mockResponse;
  },
  send: (data) => {
    console.log('Response data:', data);
    return mockResponse;
  }
};

// Test the handler
async function testHandler() {
  console.log('🧪 Testing webhook handler locally...');
  
  try {
    await handler(mockRequest, mockResponse);
    console.log('✅ Handler test completed');
  } catch (error) {
    console.log('❌ Handler test failed:', error.message);
  }
}

testHandler();
