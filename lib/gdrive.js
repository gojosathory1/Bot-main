const fetch = require('node-fetch');
const { sizeFormatter } = require('human-readable');

const formatSize = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`
});

async function GDriveDl(url) {
  let id;
  const result = { error: true };

  if (!url || !url.match(/drive\.google/i)) return result;

  try {
    id = (url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/) || [])[1];
    if (!id) throw new Error('❌ ID not found in URL');

    const initialURL = `https://drive.google.com/uc?export=download&id=${id}`;
    const initialRes = await fetch(initialURL);
    const initialText = await initialRes.text();

    // Check for confirm token
    const confirmMatch = initialText.match(/confirm=([a-zA-Z0-9\-_]+)/);
    const confirm = confirmMatch ? confirmMatch[1] : null;

    if (!confirm) throw new Error("⚠️ Link blocked or quota exceeded. Try making a copy in your Drive.");

    // Final download URL with confirm token
    const downloadURL = `https://drive.google.com/uc?export=download&confirm=${confirm}&id=${id}`;
    const finalRes = await fetch(downloadURL, { method: 'GET' });

    if (!finalRes.ok || finalRes.headers.get("content-type").includes("text/html")) {
      throw new Error("⚠️ File download blocked or returned HTML.");
    }

    // Extract filename
    const disposition = finalRes.headers.get('content-disposition') || '';
    let fileName = 'unknown';
    if (disposition.includes("filename=")) {
      const match = disposition.match(/filename\*=UTF-8''(.+)|filename="(.+)"/);
      fileName = decodeURIComponent(match?.[1] || match?.[2] || 'unknown').replace(/\+/g, ' ');
    }

    // Prepare final result
    return {
      error: false,
      downloadUrl: downloadURL,
      fileName,
      fileSize: formatSize(Number(finalRes.headers.get('content-length') || 0)),
      mimetype: finalRes.headers.get('content-type') || 'application/octet-stream'
    };

  } catch (err) {
    console.error('[GDriveDl Error]', err.message);
    return { error: true, message: err.message };
  }
}

module.exports = GDriveDl;
