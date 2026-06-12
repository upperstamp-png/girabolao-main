async function testFeed(url) {
  console.log("Testing RSS Feed:", url);
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Length of response:", text.length);
    console.log("Snippet (first 500 chars):", text.slice(0, 500));
  } catch (err) {
    console.error("Error fetching RSS:", err.message);
  }
}

async function main() {
  await testFeed("https://www.espn.com/espn/rss/soccer/news");
  console.log("\n--------------------------------------------------\n");
  await testFeed("https://ge.globo.com/rss/ge/futebol/futebol-internacional/");
}

main().catch(console.error);
