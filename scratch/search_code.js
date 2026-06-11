const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/paulo/0-dev/02-aplicacoes/05 meus-politicos/app/src';

function searchDir(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, pattern);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (pattern.test(content)) {
        console.log(`Match in ${fullPath}:`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            console.log(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('--- SEARCHING FOR "prefeito" OR "vereador" or "camara" ---');
searchDir(srcDir, /prefeito|vereador|camara|vereadores/i);
