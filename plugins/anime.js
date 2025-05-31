const l = console.log
const config = require('../settings')
const { cmd, commands } = require('../lib/command')
const axios = require("axios");

const { fetchJson } = require('../lib/function');
const { GDriveDl } = require('../lib/gdrive');

  // ✅ Import Required Functions
// Ensure fetchJson, GDriveDl, getThumbnailBuffer, and config are imported in your main file

cmd({
    pattern: "slanimeclub",
    react: '📑',
    category: "movie",
    desc: "Search anime from slanimeclub",
    filename: __filename
}, async (conn, m, mek, { from, prefix, q, l, reply }) => {
    const lang = config.LANG === 'SI';
    try {
        if (!q) return await reply(lang ? '*කරුණාකර පණිවිඩයක් ලබා දෙන්න..! 🖊️*' : '*Please give me a search term..! 🖊️*');

        const data = await fetchJson(`${config.API}/api/slanimeclub/search?q=${q}&apikey=${config.APIKEY}`);
        if (!data.data?.data?.data?.length) {
            return conn.sendMessage(from, { text: lang ? "*ප්‍රතිඵල නැත :(*" : "*No results found :(*" }, { quoted: mek });
        }

        const srh = data.data.data.data.map((anime, i) => ({
            title: `${i + 1}. ${anime.title}`,
            description: `🔗 Url: ${anime.link}`,
            rowId: `${prefix}slanime ${anime.link}`
        }));

        const listMessage = {
            text: '',
            footer: config.FOOTER,
            title: lang ? '📲 slanimeclub එකේ ප්‍රතිඵල' : '📲 Results from slanimeclub',
            buttonText: lang ? '🔢 පහත අංකය තෝරන්න' : '🔢 Choose a number below',
            sections: [{
                title: lang ? '_[slanimeclub එකේ පෙන්වා ඇති ප්‍රතිඵල]_' : '_[Results from slanimeclub]_',
                rows: srh
            }]
        };

        return await conn.replyList(from, listMessage, { quoted: mek });
    } catch (e) {
        l(e);
        reply(lang ? '*දෝෂයක් සිදු විය !!*' : '*An error occurred !!*');
    }
});

cmd({
    pattern: "slanime",
    react: '📑',
    category: "movie",
    desc: "Get anime detail from slanimeclub",
    filename: __filename
}, async (conn, m, mek, { from, prefix, q, l, reply }) => {
    const lang = config.LANG === 'SI';
    try {
        if (!q) return await reply(lang ? '*කරුණාකර URL එකක් ලබා දෙන්න..! 🖊️*' : '*Please give me the anime URL..! 🖊️*');

        const data = await fetchJson(`${config.API}/api/slanimeclub/movie?url=${q}&apikey=${config.APIKEY}`);
        const movie = data.data?.data?.moviedata;

        if (!movie?.seasons?.length) {
            return conn.sendMessage(from, { text: lang ? "*ප්‍රතිඵල නැත :(*" : "*No results found :(*" }, { quoted: mek });
        }

        const cap = lang
            ? `*_☘ මාතෘකාව: ${movie.title}_*\n\n- *දිනය:* ${movie.date}\n- *ප්‍රභේදය:* ${movie.generous}\n\n*⛏️ සෘජු ලින්ක්:* ${q}`
            : `*_☘ Title: ${movie.title}_*\n\n- *Date:* ${movie.date}\n- *Genre:* ${movie.generous}\n\n*⛏️ Link:* ${q}`;

        const rows = movie.seasons.map((season, i) => ({
            title: `${i + 1}. ${season.title}`,
            description: `${season.number} | ${season.date}`,
            rowId: `${prefix}slanimedl ${season.link}|${season.title}`
        }));

        const listMessage = {
            caption: cap,
            image: { url: movie.image },
            footer: config.FOOTER,
            title: lang ? '📲 slanimeclub එකේ විස්තර' : '📲 Anime Details from slanimeclub',
            buttonText: lang ? '🔢 පහත තෝරන්න' : '🔢 Select from below',
            sections: [{
                title: lang ? '_[මූලික විස්තර සහ season ලැයිස්තුව]_' : '_[Anime details and season list]_',
                rows
            }]
        };

        return await conn.replyList(from, listMessage, { quoted: mek });
    } catch (e) {
        l(e);
        reply(lang ? '*දෝෂයක් සිදු විය !!*' : '*An error occurred !!*');
    }
});

cmd({
    pattern: `slanimedl`,
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from, q, isDev, reply }) => {
    const lang = config.LANG === 'SI';

    if (!isDev) return reply(lang ? '⚠️ *ඔබගේ ගිණුම Premium භාවිතයට සක්‍රිය කර ගැනීමට හිමිකරු අමතන්න*' : '⚠️ *Contact owner to activate Premium for your number*');

    if (!q) return await reply(lang ? '*කරුණාකර season ලින්ක් එකක් ලබා දෙන්න*' : '*Please provide a valid season URL*');

    try {
        const [mediaUrl, title = 'slanime_download'] = q.split("|");

        const { data } = await fetchJson(`${config.API}/api/slanimeclub/download?url=${mediaUrl}&apikey=${config.APIKEY}`);
        const dl_link = data.data?.link;

        if (!dl_link) return reply(lang ? '*ලින්ක් එක ලබා ගත නොහැක*' : '*Failed to fetch download link*');

        await conn.sendMessage(from, { text: lang ? 'කරුණාකර රැඳී සිටින්න...' : 'Please wait, downloading...' });

        const uploading = await conn.sendMessage(from, { text: lang ? 'උඩුගත කරමින්' : 'Uploading' });

        const steps = ["●○○○○", "●●○○○", "●●●○○", "●●●●○", "●●●●●"];
        for (const step of steps.concat(steps).concat([lang ? 'ඔබගේ චිත්‍රපටය උඩුගත කරමින්...' : 'Uploading your anime...'])) {
            await new Promise(res => setTimeout(res, 500));
            await conn.relayMessage(from, {
                protocolMessage: {
                    key: uploading.key,
                    type: 14,
                    editedMessage: { conversation: step }
                }
            }, {});
        }

        if (dl_link.includes("slanimeclub.co")) {
            await conn.sendMessage(from, {
                document: { url: dl_link },
                caption: `${title}\n\n${config.FOOTER}`,
                mimetype: "video/mp4",
                jpegThumbnail: await getThumbnailBuffer(config.LOGO),
                fileName: `${title}.mp4`
            });
        } else if (dl_link.includes("drive.google.com")) {
            const gdata = await GDriveDl(dl_link);
            await conn.sendMessage(from, {
                document: { url: gdata.downloadUrl },
                caption: `${gdata.fileName}\n\n${config.FOOTER}`,
                mimetype: gdata.mimetype,
                jpegThumbnail: await getThumbnailBuffer(config.LOGO),
                fileName: `${gdata.fileName}.mp4`
            });
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        reply(lang ? '✅ ඔබගේ චිත්‍රපටය සාර්ථකව උඩුගත විය' : '✅ Your anime was successfully uploaded');
    } catch (e) {
        console.error('Download Error:', e);
        reply(lang ? '*දෝෂයක් සිදු විය.. නැවත උත්සහ කරන්න*' : '*Something went wrong.. please try again*');
    }
});  

