const jwt = require('jsonwebtoken')
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user') // https://fullstackopen.com/en/part4/user_administration


const getTokenFrom = request => {  
  const authorization = request.get('authorization')   // "isolates the token from the authorization header"
  if (authorization && authorization.startsWith('Bearer ')) {    
    return authorization.replace('Bearer ', '')  // if authorization is ok with Bearer [token], then leave just the [token] there c:
  }  
  return null}

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
    .populate('user', {username:1, name:1})
  response.json(blogs)
})

blogsRouter.get('/:id', (request, response, next) => {
  Blog.findById(request.params.id)
    .then(blog => {
      if (blog) {
        response.json(blog)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body
  console.log("getTokenFrom(request):", getTokenFrom(request)) // this is apparently ok, the problem is not here! It has a type of string
  console.log("process.env.SECRET:", process.env.SECRET)
  console.log("are the token (above) and process.env.SECRET (above) deeply equal:", getTokenFrom(request) === process.env.SECRET)
  // ^^ they are equal - so the problem is something else
  // THE PROBLEM WAS: nodemon c: - you have to (1) sign in with user x, then copy the token from the response (2) copy-paste that to
  // .env SECRET, then (3) copy-paste that in the Authorization: Bearer -header, AND NOT SAVE THROUGHOUT this or otherwise the session
  // will be messed up c:
  // FOr example, as soon as I save this file (blog.js), nodemon will take over and restart the server -> no longer signed in -> token fails.

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)  
  //console.log("decodedToken:", decodedToken)
  if (!decodedToken.id) {    
    return response.status(401).json({ error: 'token invalid' })  
  }  
  const user = await User.findById(decodedToken.id)

  // const user = await User.findById(body.userId) // this was used before token authentication was taken into use for posting new blogs https://fullstackopen.com/en/part4/user_administration
  // const users = await User.find({}) // as per 4.17. !!! if you try "User.findById({})" IT WILL BREAK THE FUNCTIONALITY OF CREATING A NEW BLOG. HOW? NO IDEA.
  // const firstUser = users[0] // as per 4.17

  const blog = new Blog({
    title: body.title,
    likes: body.likes.toString(),
    url: body.url,
    author: body.author,
    user:user.id // this would be firstUser.id as per 4.17 which requested to choose any user (the first one in this case). That, of course, makes no sense IRL! https://fullstackopen.com/en/part4/user_administration
  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id) // https://fullstackopen.com/en/part4/user_administration
  await user.save()

  response.status(201).json(savedBlog) // 201 = created
  
})

blogsRouter.delete('/:id', (request, response, next) => {
  Blog.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end() // 204 no content
    })
    .catch(error => next(error))
})

blogsRouter.put('/:id', (request, response, next) => {
  const body = request.body

  const blog = { 
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }

  Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    .then(updatedBlog => {
      response.json(updatedBlog)
    })
    .catch(error => next(error))
})

module.exports = blogsRouter