const fetch = require('node-fetch')
const { sizeFormatter } = require('human-readable')

const formatSize = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: 2,
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`
})

async function GDriveDl(url) {
    let res = { error: true }
    if (!url || !url.match(/drive\.google/i)) return res

    try {
        // Extract ID
        const idMatch = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/)
        const id = idMatch ? idMatch[1] : null
        if (!id) throw new Error('File ID Not Found')

        // Step 1: First request to get confirm token
        const page = await fetch(`https://drive.google.com/uc?export=download&id=${id}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const html = await page.text()
        const tokenMatch = html.match(/confirm=([0-9A-Za-z-_]+)&/)
        const confirm = tokenMatch ? tokenMatch[1] : null

        // Step 2: Final download URL
        const downloadUrl = confirm
            ? `https://drive.google.com/uc?export=download&confirm=${confirm}&id=${id}`
            : `https://drive.google.com/uc?export=download&id=${id}`

        // Step 3: Get redirected URL with HEAD request (follow redirect)
        const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            redirect: 'follow' // <-- FIXED: allow following 303 redirects
        })

        if (response.status !== 200) throw new Error(`Failed to fetch file. Status: ${response.status}`)

        // Step 4: Get filename
        const disposition = response.headers.get('content-disposition') || ''
        const fileNameMatch = disposition.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"/)
        const fileName = fileNameMatch ? decodeURIComponent(fileNameMatch[1] || fileNameMatch[2]) : 'unknown'

        const fileSize = formatSize(Number(response.headers.get('content-length') || 0))
        const contentType = response.headers.get('content-type') || 'application/octet-stream'

        return {
            error: false,
            downloadUrl: response.url, // <-- final redirect URL
            fileName,
            fileSize,
            mimetype: contentType
        }

    } catch (e) {
        console.error('[GDriveDl Error]', e.message)
        res.message = e.message
        return res
    }
}

module.exports = GDriveDl
