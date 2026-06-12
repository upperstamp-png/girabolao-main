import fs from "fs";

const content = fs.readFileSync("src/integrations/supabase/types.ts", "utf8");
const match = content.match(/Functions: \{([\s\S]*?)\n    \}/);
if (match) {
  console.log("Functions in database:");
  const functionsSection = match[1];
  const functionNames = [...functionsSection.matchAll(/([a-zA-Z0-9_]+): \{/g)].map(m => m[1]);
  console.log(functionNames);
} else {
  console.log("Functions section not found in types.ts");
}
