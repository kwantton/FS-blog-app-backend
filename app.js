require('express-async-errors') // "import BEFORE you import your routes"
const config = require('./utils/config')
const express = require('express')
const app = express()
const cors = require('cors')
const blogsRouter = require('./controllers/blogs')
const middleware = require('./utils/middleware')
const usersRouter = require('./controllers/users') // https://fullstackopen.com/en/part4/user_administration
const logger = require('./utils/logger')
const loginRouter = require('./controllers/login') // https://fullstackopen.com/en/part4/token_authentication
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.static('dist')) // production build of the frontend is in 'dist'
app.use(express.json())
app.use(middleware.requestLogger)
app.use(middleware.tokenExtractor) // as per 4.20, "use before all the routes"
// app.use(middleware.userExtractor) // IF YOU PUT THIS HERE, it will be available to all the routes below. If not, see below; you can just put it as a parameter for the blogsRouter as below per 4.22

app.use('/api/login', loginRouter) // https://fullstackopen.com/en/part4/token_authentication
app.use('/api/blogs', middleware.userExtractor, blogsRouter) // as per 4.22; compare to the commented line above -this way, the userExtractor will only be usable here, at /api/blogs! See https://fullstackopen.com/en/part4/token_authentication#limiting-creating-new-notes-to-logged-in-users
app.use('/api/users', usersRouter) // https://fullstackopen.com/en/part4/user_administration

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app