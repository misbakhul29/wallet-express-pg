const logger = {
  info: (message, data = {}) => {
    console.log(`INFO: ${message}`, data)
  },
  warn: (message, data = {}) => {
    console.warn(`WARN: ${message}`, data)
  },
  error: (message, data = {}) => {
    console.error(`ERROR: ${message}`, data)
  },
}

module.exports = logger
