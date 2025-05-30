const config = require('../settings');
const { cmd } = require('../lib/command');
const { getBuffer, fetchJson } = require('../lib/functions');
const { sizeFormatter } = require('human-readable');
const GDriveDl = require('../lib/gdrive.js');
const N_FOUND = "*I couldn't find anything :(*";

// 🔍 Search for anime
cmd({
    pattern: "slanimeclub",
    react: '📑',
    category: "movie",
    desc: "slanimeclub movie downloader",
    filename: __filename
}, async (conn, m, mek, { from, prefix, q, l, reply }) => {
    try {
        if (!q) return await reply('*Please Give Me Text..! 🖊️*');

        const data = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/search?q=${q}&apikey=vajiraofficial`);

        if (!data?.data?.data?.data?.length) {
            return await conn.sendMessage(from, { text: N_FOUND }, { quoted: mek });
        }

        const srh = data.data.data.data.map((item, i) => ({
            title: `${i + 1}`,
            description: item.title,
            rowId: `${prefix}slanime ${item.link}`
        }));

        const sections = [{ title: "_[Result from slanimeclub.]_", rows: srh }];

        const listMessage = {
            text: '',
            footer: config.FOOTER,
            title: 'Result from slanimeclub. 📲',
            buttonText: '*🔢 Reply below number*',
            sections
        };

        return await conn.replyList(from, listMessage, { quoted: mek });
    } catch (e) {
        reply('*ERROR !!*');
        l(e);
    }
});

// 📄 Show anime episode list
cmd({
    pattern: "slanime",
    react: '📑',
    category: "movie",
    desc: "slanimeclub anime info",
    filename: __filename
}, async (conn, m, mek, { from, prefix, q, l, reply }) => {
    try {
        if (!q) return await reply('*Please Give Me Text..! 🖊️*');

        const data = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/movie?url=${q}&apikey=vajiraofficial`);
        const movie = data.data?.data?.moviedata;

        if (!movie) return await reply(N_FOUND);

        const cap = `*_\u2618 Title: ${movie.title}_*\n\n- *Date:* ${movie.date}\n- *Generous:* ${movie.generous}\n\n*\u2692\ufe0f Link:* ${q}`;

        if (!movie.seasons?.length) return await reply(N_FOUND);

        const srh = movie.seasons.map((s, i) => ({
            title: `${i + 1}`,
            description: `${s.title} | ${s.number} | ${s.date}`,
            rowId: `${prefix}slanimedl ${s.link}|${s.title}`
        }));

        const sections = [{ title: "_[Episodes from slanimeclub.]_", rows: srh }];

        const listMessage = {
            caption: cap,
            image: { url: movie.image },
            footer: config.FOOTER,
            title: 'Episodes from slanimeclub 📺',
            buttonText: '*🔢 Reply below number*',
            sections
        };

        return await conn.replyList(from, listMessage, { quoted: mek });
    } catch (e) {
        reply('*ERROR !!*');
        l(e);
    }
});

// ⬇️ Download selected episode
cmd({
    pattern: 'slanimedl',
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    if (!q) return await reply('*Please provide a direct URL!*');

    try {
        const [mediaUrl, title = 'slanime_video'] = q.split("|");

        const data = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/download?url=${mediaUrl}&apikey=vajiraofficial`);
        const dl_link = data?.data?.data?.link;

        if (!dl_link) return await reply('*Unable to fetch download link.*');

        await reply('╭═════════════════❀\n│  UPLOADING YOUR VIDEO 📥\n│ ❀ Please wait a few moments...\n╰═════════════════❀');

        if (dl_link.includes("slanimeclub.co")) {
            const message = {
                document: await getBuffer(dl_link),
                caption: `${title}\n\n${config.FOOTER}`,
                mimetype: "video/mp4",
                fileName: `${title}.mp4`
            };
            await conn.sendMessage(from, message);
        } else if (dl_link.includes("drive.google.com")) {
            const res = await GDriveDl(dl_link);

            if (res?.downloadUrl) {
                const txt = `*[ Downloading from Google Drive ]*\n\n*Name:* ${res.fileName}\n*Size:* ${res.fileSize}\n*Type:* ${res.mimetype}`;
                await reply(txt);
                await conn.sendMessage(from, {
                    document: { url: res.downloadUrl },
                    caption: `${res.fileName}\n\n${config.FOOTER}`,
                    fileName: res.fileName,
                    mimetype: res.mimetype
                }, { quoted: mek });
            } else {
                await reply('*Google Drive Link is not downloadable.*');
            }
        } else {
            await reply('*Unsupported download link format.*');
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('Error fetching or sending:', error);
        await reply('*Error fetching or sending*');
    }
});
