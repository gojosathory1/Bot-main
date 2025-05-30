const { cmd } = require("../command");
const axios = require("axios");
const path = require("path");

cmd(
  {
    pattern: "download",
    desc: "Download file from direct link",
    category: "download",
    react: "🔰",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    { from, q, reply }
  ) => {
    try {
      if (!q) return reply("*🔗 Direct link එකක් දාන්න!*");

      await reply("🕐 *File එක Download වෙමින් පවතී...*");

      const response = await axios.get(q, { responseType: "arraybuffer" });
      const contentType = response.headers["content-type"] || "application/octet-stream";
      const contentDisposition = response.headers["content-disposition"];
      let fileName = "downloaded_file";

      if (contentDisposition && contentDisposition.includes("filename=")) {
        fileName = contentDisposition.split("filename=")[1].replace(/["']/g, "");
      } else {
        fileName = path.basename(q.split("?")[0]);
      }

      await robin.sendMessage(
        from,
        {
          document: Buffer.from(response.data),
          mimetype: contentType,
          fileName: fileName,
          caption: `✅ *File Downloaded Successfully!*

📂 *File Name:* ${fileName}

🔗 *Source:* ${q}

┏━━━━━━━━━━━━━━┓
┃   ⚡ *Powered by Sayura* ⚡
┗━━━━━━━━━━━━━━┛`,
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error(e);
      reply("❌ *Download එකට Error එකක් තියෙනවා! Valid direct link එකක් දාන්න.*");
    }
  }
);
