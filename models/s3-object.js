'use strict'

const AWS = require('aws-sdk')
const path = require('path')

class S3Object {
  constructor (params = {}) {
    this.bucket = params.bucket || process.env.s3Bucket
    this.key = params.key

    this.client = params.client || new AWS.S3()
  }

  delete () {
    const self = this

    this.isS3Object().then((exists) => {
      if (!exists) {
        return
      }

      return this.client.deleteObject({
        Bucket: self.bucket,
        Key: self.key
      }).promise()
    })
  }

  getSignedDownloadUrl (options) {
    const filename = this.__sanitisedFilename(options.filename || path.basename(this.key))
    const type = options.inline ? 'inline' : 'attachment'
    const urlOptions = {
      Bucket: this.bucket,
      Key: this.key,
      Expires: 60,
      ResponseContentDisposition: `${type}; filename=${filename}`
    }

    return this.client.getSignedUrl('getObject', urlOptions)
  }

  getSignedUploadUrl (options) {
    let urlOptions = {
      Bucket: this.bucket,
      Key: this.key,
      Expires: 60
    }

    return this.client.getSignedUrl('putObject', urlOptions)
  }

  isS3Object () {
    return this.client.headObject({
      Bucket: this.bucket,
      Key: this.key
    }).promise().then(() => {
      return true
    }).catch(() => {
      return false
    })
  }

  __sanitisedFilename (filename) {
    const replacementMap = {
      '%26': '&',
      '%2B': '+',
      '%5B': '[',
      '%5D': ']'
    }
    let result = encodeURIComponent(filename)

    Object.keys(replacementMap).forEach((pattern) => {
      const regExp = new RegExp(pattern, 'g')

      result = result.replace(regExp, replacementMap[pattern])
    })

    return result
  }
}

module.exports = S3Object
