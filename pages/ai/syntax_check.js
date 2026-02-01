const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
const content = fs.readFileSync(filePath, 'utf8');

// Extract script content
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
    const scriptContent = scriptMatch[1];
    try {
        new Function(scriptContent);
        console.log("Syntax OK");
    } catch (e) {
        console.error("Syntax Error:", e);
    }
} else {
    console.log("No script found");
}
