'use strict'

const File = require('../models/file')

const redirectToFile = (params, callback) => {
  const { event, inline } = params
  const file = new File({
    id: event.pathParameters.id
  })

  file.getSignedDownloadUrl({
    inline: inline
  }).then((signedUrl) => {
    callback(null, {
      statusCode: 307,
      headers: {
        'Content-Type': 'text/html',
        Location: signedUrl
      },
      body: `<html><body>Moved: <a href="${signedUrl}">${signedUrl}</a></body></html>`
    })

    return file.incrementAccessCount()
  }).catch((error) => {
    console.error(error)
    console.error(JSON.stringify(event))
    callback(null, {
      statusCode: 404
    })
  })
}

// === Handlers start here =====================================================

const display = (event, context, callback) => {
  redirectToFile({
    event: event,
    inline: true
  }, callback)
}

const download = (event, context, callback) => {
  redirectToFile({
    event: event,
    // Legacy fallback: Display request could be made by sending an `inline`
    //                  query string parameter.
    inline: event.queryStringParameters && event.queryStringParameters.inline
  }, callback)
}

module.exports = {
  display,
  download
}
