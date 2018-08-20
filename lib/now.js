'use strict'

const now = () => {
  const timestamp = Date.now()

  return Math.floor(timestamp / 1000)
}

module.exports = now
