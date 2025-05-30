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
  const result = {
    error: true,
    downloadUrl: null,
    fileName: null,
    fileSize: null,
    mimetype: null,
    message: null,
  };

  if (!url || !url.match(/drive\.google/i)) {
    result.message = "❌ Invalid Google Drive URL.";
    return result;
  }

  try {
    const id = (url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/) || [])[1];
    if (!id) throw new Error("ID Not Found");

    const res = await fetch(`https://drive.google.com/uc?export=download&id=${id}`, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const html = await res.text();

    if (html.includes("Quota exceeded") || html.includes("downloadQuotaExceeded")) {
      throw new Error("⚠️ Link blocked or quota exceeded. Try making a copy in your Drive.");
    }

    const $ = cheerio.load(html);
    const fileMetaText = $("span.uc-name-size").text(); // e.g., "solo-1.mp4 (254 MB)"
    const fileName = fileMetaText.split(" (")[0] || "Unknown";
    const fileSizeText = fileMetaText.split(" (")[1]?.replace(")", "") || "Unknown";

    const confirmToken = html.match(/confirm=([a-zA-Z0-9-_]+)/)?.[1];
    const downloadUrl = confirmToken
      ? `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${id}`
      : `https://drive.google.com/uc?export=download&id=${id}`;

    // Optionally check content type by hitting download URL
    const head = await fetch(downloadUrl, { method: "HEAD" });
    const contentType = head.headers.get("content-type") || "application/octet-stream";

    return {
      error: false,
      downloadUrl,
      fileName,
      fileSize: fileSizeText,
      mimetype: contentType,
    };
  } catch (e) {
    console.error("[GDriveDl Error]", e.message);
    result.message = e.message;
    return result;
  }
}

module.exports = GDriveDl;
