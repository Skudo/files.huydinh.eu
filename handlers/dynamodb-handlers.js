'use strict'

const S3Object = require('../models/s3-object')

const onDelete = (record) => {
  const item = record.dynamodb.OldImage
  const fileObject = new S3Object({
    key: item.s3Key.S
  })

  return fileObject.delete()
}

// === Handlers start here =====================================================

const processDynamoDbEvent = (event, context, callback) => {
  event.Records.forEach((record) => {
    switch (record.eventName) {
      case 'REMOVE':
        return onDelete(record)
      default:
    }
  })
}

module.exports = {
  processDynamoDbEvent
}
