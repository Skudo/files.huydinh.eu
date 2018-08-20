'use strict'

const { Serializer } = require('jsonapi-serializer')
const baseUrl = `https://${process.env.domainName}`
const FileSerializer = new Serializer('files', {
  attributes: ['accessCount', 'filename', 'uploadedAt', 'expiresAt'],
  dataLinks: {
    download: (data) => {
      if (!data.uploadedAt) { return }
      return [baseUrl, data.id].join('/')
    },
    show: (data) => {
      if (!data.uploadedAt) { return }
      return [baseUrl, data.id, 'inline'].join('/')
    },
    upload: (data) => data.uploadUrl,
    self: (data) => [baseUrl, 'api/files', data.id].join('/')
  }
})

module.exports = FileSerializer
