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
        // Extract file id from different possible URL formats
        const idMatch = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/)
        const id = idMatch ? idMatch[1] : null
        if (!id) throw new Error('File ID Not Found')

        // Step 1: Initial request to get confirm token (if any)
        const initialResponse = await fetch(`https://drive.google.com/uc?export=download&id=${id}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })

        const text = await initialResponse.text()

        // Step 2: Find confirm token from the page (if quota exceeded or virus scan warning)
        const confirmMatch = text.match(/confirm=([0-9A-Za-z-_]+)&/)
        const confirmToken = confirmMatch ? confirmMatch[1] : null

        // Step 3: Construct download URL using confirm token if found
        const downloadUrl = confirmToken
            ? `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${id}`
            : `https://drive.google.com/uc?export=download&id=${id}`

        // Step 4: Fetch the file headers to get file metadata
        const fileResponse = await fetch(downloadUrl, {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            redirect: 'manual' // We don't want to follow redirect, Google Drive does 302 redirect for download link
        })

        if (fileResponse.status !== 200 && fileResponse.status !== 302) {
            throw new Error(`Failed to fetch file. Status: ${fileResponse.status}`)
        }

        // Step 5: Extract filename from content-disposition header
        let fileName = 'unknown'
        const disposition = fileResponse.headers.get('content-disposition') || ''
        const fileNameMatch = disposition.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"/)
        if (fileNameMatch) {
            fileName = decodeURIComponent(fileNameMatch[1] || fileNameMatch[2])
        }

        // Step 6: Get filesize & mimetype
        const contentLength = fileResponse.headers.get('content-length') || '0'
        const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream'

        return {
            error: false,
            downloadUrl,
            fileName,
            fileSize: formatSize(Number(contentLength)),
            mimetype: contentType
        }
    } catch (error) {
        console.error('[GDriveDl Error]', error.message)
        res.message = error.message
        return res
    }
}

module.exports = GDriveDl
