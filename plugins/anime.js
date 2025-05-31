const l = console.log
const config = require('../settings')
const { cmd, commands } = require('../lib/command')
const axios = require("axios");

cmd({
    pattern: "slanimeclub",    
    react: '📑',
    category: "movie",
    desc: "slanimeclub movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, prefix, q, l, isDev, reply }) => {
    try {
        
        if (!q) return await reply(lang ? '*කරුණාකර පණිවිඩයක් ලබා දෙන්න..! 🖊️*' : '*Please Give Me Text..! 🖊️*');
    
        const data = await fetchJson(`${config.API}/api/slanimeclub/search?q=${q}&apikey=${config.APIKEY}`);
    
        if (data.data.data.data.length < 1) return await conn.sendMessage(from, { text: lang ? "*මට කිසිවක් සොයාගත නොහැකි විය :(*" : "*No results found :(*" }, { quoted: mek });
    
        var srh = [];  
        for (var i = 0; i < data.data.data.data.length; i++) {
            srh.push({
                title: i + 1,
                description: `${data.data.data.data[i].title}|| 'N/A'}\n┃ 🔗 Url: ${data.data.data.data[i].link}_\n┃━━━━━━━━━━━━━━━\n`,
                rowId: prefix + 'slanime ' + data.data.data.data[i].link
            });
        }

        const sections = [{
            title: lang ? "_[slanimeclub එකේ පෙන්වා ඇති ප්‍රතිඵල]._" : "_[Result from slanimeclub.]_",
            rows: srh
        }];
        
        const listMessage = {
            text: ``,
            footer: config.FOOTER,
            title: lang ? 'slanimeclub එකේ ප්‍රතිඵල 📲' : 'Result from slanimeclub. 📲',
            buttonText: '*🔢 පහත අංකය පිළිතුරු කරන්න*' : '*🔢 Reply below number*',
            sections
        };

        return await conn.replyList(from, listMessage ,{ quoted : mek });
    } catch (e) {
        reply(lang ? '*දෝෂයක් සිදු විය !!*' : '*ERROR !!*');
        l(e);
    }
});


cmd({
    pattern: "slanime",    
    react: '📑',
    category: "movie",
    desc: "slanimeclub movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, prefix, q, l, isDev, reply }) => {
    try {
        const lang = config.LANG == 'SI';

        if (!q) return await reply(lang ? '*කරුණාකර පණිවිඩයක් ලබා දෙන්න..! 🖊️*' : '*Please Give Me Text..! 🖊️*');
    
        const data = await fetchJson(`${config.API}/api/slanimeclub/movie?url=${q}&apikey=${config.APIKEY}`);
    
        const cap = `${lang ? `*_☘ මාතෘකාව: ${data.data.data.moviedata.title}_*\n\n- *දිනය:* ${data.data.data.moviedata.date}\n- *ජනප්‍රිය:* ${data.data.data.moviedata.generous}\n\n*⛏️ සෘජු ලින්ක්:* ${q}` : `*_☘ Title: ${data.data.data.moviedata.title}_*\n\n- *Date:* ${data.data.data.moviedata.date}\n- *Generous* ${data.data.data.moviedata.generous}\n\n*⛏️ Link:* ${q}`}`;

        if (data.data.data.moviedata.seasons.length < 1) return await conn.sendMessage(from, { text: lang ? "*මට කිසිවක් සොයාගත නොහැකි විය :(*" : "*No results found :(*" }, { quoted: mek });

        var srh = [];  
        for (var i = 0; i < data.data.data.moviedata.seasons.length; i++) {
            srh.push({
                title: i + 1,
                description: `${data.data.data.moviedata.seasons[i].title} | ${data.data.data.moviedata.seasons[i].number} | ${data.data.data.moviedata.seasons[i].date}`,
                rowId: prefix + `slanimedl ${data.data.data.moviedata.seasons[i].link}|${data.data.data.moviedata.seasons[i].title}`
            });
        }

        const sections = [{
            title: lang ? "_[slanimeclub එකේ පෙන්වා ඇති ප්‍රතිඵල]._" : "_[Result from slanimeclub.]_",
            rows: srh
        }];
        
        const listMessage = {
            caption: cap,
            image : { url: data.data.data.moviedata.image },    
            footer: config.FOOTER,
            title: lang ? 'slanimeclub එකේ ප්‍රතිඵල 📲' : 'Result from slanimeclub. 📲',
            buttonText: lang ? '*🔢 පහත අංකය පිළිතුරු කරන්න*' : '*🔢 Reply below number*',
            sections
        };

        return await conn.replyList(from, listMessage ,{ quoted : mek });
    } catch (e) {
        reply(lang ? '*දෝෂයක් සිදු විය !!*' : '*ERROR !!*');
        l(e);
    }
});


cmd({
    pattern: `slanimedl`,
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from, q, isDev, reply }) => {

    if (!isDev) return reply(config.LANG === 'en' ? '⚠️ *Contact owner to Activate your number to Premium user*' : '⚠️ *බොට් ඇක්ටිව් කරගැනිමට හිමිකරු වෙත පිවිසෙන්න*');

    if (!q) {
        return await reply(config.LANG === 'en' ? '*Please provide a direct URL!*' : '*කරුණාකර තොරතුරු URL එකක් ලබා දෙන්න!*');
    }

    try {
        const mediaUrl = q.split("|")[0];
        const title = q.split("|")[1] || 'tdd_movie_dl_system';
        const data = await fetchJson(`${config.API}/api/slanimeclub/download?url=${mediaUrl}&apikey=${config.APIKEY}`);
        const dl_link = `${data.data.data.link}`;

        const msg = config.LANG === 'en' ? 'PLEASE WAIT.... DON\'T USE ANY COMMANDS 🚫' : 'කරුණාකර රුචිකර කරන්න.... ඕනෑම කමාන්ඩ් එකක් භාවිතා නොකරන්න 🚫';
        await conn.sendMessage(from, { text: msg });

        const loadingMessage = await conn.sendMessage(from, { text: config.LANG === 'en' ? 'UPLOADING' : 'උඩුගත කරනවා' });

        const emojiMessages = [
            "UPLOADING ●○○○○", "UPLOADING ●●○○○", "UPLOADING ●●●○○", "UPLOADING ●●●●○", "UPLOADING ●●●●●",
            "UPLOADING ●○○○○", "UPLOADING ●●○○○", "UPLOADING ●●●○○", "UPLOADING ●●●●○", "UPLOADING ●●●●●",
            config.LANG === 'en' ? "UPLOADING YOUR MOVIE" : "ඔබගේ චිත්‍රපටය උඩුගත කරනවා"
        ];

        for (const line of emojiMessages) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay for 1 second
            await conn.relayMessage(
                from,
                {
                    protocolMessage: {
                        key: loadingMessage.key,
                        type: 14,
                        editedMessage: {
                            conversation: line,
                        },
                    },
                },
                {}
            );
        }

        if (dl_link.includes("https://slanimeclub.co")) {

            await conn.sendMessage(from, {
                document: {
                    url: dl_link
                },
                caption: `${title}\n\n${config.FOOTER}`,
                mimetype: "video/mp4",
                jpegThumbnail: await getThumbnailBuffer(config.LOGO),
                fileName: `${title}.mp4`
            });

            reply(config.LANG === 'en' ? 'SUCCESSFULLY UPLOADED YOUR MOVIE ✅' : 'ඔබගේ චිත්‍රපටය සාර්ථකව උඩුගත කර ඇත ✅');
        }

        if (dl_link.includes("https://drive.google.com")) {
            let res = await GDriveDl(dl_link);
            await conn.sendMessage(from, {
                document: {
                    url: res.downloadUrl
                },
                caption: `${res.fileName}\n\n${config.FOOTER}`,
                mimetype: res.mimetype,
                jpegThumbnail: await getThumbnailBuffer(config.LOGO),
                fileName: `${res.fileName}.mp4`
            });

            reply(config.LANG === 'en' ? 'SUCCESSFULLY UPLOADED YOUR MOVIE ✅' : 'ඔබගේ චිත්‍රපටය සාර්ථකව උඩුගත කර ඇත ✅');
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (error) {
        console.error('Error fetching or sending', error);
        await conn.sendMessage(from, config.LANG === 'en' ? '*Error fetching or sending*' : '*දෝෂයක් සොයාගැනීම හෝ එවීම*', { quoted: mek });
    }
});
