const fetch = require('node-fetch')
const { sizeFormatter } = require('human-readable')

const formatSize = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`
})

async function GDriveDl(url) {
  let id;
  const result = { error: true }

  if (!url || !url.match(/drive\.google/i)) return result

  try {
    // Extract ID
    id = (url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/) || [])[1]
    if (!id) throw new Error('ID Not Found')

    // Step 1: Get download page
    const pageRes = await fetch(`https://drive.google.com/uc?export=download&id=${id}`)
    const pageBody = await pageRes.text()

    // Step 2: Look for confirm token (required when file is large or limited)
    const confirmMatch = pageBody.match(/confirm=([a-zA-Z0-9_-]+)/)
    const confirm = confirmMatch ? confirmMatch[1] : null

    if (!confirm) throw new Error('⚠️ Link blocked or quota exceeded. Try making a copy in your Drive.')

    // Step 3: Construct final download URL
    const downloadUrl = `https://drive.google.com/uc?export=download&confirm=${confirm}&id=${id}`

    // Step 4: Make request and get headers
    const fileRes = await fetch(downloadUrl, { method: 'GET' })
    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream'
    const contentLength = fileRes.headers.get('content-length') || 0

    // Step 5: Extract filename
    const disposition = fileRes.headers.get('content-disposition') || ''
    let fileName = 'unknown'
    if (disposition.includes('filename=')) {
      const match = disposition.match(/filename\*=UTF-8''(.+)|filename="(.+)"/)
      fileName = decodeURIComponent(match?.[1] || match?.[2] || 'unknown').replace(/\+/g, ' ')
    }

    return {
      error: false,
      downloadUrl,
      fileName,
      fileSize: formatSize(Number(contentLength)),
      mimetype: contentType
    }

  } catch (e) {
    console.error('[GDriveDl Error]', e.message)
    return result
  }
}

module.exports = GDriveDl
