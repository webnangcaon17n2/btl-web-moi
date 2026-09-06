require('dotenv').config({ path: __dirname + '/.env' });

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await res.json();
  if (data.models) {
    console.log('Các model khả dụng:');
    data.models
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .forEach(m => console.log(' - ' + m.name + ' (' + m.displayName + ')'));
  } else {
    console.log('Error listing models:', data);
  }
}

listModels();
