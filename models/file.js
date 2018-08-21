'use strict'

const Error = require('./error')
const Metadata = require('./metadata')
const S3Object = require('./s3-object')
const uuid = require('uuid/v4')

class File {
  constructor (params = {}) {
    this.id = params.id || uuid()
    this.metadata = params.metadata
  }

  static all () {
    return Metadata.all().then((metadataCollection) => {
      return metadataCollection.map((metadata) => {
        return new File({
          id: metadata.id,
          metadata: metadata
        })
      })
    })
  }

  static create (data) {
    return Metadata.create(data).then((metadata) => {
      return new File({
        id: metadata.id,
        metadata: metadata.attributes
      })
    })
  }

  static findAllByS3Key (s3Key) {
    return Metadata.findAllByS3Key(s3Key).then((metadataCollection) => {
      return metadataCollection.map((metadata) => {
        return new File({
          id: metadata.id,
          metadata: metadata
        })
      })
    })
  }

  delete () {
    const fileMetadata = new Metadata({
      id: this.id
    })

    delete this.metadata
    return fileMetadata.delete()
  }

  fetchMetadata () {
    const self = this
    const fileMetadata = new Metadata({
      id: this.id
    })

    return fileMetadata.get().then((metadata) => {
      self.metadata = metadata

      return metadata
    })
  }

  get () {
    const self = this

    return this.getMetadata().then((data) => {
      if (!data) {
        throw new Error(404)
      }

      return data
    }).then((data) => {
      return self.getSignedUploadUrl().then((signedUrl) => {
        data.uploadUrl = signedUrl

        return data
      })
    })
  }

  getFileObject () {
    return this.getMetadata().then((metadata) => {
      return new S3Object({
        key: metadata.s3Key
      })
    })
  }

  getMetadata () {
    const self = this

    if (!this.metadata) {
      return this.fetchMetadata()
    } else {
      return new Promise((resolve) => {
        resolve(self.metadata)
      })
    }
  }

  getSignedDownloadUrl (options) {
    return this.getMetadata().then((metadata) => {
      const fileObject = new S3Object({
        key: metadata.s3Key
      })

      if (!metadata.uploadedAt) {
        throw new Error(404)
      }

      return fileObject.getSignedDownloadUrl({
        filename: metadata.filename,
        inline: options.inline
      })
    })
  }

  getSignedUploadUrl (options) {
    return this.getFileObject().then((fileObject) => {
      return fileObject.getSignedUploadUrl(options)
    })
  }

  incrementAccessCount () {
    const self = this

    return this.getMetadata().then((metadata) => {
      metadata.accessCount = (metadata.accessCount || 0) + 1

      return self.putMetadata(metadata)
    })
  }

  putMetadata (data) {
    const self = this
    const fileMetadata = new Metadata({
      id: this.id
    })

    return fileMetadata.put(data).then((metadata) => {
      self.metadata = metadata

      return metadata
    })
  }
}

module.exports = File
