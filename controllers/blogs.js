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
  /*
  console.log("request.token:", request.token) // ok - now uses the request.token (middleware tokenExtractor)
  console.log("process.env.SECRET:", process.env.SECRET)
  console.log("are the token (above) and process.env.SECRET (above) triple equal:", request.token === process.env.SECRET) // also when you're using requests/creating_new_blog.rest OR postman, it doesn't matter WHAT the process.env.SECRET is! - the only thing that matters is whether the token you send in the header (bearer) matches to the one that the user receives in the response upon login!
  */

  // the above is useless of course - the SECRET key is the secret key, in asymmetric crypting of the token (public key, I guess).
  // THE PROBLEM WAS: nodemon c: - you have to (1) sign in with user x, then copy the token from the response 
  // then (2) copy-paste that in the Authorization: Bearer -header, AND NOT SAVE THROUGHOUT this or otherwise the session
  // will be messed up c:
  // For example, as soon as I save this file (blog.js), nodemon will take over and restart the server -> no longer signed in -> token fails.

  const decodedToken = jwt.verify(request.token, process.env.SECRET)  // this DOES NOT check if the two are equal, it apparently just uses the SECRET to crypt the token. So .env.SECRET does NOT have to equal anything else, of course
  //console.log("decodedToken:", decodedToken)
  if (!decodedToken.id) {    
    return response.status(401).json({ error: 'token invalid' })  
  }  
  // const user = await User.findById(decodedToken.id) // OLD - now you can use instead the request.user, thanks to the middleware userExtractor
  const user = request.user // !!!! NB! REMEMBER! you had forgotten to await in the middleware side -> awaiting here worked too! SO that's a possibility c:
  
  /**
  console.log("body:", body)
  console.log("user:", user)
   */

  // const user = await User.findById(body.userId) // this was used before token authentication was taken into use for posting new blogs https://fullstackopen.com/en/part4/user_administration
  // const users = await User.find({}) // as per 4.17. !!! if you try "User.findById({})" IT WILL BREAK THE FUNCTIONALITY OF CREATING A NEW BLOG. HOW? NO IDEA.
  // const firstUser = users[0] // as per 4.17
  
  /** 
  let likes // extra, shouldn't be needed.
  if(!body.likes) {
    likes = 0
    } else {
      likes = body.likes
    }
  */

  const blog = new Blog({
    title: body.title,
    likes: body.likes,
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
  //console.log("Hello from blogsRouter.delete!")
  const decodedToken = jwt.verify(request.token, process.env.SECRET)  // this worked in ".post" above
  //console.log("decodedToken:", decodedToken)
  
  if (!decodedToken.id) {    
    return response.status(401).json({ error: 'token invalid' }) // this is ok and works
  }

  //const user = await User.findById(decodedToken.id) // OLD. THIS IS NOW BE ACCESSIBLE through "request.user" using the middlew. userExtractor c:

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
    return response.status(400).json({ error: `you somehow managed to use a token with a nonexisting user's id. Congratulations! (for real though: error: the user id that was acquired through the token is missing from the database. Maybe someone just deleted your account?)` })
  } 
  //console.log("targetBlog:", targetBlog)

  //console.log("request.user.id.toString()", request.user.id.toString())
  //console.log("targetBlog.user.toString()", targetBlog.user.toString())

  if(!(request.user.id.toString() === targetBlog.user.toString())) { // "user.id" I got from http://localhost:3003/api/blogs, and the "request.params.id" is copy-pasted from below
    return response.status(401).json({ error: 'cannot delete another user`s blog' }) // 401 = unauthorized
  } 

  await Blog.findByIdAndDelete(request.params.id) // og. Blog id!!
  response.status(204).end() // 204 no content

  //console.log("Exiting blogsRouter.delete!")
  
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