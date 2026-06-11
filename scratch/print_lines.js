const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\paulo\\.gemini\\antigravity\\brain\\5d8133b4-4517-4577-83ce-d9ca4683eed9\\.system_generated\\logs\\transcript.jsonl';

async function printLines() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    index++;
    if (index >= 5776 && index <= 5790) {
      try {
        const parsed = JSON.parse(line);
        console.log(`[Line ${index}] Type: ${parsed.type}, Source: ${parsed.source}`);
        console.log(parsed.content);
        console.log('==================================================');
      } catch (e) {
        console.log(`[Line ${index}] Raw: ${line}`);
      }
    }
  }
}

printLines();
