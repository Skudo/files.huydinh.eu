'use strict'

const AWS = require('aws-sdk')
const path = require('path')
const uuid = require('uuid/v4')

const generatedS3Key = (id, filename) => {
  const extension = path.extname(filename)

  return `${id}${extension}`
}

class Metadata {
  constructor (params = {}, options = {}) {
    this.id = params.id || uuid()
    this.attributes = params.attributes || {}

    this.client = options.client || new AWS.DynamoDB.DocumentClient()
    this.tableName = options.tableName || process.env.dynamoDbTable
  }

  static all (options = {}) {
    const client = options.client || new AWS.DynamoDB.DocumentClient()
    const tableName = options.tableName || process.env.dynamoDbTable

    return client.scan({
      TableName: tableName
    }).promise().then((response) => {
      return response.Items
    })
  }

  static create (data, options = {}) {
    const object = new Metadata({}, options)

    return object.put(data).then(() => {
      return object
    })
  }

  static findAllByS3Key (s3Key, options = {}) {
    const client = options.client || new AWS.DynamoDB.DocumentClient()
    const tableName = options.tableName || process.env.dynamoDbTable

    return client.query({
      TableName: tableName,
      IndexName: `${tableName}-s3-key-index`,
      KeyConditionExpression: 's3Key = :s3Key',
      ExpressionAttributeValues: {
        ':s3Key': s3Key
      }
    }).promise().then((response) => {
      return response.Items
    })
  }

  delete () {
    return this.client.delete({
      TableName: this.tableName,
      Key: {
        id: this.id
      }
    }).promise()
  }

  fetch () {
    const self = this

    return this.client.get({
      TableName: this.tableName,
      Key: {
        id: this.id
      }
    }).promise().then(response => {
      self.attributes = response.Item

      return self.attributes
    })
  }

  get () {
    const self = this

    if (Object.keys(this.attributes).length === 0) {
      return this.fetch()
    }

    return new Promise((resolve) => {
      return resolve(self.attributes)
    })
  }

  put (data) {
    const self = this

    const item = {
      id: this.id,
      accessCount: data.accessCount || 0,
      filename: data.filename,
      s3Key: data.s3Key || generatedS3Key(this.id, data.filename),
      uploadedAt: data.uploadedAt,
      expiresAt: data.expiresAt
    }

    return this.client.put({
      TableName: this.tableName,
      Item: item
    }).promise().then((response) => {
      self.attributes = response.Item

      return self.attributes
    })
  }
}

module.exports = Metadata
