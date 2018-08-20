'use strict'

const { Deserializer } = require('jsonapi-serializer')
const Error = require('../models/error')
const FileSerializer = require('../serializers/file-serializer')
const Response = require('../models/response')
const File = require('../models/file')
const now = require('../lib/now')
const wrappedHandlers = require('../lib/api-request')

const deserializeBody = (body) => {
  const deserializer = new Deserializer({ keyForAttribute: 'camelCase' })
  let payload

  try {
    payload = JSON.parse(body)
  } catch (error) {
    throw new Error(422, error.message)
  }

  return deserializer.deserialize(payload)
}

const processWriteRequest = (payload, handler) => {
  return deserializeBody(payload).then((data) => {
    if (!data.filename || String(data.filename).trim().length === 0) {
      throw new Error(422, 'Attribute `filename` must not be blank.')
    }

    return handler(data)
  }).then((data) => {
    const body = FileSerializer.serialize(data)

    return new Response(200, body)
  })
}

// === Handlers start here =====================================================

const create = (event, context, callback) => {
  return processWriteRequest(event.body, (requestPayload) => {
    const expiresAt = now() + 3 * 24 * 60 * 60

    return File.create({
      filename: requestPayload.filename,
      expiresAt: expiresAt
    }).then((file) => {
      return file.get()
    })
  })
}

const destroy = (event, context, callback) => {
  const file = new File({
    id: event.pathParameters.id
  })

  return file.delete().then(() => {
    return new Response(204)
  })
}

const index = (event, context, callback) => {
  return File.all().then((files) => {
    return Promise.all(files.map((file) => {
      return file.get()
    }))
  }).then((files) => {
    const body = FileSerializer.serialize(files)

    return new Response(200, body)
  })
}

const show = (event, context, callback) => {
  const file = new File({
    id: event.pathParameters.id
  })

  return file.get().then((data) => {
    const body = FileSerializer.serialize(data)

    return new Response(200, body)
  })
}

const update = (event, context, callback) => {
  const file = new File({
    id: event.pathParameters.id
  })

  return processWriteRequest(event.body, (requestPayload) => {
    return file.getMetadata().then((metadata) => {
      metadata.filename = requestPayload.filename

      return file.putMetadata(metadata)
    }).then(() => {
      return file.get()
    })
  })
}

module.exports = wrappedHandlers({
  create,
  destroy,
  index,
  show,
  update
})
