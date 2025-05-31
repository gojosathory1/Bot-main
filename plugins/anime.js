const { cmd } = require('../lib/command');
const { fetchJson, getThumbnailBuffer } = require('../lib/functions');
const { GDriveDl } = require('../lib/gdrive');
const config = require('../settings');

cmd({
    pattern: "slanimeclub",
    react: '📑',
    category: "movie",
    desc: "slanimeclub movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {
    const lang = config.LANG === 'SI';

    try {
        if (!q) return reply(lang ? '*කරුණාකර සෙවීමක් ලබා දෙන්න..! 🖊️*' : '*Please provide a search term..! 🖊️*');

        // Search Anime
        const search = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/search?q=${encodeURIComponent(q)}&apikey=vajiraofficial`);
        const anime = search?.data?.data?.data?.[0];

        if (!anime || !anime.link) {
            const msg = search?.message?.toLowerCase().includes("ban")
                ? (lang ? "*⛔ API key එක බ්ලොක් වී ඇත*" : "*⛔ API key is banned or blocked*")
                : (lang ? "*ප්‍රතිඵලයක් හමු නොවුණි*" : "*No anime found with that name*");
            return reply(msg);
        }

        const animeUrl = anime.link;

        // Get Anime Details
        const details = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/movie?url=${animeUrl}&apikey=vajiraofficial`);
        const movie = details?.data?.data?.moviedata;
        const seasons = movie?.seasons || [];

        if (!movie || !seasons.length) {
            return reply(lang ? "*ප්‍රතිඵලයක් නැත*" : "*No data found for that anime*");
        }

        const cap = lang
            ? `*_☘ මාතෘකාව: ${movie.title}_*\n\n- *දිනය:* ${movie.date}\n- *ප්‍රභේදය:* ${movie.generous}\n\n*⛏️ සබැඳිය:* ${animeUrl}`
            : `*_☘ Title: ${movie.title}_*\n\n- *Date:* ${movie.date}\n- *Genre:* ${movie.generous}\n\n*⛏️ Link:* ${animeUrl}`;

        await conn.sendMessage(from, {
            image: { url: movie.image },
            caption: cap
        }, { quoted: mek });

        // Download First Season
        const season = seasons[0];
        const dlRes = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/download?url=${season.link}&apikey=vajiraofficial`);
        const dl_link = dlRes?.data?.data?.link;

        if (!dl_link) return reply(lang ? "*භාවිතය සඳහා ලින්ක් එක ලබාගත නොහැක*" : "*Failed to fetch download link*");

        await conn.sendMessage(from, { text: lang ? 'කරුණාකර රැඳී සිටින්න...' : 'Please wait, downloading...' });

        // Slanimeclub direct link
        if (dl_link.includes("slanimeclub.co")) {
            await conn.sendMessage(from, {
                document: { url: dl_link },
                caption: `${season.title}\n\n${config.FOOTER}`,
                mimetype: "video/mp4",
                fileName: `${season.title}.mp4`,
                jpegThumbnail: await getThumbnailBuffer(config.LOGO)
            }, { quoted: mek });

        // Google Drive link
        } else if (dl_link.includes("drive.google.com")) {
            const gdata = await GDriveDl(dl_link);

            let txt = lang
                ? `*[ගොනුව බාගත කිරීම ආරම්භ විය]*\n\n*නම :* ${gdata.fileName}\n*ප්‍රමාණය :* ${gdata.fileSize}\n*වර්ගය :* ${gdata.mimetype}`
                : `*[ Downloading file ]*\n\n*Name :* ${gdata.fileName}\n*Size :* ${gdata.fileSize}\n*Type :* ${gdata.mimetype}`;
            await reply(txt);

            await conn.sendMessage(from, {
                document: { url: gdata.downloadUrl },
                caption: `${gdata.fileName}\n\n${config.FOOTER}`,
                fileName: gdata.fileName,
                mimetype: gdata.mimetype,
                jpegThumbnail: await getThumbnailBuffer(config.LOGO)
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        reply(lang ? '✅ ඔබගේ චිත්‍රපටය සාර්ථකව උඩුගත විය' : '✅ Your anime was successfully uploaded');

    } catch (e) {
        console.error(e);
        reply(lang ? '*දෝෂයක් සිදු විය.. නැවත උත්සහ කරන්න*' : '*Something went wrong.. please try again*');
    }
});
