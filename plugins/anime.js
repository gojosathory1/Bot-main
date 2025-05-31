cmd({
    pattern: "slanimeclub",	
    react: '📑',
    category: "movie",
    desc: "slanimeclub movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, prefix, q, l, isDev, reply }) => {
try{

        if (!q) return await reply('*Please Give Me Text..! 🖊️*')
	

const data = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/search?q=${q}&apikey=vajiraofficial`)



	
const link = data.data.data.data[0].link


const data1 = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/movie?url=${link}&apikey=vajiraofficial`)

const cap = `*_☘ Title: ${data1.data.data.moviedata.title}_*

- *Date:* ${data1.data.data.moviedata.date}
- *Generous* ${data2.data.data.moviedata.generous}

*⛏️ Link:* ${q}`

const link1 = data.data.data.moviedata.seasons[0].link



 await conn.sendMessage(from, { image: { url: data.data.data.moviedata.image} , caption: cap } , { quoted: mek })
 
 
const data = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/download?url=${link1}&apikey=vajiraofficial`)
        const dl_link = `${data.data.data.link}`


if (dl_link.includes("https://slanimeclub.co")) {    
	    
    const message = {
            document: await getBuffer(dl_link),
	    caption: `pakaya`,
            mimetype: "video/mp4",
            fileName: `${data1.data.data.moviedata.title}.mp4`,
        };	    
        await conn.sendMessage(from, message );

} if (dl_link.includes("https://drive.google.com")) {


let res = await GDriveDl(dl_link)
		let txt = `*[ Downloading file ]*\n\n`
		txt += `*Name :* ${res.fileName}\n`
		txt += `*Size :* ${res.fileSize}\n`
		txt += `*Type :* ${res.mimetype}`	
        await reply(txt)
conn.sendMessage(from, { document: { url: res.downloadUrl }, caption: `${res.fileName}\n\n${config.FOOTER}`, fileName: res.fileName, mimetype: res.mimetype }, { quoted: mek })

}
 
 
} catch (e) {
  reply('*ERROR !!*')
  l(e)
}
})
