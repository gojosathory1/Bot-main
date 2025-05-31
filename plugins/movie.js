const { cmd } = require('../lib/command');
const { fetchJson, getBuffer, getThumbnailBuffer } = require('../lib/functions');
const config = require('../settings');

cmd({
    pattern: "movie",
    react: '🎬',
    category: "movie",
    desc: "Download Sinhala subbed movies from suhas-bro-api",
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {
    const lang = config.LANG === 'SI';

    try {
        if (!q) return reply(lang ? '*කරුණාකර චිත්‍රපට නමක් සපයන්න 🖊️*' : '*Please provide a movie name 🖊️*');

        const res = await fetchJson(`https://suhas-bro-api.vercel.app/sls/search?q=${encodeURIComponent(q)}`);
        const result = res?.result?.[0];

        if (!result) {
            return reply(lang ? '*චිත්‍රපටයක් හමු නොවුණි*' : '*No movie found with that name*');
        }

        const detail = await fetchJson(`https://suhas-bro-api.vercel.app/sls/details?link=${encodeURIComponent(result.link)}`);
        const movie = detail?.result;

        if (!movie?.download) {
            return reply(lang ? '*බාගත කිරීමේ ලින්ක් එකක් නැහැ*' : '*No download link available*');
        }

        // Download MP4 and send as document
        const mp4url = movie.download;
        const filename = `${movie.title}.mp4`;

        await conn.sendMessage(from, {
            document: { url: mp4url },
            mimetype: 'video/mp4',
            fileName: filename,
            caption: `🎬 ${movie.title}\n📥 Sinhala Subbed Movie`,
            jpegThumbnail: await getThumbnailBuffer(config.LOGO)
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        reply(lang ? '*දෝෂයක් සිදු විය.. නැවත උත්සහ කරන්න*' : '*Something went wrong.. try again later*');
    }
});
