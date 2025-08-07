// Test the question extraction logic
function extractQuestionsFromText(text) {
  const questions = [];
  
  // Split by newlines and extract each line as a potential question
  const lines = text.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    if (line.trim()) {
      questions.push({
        q: line.trim(),
        options: ["A", "B", "C", "D"],
        answer: "A"
      });
    }
  });
  
  return questions;
}

// Test with the same text from the chat
const testText = `Who is the prime minister of india?

what do they do?
and what their real name?`;

console.log('Testing question extraction...');
console.log('Input text:', testText);
console.log('---');

const questions = extractQuestionsFromText(testText);
console.log('Questions found:', questions.length);
questions.forEach((q, index) => {
  console.log(`${index + 1}. ${q.q}`);
});

console.log('---');
console.log('This should find 3 questions, not 1!');
