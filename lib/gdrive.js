const fetch = require("node-fetch");
const cheerio = require("cheerio");
const { sizeFormatter } = require("human-readable");

const formatSize = sizeFormatter({
  std: "JEDEC",
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
});

async function GDriveDl(url) {
  let result = { error: true };

  if (!url || !url.match(/drive\.google/i)) return result;

  try {
    let id = (url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/) || [])[1];
    if (!id) throw new Error("ID Not Found");

    const res = await fetch(`https://drive.google.com/uc?export=download&id=${id}`, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
      },
    });

    const html = await res.text();

    // If quota exceeded, file has confirmation prompt
    if (html.includes("Quota exceeded") || html.includes("downloadQuotaExceeded")) {
      throw new Error("⚠️ Link blocked or quota exceeded. Try making a copy in your Drive.");
    }

    const $ = cheerio.load(html);
    const fileName = $("span.uc-name-size").text().split(" (")[0] || "Unknown";
    const sizeText = $("span.uc-name-size").text().split(" (")[1]?.replace(")", "") || "Unknown size";

    const confirmMatch = html.match(/confirm=([a-zA-Z0-9-_]+)/);
    const confirmToken = confirmMatch ? confirmMatch[1] : null;
    const downloadUrl = confirmToken
      ? `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${id}`
      : `https://drive.google.com/uc?export=download&id=${id}`;

    return {
      downloadUrl,
      fileName,
      fileSize: sizeText,
      mimetype: "application/octet-stream",
    };
  } catch (e) {
    console.error("[GDriveDl Error]", e.message);
    return { error: true, message: e.message };
  }
}

module.exports = GDriveDl;
