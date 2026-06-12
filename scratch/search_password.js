import fs from "fs";
import path from "path";

const keywords = ["password", "db_pass", "senha", "postgres://", "postgresql://"];
const ignoreDirs = [".git", "node_modules", ".temp", ".vercel", ".tanstack", "dist"];

function searchFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const kw of keywords) {
      if (content.includes(kw)) {
        console.log(`Found keyword "${kw}" in file: ${filePath}`);
        // Print lines containing the keyword
        const lines = content.split("\n");
        lines.forEach((line, idx) => {
          if (line.includes(kw) && !line.includes("password_hash") && !line.includes("pin_hash")) {
            console.log(`  Line ${idx + 1}: ${line.trim().slice(0, 100)}`);
          }
        });
      }
    }
  } catch (err) {
    // Ignore read errors
  }
}

function traverse(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    return;
  }
  for (const file of files) {
    const fullPath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (err) {
      continue;
    }
    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        traverse(fullPath);
      }
    } else {
      searchFile(fullPath);
    }
  }
}

console.log("Searching for passwords/DB connections...");
traverse(".");
console.log("Done searching.");
