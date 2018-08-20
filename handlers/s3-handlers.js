'use strict'

const File = require('../models/file')
const now = require('../lib/now')

const iterateS3Objects = (event, handler) => {
  event.Records.forEach((record) => {
    const s3Object = record.s3.object

    return handler(s3Object)
  })
}

const onCreate = (s3Object) => {
  return File.create({
    filename: s3Object.key,
    s3Key: s3Object.key,
    uploadedAt: now()
  })
}

const onUpdate = (files) => {
  return files.map((file) => {
    return file.getMetadata().then((metadata) => {
      metadata.uploadedAt = now()
      delete metadata.expiresAt

      return file.putMetadata(metadata)
    })
  })
}

// === Handlers start here =====================================================

const processS3CreateEvent = (event, context, callback) => {
  iterateS3Objects(event, (s3Object) => {
    File.findAllByS3Key(s3Object.key).then((files) => {
      if (files.length > 0) {
        return onUpdate(files)
      } else {
        return onCreate(s3Object)
      }
    })
  })
}

const processS3DeleteEvent = (event, context, callback) => {
  iterateS3Objects(event, (s3Object) => {
    File.findAllByS3Key(s3Object.key).then((files) => {
      files.forEach((file) => {
        file.delete()
      })
    })
  })
}

module.exports = {
  processS3CreateEvent,
  processS3DeleteEvent
}
