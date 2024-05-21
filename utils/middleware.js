const logger = require('./logger')
const User = require('../models/user') // at 4.22
const Blog = require('../models/blog') // at 4.22. NOTE! If you try to use json web token here, AND use the jwt.verify here, it will instantly say "error: token invalid", unless you somehow magically succeed in logging in as a valid user when accessing /api/blogs etc! Tried that... didn't work - so the jwt side remains in /controllers/blogs.js as of now at least.
const { request } = require('../app')

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

const userExtractor = async (request, response, next) => {    // 4.22. I hope the async works???
  //console.log("request.token:", request.token) // WORKS! I can't copy-paste here the jwt.verify from controllers/blogs, BECAUSE: THE PROBLEM WITH jwt (jason web token): jwt will instantly result in "error: token invalid" for all of the /api/blogs urls unless you have managed to magically log in BEFORE going there, which is atm impossible, since this middleware is automatically called (as a designated middleware to /api/blogs) to those urls
  //console.log("request.body", request.body) // body
  //console.log("Hello from userExtractor (middleware)!")
  
  /** DELETE */
  if (request.method === "DELETE") {
  //console.log("DELETE: request.url (the url of the blog to delete", request.url) // empty
  const url = request.url.toString().substring(1) // this gets rid of the "/" at the start
  //console.log("url:", url)       // WHY URL? Because rest api, so this url is in fact the id of the blog
  if(url) {
    const blog = await Blog.findById(url) // url is the id of the blog
    if(!blog) {
      response.status(400).send({ error: 'the blog you tried to delete could not be found based on id' })
    }
    //console.log("blog:", blog)
    const userId = blog.user.toString()

    //console.log("CRITICAL: userId:", userId)
    const user = await User.findById(userId) // ÄLÄ UNOHA AWAITIA!!!! AAAAAAAA

    request.user = user
    //console.log("request.user is now successfully set:", request.user)
    //console.log("request.user.id should now have been set successfully as:", request.user.id.toString())
  } else { 
    const userId = null
    request.user = null
    //console.log("request.user could not be set:", request.user)
  }
  //console.log("Exiting userExtractor!")
  
/** POST */  
} else if (request.method === "POST") {
  //console.log("POST")
  const body = request.body
  if(!body) {
    response.status(400).send({ error: `the blog you're trying to create has no body - bad request` })
  }
  const userId = body.userId.toString() // I looked at the request to see this included there, nice way to check its existence
  //console.log("request:", request)
  //console.log("body:", body)
  //console.log("userId:", userId)
  const user = await User.findById(userId)
  request.user = user // this puts the new "user" property to the "request" object, so it can be used in ../controllers/blogs.js later! See app.js also, as that specifies where this middleware can be used, and at what point!
}
next() // btw: the method can also be "GET", hence it's especially important to put next() here in the end
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
  userExtractor
}