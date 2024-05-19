const logger = require('./logger')

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const tokenExtractor = (request, response, next) => {  // moved here as per 4.20
  const authorization = request.get('authorization')   // "isolates the token from the authorization header"
  if (authorization && authorization.startsWith('Bearer ')) {    
    request.token = authorization.replace('Bearer ', '')  // maybe works? https://expressjs.com/en/guide/writing-middleware.html OG: "return authorization.replace('Bearer ', '')". What I'm trying to do is to add a new property "token" for the "request". Point: if authorization is ok with Bearer [token], then leave just the [token] there c:
  } else {
  request.token = null } // originally: return null
  next() // ok apparently - the idea is: call "next" middleware in any case, whether authorization is ok or not.
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {    // https://fullstackopen.com/en/part4/user_administration
    return response.status(400).json({ error: 'expected `username` to be unique' })  
  } else if (error.name ===  'JsonWebTokenError') {    
    return response.status(401).json({ error: 'token invalid' })
  }
  next(error)
}

module.exports = {
  requestLogger,
  tokenExtractor,
  unknownEndpoint,
  errorHandler,
}