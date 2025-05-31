const { cmd } = require('../lib/command');
const { fetchHtml, getBuffer, getThumbnailBuffer } = require('../lib/functions');
const cheerio = require('cheerio');
const config = require('../settings');

cmd({
    pattern: "slanimeclub",
    react: '📥',
    category: "movie",
    desc: "Scrapes Sinhala Anime from slanimeclub.co",
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {
    const lang = config.LANG === 'SI';
    try {
        if (!q) return reply(lang ? '*කරුණාකර සෙවීමක් ලබා දෙන්න*' : '*Please provide a search term*');

        const searchUrl = `https://slanimeclub.co/?s=${encodeURIComponent(q)}`;
        const html = await fetchHtml(searchUrl);
        const $ = cheerio.load(html);
        const firstPost = $('.post-thumbnail a').first();

        if (!firstPost.attr('href')) return reply(lang ? '*ප්‍රතිඵලයක් හමු නොවුණි*' : '*No results found*');

        const animeUrl = firstPost.attr('href');
        const animeTitle = firstPost.attr('title');
        const animeThumb = firstPost.find('img').attr('src');

        const animePage = await fetchHtml(animeUrl);
        const $$ = cheerio.load(animePage);
        const links = [];

        $$('.su-button-center a, a[href*=".mp4"], a[href*="drive.google.com"]').each((i, el) => {
            const url = $$(el).attr('href');
            const text = $$(el).text().trim();
            if (url) links.push({ url, text });
        });

        if (links.length === 0) return reply(lang ? '*බාගත කිරීම සදහා කිසිඳු ලින්ක් නොමැත*' : '*No download links found*');

        // Send poster & caption
        const caption = `🎞️ *${animeTitle}*\n\n📥 *Available Downloads:*\n\n` + links.map((v, i) => `${i + 1}. ${v.text || v.url}`).join('\n');
        await conn.sendMessage(from, {
            image: { url: animeThumb },
            caption
        }, { quoted: mek });

        // Try to send the first MP4/Drive link
        const firstLink = links.find(v => v.url.includes('.mp4') || v.url.includes('drive.google.com'));
        if (!firstLink) return;

        if (firstLink.url.includes('.mp4')) {
            await conn.sendMessage(from, {
                document: { url: firstLink.url },
                mimetype: 'video/mp4',
                caption: animeTitle,
                fileName: `${animeTitle}.mp4`,
                jpegThumbnail: await getThumbnailBuffer(config.LOGO)
            }, { quoted: mek });
        } else if (firstLink.url.includes('drive.google.com')) {
            reply(`📎 *Google Drive Link*\n${firstLink.url}`);
        }

    } catch (e) {
        console.error(e);
        reply(lang ? '*දෝෂයක් සිදු විය. නැවත උත්සහ කරන්න.*' : '*An error occurred. Please try again.*');
    }
});
