const { cmd } = require('../lib/command');
const { getBuffer, getThumbnailBuffer } = require('../lib/functions');
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../settings');

cmd({
    pattern: "anime",
    react: '📑',
    category: "movie",
    desc: "Download Sinhala subbed anime from SlanimeClub",
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {
    const lang = config.LANG === 'SI';
    try {
        if (!q) return reply(lang ? '*කරුණාකර සෙවීමක් ලබා දෙන්න..! 🖊️*' : '*Please provide a search term..! 🖊️*');

        await reply(lang ? '🔍 සෙවෙමින් සිටී...' : '🔍 Searching...');

        // Fetch homepage and filter
        const baseURL = "https://slanimeclub.co";
        const { data: html } = await axios.get(baseURL);
        const $ = cheerio.load(html);

        let found = null;
        $('.result-item').each((i, el) => {
            const title = $(el).find('.post-title a').text().trim();
            if (title.toLowerCase().includes(q.toLowerCase())) {
                found = {
                    title,
                    link: $(el).find('.post-title a').attr('href'),
                    image: $(el).find('img').attr('src')
                };
                return false;
            }
        });

        if (!found) return reply(lang ? "*ප්‍රතිඵලයක් හමු නොවුණි*" : "*No anime found with that name*");

        const { data: page } = await axios.get(found.link);
        const $$ = cheerio.load(page);
        const downloadBtn = $$('a.wp-block-button__link[href*="https://"]').first().attr('href');

        if (!downloadBtn) return reply(lang ? '*බාගත කිරීමේ ලින්ක් එක හමු නොවුණි*' : '*Download link not found*');

        await conn.sendMessage(from, {
            image: { url: found.image },
            caption: lang
                ? `*_☘ මාතෘකාව: ${found.title}_*\n\n*බාගත කිරීමේ ලින්ක් එක සොයාගෙන ඇත. උඩුගත වෙමින්...*`
                : `*_☘ Title: ${found.title}_*\n\n*Download link found. Uploading...*`
        }, { quoted: mek });

        await conn.sendMessage(from, {
            document: { url: downloadBtn },
            mimetype: "video/mp4",
            fileName: `${found.title}.mp4`,
            caption: `${found.title}\n\n${config.FOOTER}`,
            jpegThumbnail: await getThumbnailBuffer(config.LOGO)
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        reply(lang ? '✅ ඔබගේ චිත්‍රපටය උඩුගත විය' : '✅ Your anime was uploaded successfully');

    } catch (e) {
        console.error(e);
        reply(lang ? '*දෝෂයක් සිදු විය.. නැවත උත්සහ කරන්න*' : '*Something went wrong.. please try again*');
    }
});
