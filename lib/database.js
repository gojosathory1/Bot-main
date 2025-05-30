const { JSDOM } = require("jsdom");
const fetch = require("node-fetch");
const sizeFormatter = require("human-readable");

async function GDriveDl(gdUrl) {
    try {
        let fileId = null;

        if (gdUrl.includes("id=")) {
            fileId = gdUrl.split("id=")[1].split("&")[0];
        } else if (gdUrl.includes("/d/")) {
            fileId = gdUrl.split("/d/")[1].split("/")[0];
        }

        if (!fileId) return { error: true, message: "Invalid Google Drive URL." };

        const pageUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const confirmPage = await fetch(pageUrl, { method: "GET" });

        const html = await confirmPage.text();

        // Try to extract confirm token for large files
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const form = document.querySelector("form");
        const actionUrl = form ? form.getAttribute("action") : null;

        if (!actionUrl) {
            return {
                error: true,
                message: "Quota exceeded or unable to fetch file directly. Try making a copy to your own Drive.",
            };
        }

        const downloadUrl = `https://drive.google.com${actionUrl}`;
        const fileName = document.querySelector("span.uc-name-size b")?.textContent || "Unknown";
        const sizeText = document.querySelector("span.uc-name-size")?.textContent.split("(")[1]?.replace(")", "").trim();
        const sizeBytes = sizeText ? convertSizeToBytes(sizeText) : null;

        return {
            error: false,
            downloadUrl,
            fileName,
            fileSize: sizeFormatter(sizeBytes || 0),
            mimetype: "video/mp4"
        };
    } catch (err) {
        return { error: true, message: `Failed to fetch file. ${err.message}` };
    }
}

// Helper to convert sizes to bytes
function convertSizeToBytes(sizeStr) {
    let [num, unit] = sizeStr.split(" ");
    let bytes = parseFloat(num);
    switch (unit.toUpperCase()) {
        case "KB": return bytes * 1024;
        case "MB": return bytes * 1024 * 1024;
        case "GB": return bytes * 1024 * 1024 * 1024;
        default: return bytes;
    }
}
