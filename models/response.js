'use strict'

const { Response } = require('node-fetch')

class CustomResponse extends Response {
  constructor (statusCode, object, options = {}) {
    const responseBody = object ? JSON.stringify(object) : null
    const responseOptions = Object.assign({
      status: statusCode
    }, options)

    super(responseBody, responseOptions)

    this.object = object
  }
}

module.exports = CustomResponse
