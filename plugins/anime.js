const axios = require("axios");
const fetchJson = require("../lib/fetchJson"); // or your fetchJson path
const { GDriveDl } = require("../lib/gdrive"); // adjust path if needed
const { getBuffer } = require("../lib/functions"); // adjust path if needed

cmd({
    pattern: "slanimeclub",	
    react: '📑',
    category: "movie",
    desc: "slanimeclub movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, prefix, q, l, isDev, reply }) => {
  try {

    if (!q) return await reply('*Please Give Me Text..! 🖊️*')

    const searchRes = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/search?q=${q}&apikey=vajiraofficial`)
    const link = searchRes?.data?.data?.data?.[0]?.link
    if (!link) return reply("❌ Movie not found.")

    const movieRes = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/movie?url=${link}&apikey=vajiraofficial`)
    const movieData = movieRes?.data?.data?.moviedata
    if (!movieData) return reply("❌ Failed to fetch movie details.")

    const caption = `*_☘ Title: ${movieData.title}_*\n
- *Date:* ${movieData.date}
- *Genre:* ${movieData.generous}
*⛏️ Link:* ${q}`

    const imageUrl = movieData.image
    const seasonLink = movieData.seasons?.[0]?.link
    if (!seasonLink) return reply("⚠️ No season link found.")

    await conn.sendMessage(from, {
      image: { url: imageUrl },
      caption: caption
    }, { quoted: mek })

    const downloadRes = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/download?url=${seasonLink}&apikey=vajiraofficial`)
    const downloadUrl = downloadRes?.data?.data?.link

    if (!downloadUrl) return reply("❌ Download link not available.")

    if (downloadUrl.includes("https://slanimeclub.co")) {
      const buffer = await getBuffer(downloadUrl)
      await conn.sendMessage(from, {
        document: buffer,
        mimetype: "video/mp4",
        fileName: `${movieData.title}.mp4`,
        caption: "📥 *Downloaded from SLAnimeClub*"
      }, { quoted: mek })

    } else if (downloadUrl.includes("https://drive.google.com")) {
      const gdriveRes = await GDriveDl(downloadUrl)
      let txt = `*[ Downloading file ]*\n\n`
      txt += `*Name :* ${gdriveRes.fileName}\n`
      txt += `*Size :* ${gdriveRes.fileSize}\n`
      txt += `*Type :* ${gdriveRes.mimetype}`

      await reply(txt)

      await conn.sendMessage(from, {
        document: { url: gdriveRes.downloadUrl },
        mimetype: gdriveRes.mimetype,
        fileName: gdriveRes.fileName,
        caption: `${gdriveRes.fileName}\n\nDownloaded by 𝔾𝕆𝕁𝕆_𝕄𝔻 😈`
      }, { quoted: mek })
    } else {
      reply("❌ Unsupported download link.")
    }

  } catch (e) {
    reply('*❌ ERROR occurred!*')
    console.error("SLAnimeClub Error:", e)
    l(e)
  }
})
