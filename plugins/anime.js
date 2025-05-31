const { cmd } = require('../lib/command');
const { getBuffer, getThumbnailBuffer } = require('../lib/functions');
const cheerio = require('cheerio');
const axios = require('axios');
const config = require('../settings');

cmd({
    pattern: "slanimeclub",
    react: '🎥',
    category: "movie",
    desc: "Download Sinhala Subbed Anime from slanimeclub.co",
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {
    const lang = config.LANG === 'SI';

    try {
        if (!q) return reply(lang ? '*කරුණාකර සෙවීමක් ලබා දෙන්න 🖊️*' : '*Please provide a search term 🖊️*');

        const searchUrl = `https://slanimeclub.co/?s=${encodeURIComponent(q)}`;
        const { data: searchHtml } = await axios.get(searchUrl);
        const $ = cheerio.load(searchHtml);

        const firstResult = $('.result-item').first();
        if (!firstResult || !firstResult.find('a').attr('href')) {
            return reply(lang ? '*ඇනීමේ නමකට අනූව කිසිවක් හමු නොවුණි*' : '*No anime found with that name*');
        }

        const animePageUrl = firstResult.find('a').attr('href');
        const animeImage = firstResult.find('img').attr('src');
        const animeTitle = firstResult.find('.title').text().trim();

        const { data: animePageHtml } = await axios.get(animePageUrl);
        const $$ = cheerio.load(animePageHtml);

        const videoLink = $$('.mirror-button a[href$=".mp4"]').first().attr('href');
        if (!videoLink) return reply(lang ? '*🎞️ Video link එක සොයාගත නොහැක*' : '*🎞️ Unable to find video link*');

        const caption = lang
            ? `🎞️ *මාතෘකාව:* ${animeTitle}\n\n*⏩ MP4 වීඩියෝව යවමින්...*`
            : `🎞️ *Title:* ${animeTitle}\n\n*⏩ Sending MP4 video...*`;

        await conn.sendMessage(from, {
            image: { url: animeImage },
            caption
        }, { quoted: mek });

        await conn.sendMessage(from, {
            document: await getBuffer(videoLink),
            fileName: `${animeTitle}.mp4`,
            mimetype: 'video/mp4',
            caption: animeTitle,
            jpegThumbnail: await getThumbnailBuffer(config.LOGO)
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error(err);
        reply(lang ? '*දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.*' : '*An error occurred. Please try again.*');
    }
});
