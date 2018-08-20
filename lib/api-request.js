const HttpStatusCodes = require('http-status-codes')
const Error = require('../models/error')
const { Error: ErrorSerializer } = require('jsonapi-serializer')

class ApiRequest {
  constructor (params = {}) {
    this.event = params.event || {}
    this.context = params.context || {}
    this.callback = params.callback

    this.onError = this.onError.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  execute (handler) {
    return handler(this.event, this.context, this.callback).then(this.onSuccess, this.onError)
  }

  onError (error) {
    let serializedError

    if (!(error instanceof Error)) {
      error.statusCode = 500
    }

    if (error.statusCode === 500) {
      console.error(JSON.stringify(error))
    }

    serializedError = new ErrorSerializer({
      status: error.statusCode,
      title: HttpStatusCodes.getStatusText(error.statusCode),
      detail: error.message
    })

    this.callback(null, {
      statusCode: error.statusCode,
      body: JSON.stringify(serializedError)
    })
  }

  onSuccess (response) {
    this.callback(null, {
      statusCode: response.status,
      headers: Object.assign({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      }, response.headers),
      body: response.body
    })
  }
}

const wrappedHandlers = (originalHandlers) => {
  let handlers = {}

  Object.keys(originalHandlers)
    .filter((name) => originalHandlers.hasOwnProperty(name))
    .forEach((name) => {
      const originalHandler = originalHandlers[name]

      handlers[name] = (event, context, callback) => {
        const apiGatewayRequest = new ApiRequest({
          event,
          context,
          callback
        })

        return apiGatewayRequest.execute(originalHandler)
      }
    })

  return handlers
}

module.exports = wrappedHandlers
