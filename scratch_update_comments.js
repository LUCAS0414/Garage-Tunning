const fs = require('fs');
const path = require('path');

function formatText(text) {
  // Remove known useless
  if (text.match(/----\s*GUARD/i)) return '';
  if (text.match(/^[=\-]+$/)) return ''; // just dashes
  
  // Section vs Explanation
  const words = text.split(/\s+/).length;
  if (words <= 3 && !text.endsWith('.') && !text.includes(',')) {
    return text.toUpperCase();
  } else {
    let lower = text.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
}

function processJs(code) {
  const lines = code.split('\n');
  const outLines = [];
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Remove block comments like /** ... */
    if (line.trim().startsWith('/**') || line.trim().startsWith('/*')) {
      inBlockComment = true;
    }
    if (inBlockComment) {
      if (line.includes('*/')) {
        inBlockComment = false;
      }
      continue; // skip block comments
    }

    if (line.match(/\/\/\s*----\s*GUARD/i)) continue;

    const commentMatch = line.match(/^(\s*)\/\/\s*(.*)$/);
    if (commentMatch) {
      const indent = commentMatch[1];
      let text = commentMatch[2].trim();

      if (!text || text.match(/^[=\-]+$/) || text.startsWith('TODO')) {
        if (!text || text.match(/^[=\-]+$/)) continue;
      }

      if (text.includes(';') || text.includes(' = ') || text.includes('()')) {
        outLines.push(line);
        continue;
      }

      text = formatText(text);
      if (text) outLines.push(`${indent}// ${text}`);
      continue;
    }
    
    const inlineMatch = line.match(/^(.*?[^:])\/\/\s*(.*)$/);
    if (inlineMatch && !inlineMatch[1].includes('"') && !inlineMatch[1].includes("'") && !inlineMatch[1].includes('`')) {
      const codePart = inlineMatch[1];
      let text = inlineMatch[2].trim();
      
      if (text && !text.includes(';') && !text.includes(' = ') && !text.includes('()')) {
        text = formatText(text);
        if (text) line = `${codePart}// ${text}`;
        else line = codePart.trimRight();
      }
    }

    outLines.push(line);
  }

  return outLines.join('\n').replace(/\n\n\n+/g, '\n\n');
}

function processHtml(code) {
  // Replace HTML comments <!-- ... -->
  // Note: Ignore commented out HTML tags like <!-- <div> -->
  return code.replace(/<!--([\s\S]*?)-->/g, (match, p1) => {
    let text = p1.trim();
    if (!text || text.includes('<') || text.includes('>')) {
      // either empty or contains HTML tags
      return match;
    }
    
    // Check for specific comments to remove
    if (text.match(/Gerado via JS/i) || text.match(/^[=\-]+$/)) {
      return ''; // Actually, user might consider "Gerado via JS" as useless or explanatory. I'll just format it.
    }

    text = formatText(text);
    if (!text) return '';
    return `<!-- ${text} -->`;
  });
}

function processDirectory(dir, isHtmlAllowed = false) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath, isHtmlAllowed);
    } else {
      let changed = false;
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (file.endsWith('.js')) {
        content = processJs(content);
        changed = true;
      } else if (isHtmlAllowed && file.endsWith('.html')) {
        content = processHtml(content);
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Processed ${fullPath}`);
      }
    }
  }
}

// Process services directory (JS only)
processDirectory(path.join(__dirname, 'services'), false);

// Process public directory (HTML only, JS was already done but can be done again safely)
processDirectory(path.join(__dirname, 'public'), true);

console.log('All requested files processed.');
