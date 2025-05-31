const { cmd } = require('../lib/command');
const { getBuffer, getThumbnailBuffer } = require('../lib/functions');
const config = require('../settings');
const cheerio = require('cheerio');
const axios = require('axios');

cmd({
    pattern: "slanimeclub",
    react: '📑',
    category: "movie",
    desc: "Download Sinhala subbed anime from slanimeclub.co",
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {
    const lang = config.LANG === 'SI';
    if (!q) return reply(lang ? '*කරුණාකර සෙවීමක් ලබා දෙන්න..! 🖊️*' : '*Please provide a search term..! 🖊️*');

    try {
        // Search page
        const searchURL = `https://slanimeclub.co/?s=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchURL);
        const $ = cheerio.load(searchRes.data);

        const firstResult = $('.ml-mask').first();
        if (!firstResult.length) {
            return reply(lang ? "*ප්‍රතිඵලයක් හමු නොවුණි*" : "*No anime found with that name*");
        }

        const animePage = firstResult.find('a').attr('href');
        const title = firstResult.find('.mli-info h2').text().trim();
        const image = firstResult.find('img').attr('src');

        // Get episode link
        const animeRes = await axios.get(animePage);
        const $$ = cheerio.load(animeRes.data);
        const epLink = $$('a[href*="slanimeclub.co/wp-content"]').first().attr('href');

        if (!epLink) {
            return reply(lang ? "*බාගත කිරීමේ සබැඳියක් හමු නොවුණි*" : "*No download link found*");
        }

        // Send poster
        await conn.sendMessage(from, {
            image: { url: image },
            caption: `🎞️ *${title}*\n\n🔗 ${animePage}`
        }, { quoted: mek });

        // Send mp4 file
        await conn.sendMessage(from, {
            document: { url: epLink },
            caption: `${title}\n\n${config.FOOTER}`,
            fileName: `${title}.mp4`,
            mimetype: "video/mp4",
            jpegThumbnail: await getThumbnailBuffer(config.LOGO)
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        reply(lang ? '✅ චිත්‍රපටය සාර්ථකව යැවිය' : '✅ Anime sent successfully');

    } catch (err) {
        console.error(err);
        reply(lang ? '*දෝෂයක් සිදු විය*' : '*Something went wrong*');
    }
});
