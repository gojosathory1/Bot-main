const config = require('../settings');
const { cmd } = require('../lib/command');
const { fetchJson } = require('../lib/functions');
const { GDriveDl } = require('../lib/gdrive');
const { getBuffer } = require('../lib/functions');

cmd({
    pattern: "slanimeclub",
    react: '📑',
    category: "movie",
    desc: "Download anime from slanimeclub",
    filename: __filename
}, async (conn, m, mek, { from, prefix, q, reply }) => {
    try {
        if (!q) return await reply('*Please give me a search query..! 🖊️*');

        // Step 1: Search
        const searchRes = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/search?q=${encodeURIComponent(q)}&apikey=vajiraofficial`);
        const anime = searchRes?.data?.data?.data?.[0];
        if (!anime || !anime.link) return await reply('*No anime found with that name*');

        // Step 2: Fetch Details
        const detailRes = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/movie?url=${anime.link}&apikey=vajiraofficial`);
        const movie = detailRes?.data?.data?.moviedata;
        if (!movie || !movie.seasons?.length) return await reply('*No season info found*');

        const season = movie.seasons[0];
        const caption = `*_☘ Title: ${movie.title}_*\n\n- *Date:* ${movie.date}\n- *Genre:* ${movie.generous}\n\n*⛏️ Link:* ${anime.link}`;

        // Step 3: Send Poster
        await conn.sendMessage(from, { image: { url: movie.image }, caption }, { quoted: mek });

        // Step 4: Download Link
        const dlRes = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/download?url=${season.link}&apikey=vajiraofficial`);
        const dl_link = dlRes?.data?.data?.link;
        if (!dl_link) return await reply('*Download link not available*');

        // Step 5: Send File
        if (dl_link.includes("slanimeclub.co")) {
            const buffer = await getBuffer(dl_link);
            await conn.sendMessage(from, {
                document: buffer,
                mimetype: "video/mp4",
                fileName: `${movie.title}.mp4`,
                caption: `🎬 ${movie.title}`
            }, { quoted: mek });

        } else if (dl_link.includes("drive.google.com")) {
            const res = await GDriveDl(dl_link);
            const fileInfo = `*[ Downloading file... ]*\n\n*Name:* ${res.fileName}\n*Size:* ${res.fileSize}\n*Type:* ${res.mimetype}`;
            await reply(fileInfo);

            await conn.sendMessage(from, {
                document: { url: res.downloadUrl },
                mimetype: res.mimetype,
                fileName: res.fileName,
                caption: `${res.fileName}\n\n${config.FOOTER}`
            }, { quoted: mek });
        } else {
            await reply('*Unknown download source*');
        }

    } catch (e) {
        console.error(e);
        await reply('*❌ ERROR occurred. Please try again.*');
    }
});                                                                                  
