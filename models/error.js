'use strict'

class CustomError extends Error {
  constructor (statusCode, ...args) {
    super(...args)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError)
    }

    this.statusCode = statusCode
  }
}

module.exports = CustomError
