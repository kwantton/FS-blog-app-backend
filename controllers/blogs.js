const jwt = require('jsonwebtoken')
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

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
  console.log("request.token:", request.token) // ok - now uses the request.token (middleware tokenExtractor)
  console.log("process.env.SECRET:", process.env.SECRET)
  console.log("are the token (above) and process.env.SECRET (above) triple equal:", request.token === process.env.SECRET) // IF you're using requests/creating_new_blog.rest OR postman, it doesn't matter if the process.env.SECRET is correct (=matching to the one you send) - the only thing that matters is whether the one you send in the header matches to the one that the user gets upon login! c:
  // ^^ they are equal - so the problem is something else
  // THE PROBLEM WAS: nodemon c: - you have to (1) sign in with user x, then copy the token from the response (2) copy-paste that to
  // .env SECRET, then (3) copy-paste that in the Authorization: Bearer -header, AND NOT SAVE THROUGHOUT this or otherwise the session
  // will be messed up c:
  // For example, as soon as I save this file (blog.js), nodemon will take over and restart the server -> no longer signed in -> token fails.

  const decodedToken = jwt.verify(request.token, process.env.SECRET)  // this checks if the two are equal, like the console.log above does
  //console.log("decodedToken:", decodedToken)
  if (!decodedToken.id) {    
    return response.status(401).json({ error: 'token invalid' })  
  }  
  // const user = await User.findById(decodedToken.id) // OLD - now you can use instead the request.user, thanks to the middleware userExtractor
  const user = request.user // !!!! NB! REMEMBER! because the goddamn request.user itself is dependent on async/await (see utils/middleware/userExtractor), this is needed here also!!! :c
  console.log("body:", body)
  console.log("user:", user)

  // const user = await User.findById(body.userId) // this was used before token authentication was taken into use for posting new blogs https://fullstackopen.com/en/part4/user_administration
  // const users = await User.find({}) // as per 4.17. !!! if you try "User.findById({})" IT WILL BREAK THE FUNCTIONALITY OF CREATING A NEW BLOG. HOW? NO IDEA.
  // const firstUser = users[0] // as per 4.17

  const blog = new Blog({
    title: body.title,
    likes: body.likes.toString(),
    url: body.url,
    author: body.author,
    user: user.id.toString() // this would be firstUser.id as per 4.17 which requested to choose any user (the first one in this case). That, of course, makes no sense IRL! https://fullstackopen.com/en/part4/user_administration
  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id) // https://fullstackopen.com/en/part4/user_administration
  await user.save()
  response.status(201).json(savedBlog) // 201 = created
  
})

blogsRouter.delete('/:id', async (request, response) => { // 4.21
  console.log("Hello from blogsRouter.delete!")
  const decodedToken = jwt.verify(request.token, process.env.SECRET)  // this worked in ".post" above
  //console.log("decodedToken:", decodedToken)
  
  if (!decodedToken.id) {    
    return response.status(401).json({ error: 'token invalid' }) // this is ok and works
  }

  //const user = await User.findById(decodedToken.id) // OLD. THIS SHOULD NOW BE ACCESSIBLE THROUGH "request.user" thanks to the middleware

  //const blogs = await Blog.find({}) // DON'T FORGET AWAIT!!!! >:-(
  //console.log("Blogs", blogs)  // ok now. Why not earlier? Anyways: if you go to http://localhost:3003/api/blogs/[existing_blog_id_here], you'll see that user id is property "user"
  //const firstBlog = blogs[0] // DON'T FORGET AWAIT!!!! >:-(
  //console.log("firstBlog:", firstBlog) // ok
  //const firstBlogUser = firstBlog.user.toString()
  //console.log("firstBlogUser:", firstBlogUser)

  const targetBlog = await Blog.findById(request.params.id) // !! don't forget AWAIT !!
  if(!targetBlog) { // "user.id" I got from http://localhost:3003/api/blogs, and the "request.params.id" is copy-pasted from below
    return response.status(400).json({ error: `the blog that you tried to delete doesn't exist based on the blog id` })
  } 
  if(!request.user) { // "user.id" I got from http://localhost:3003/api/blogs, and the "request.params.id" is copy-pasted from below
    return response.status(400).json({ error: `you somehow managed to use a token with a nonexisting user's id. Congratulations! (in reality: error: the user id that was acquired through the token is missing from the database. Maybe someone has just deleted your account?)` })
  } 
  //console.log("targetBlog:", targetBlog)

  console.log("request.user.id.toString()", request.user.id.toString())
  console.log("targetBlog.user.toString()", targetBlog.user.toString())

  if(!(request.user.id.toString() === targetBlog.user.toString())) { // "user.id" I got from http://localhost:3003/api/blogs, and the "request.params.id" is copy-pasted from below
    return response.status(401).json({ error: 'cannot delete another user`s blog' })
  } 

  await Blog.findByIdAndDelete(request.params.id) // og. Blog id!!
  response.status(204).end() // 204 no content

  console.log("Exiting blogsRouter.delete!")
  
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