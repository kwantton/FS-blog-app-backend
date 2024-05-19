const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user') // https://fullstackopen.com/en/part4/user_administration

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

  const user = await User.findById(body.userId) // https://fullstackopen.com/en/part4/user_administration
  const users = await User.find({}) // as per 4.17. !!! if you try "User.findById({})" IT WILL BREAK THE FUNCTIONALITY OF CREATING A NEW BLOG. HOW? NO IDEA.
  const firstUser = users[0] // as per 4.17

  const blog = new Blog({
    title: body.title,
    likes: body.likes.toString(),
    url: body.url,
    author: body.author,
    user:firstUser.id // as per 4.17 which requested to choose any user (the first one in this case). Makes no sense IRL! https://fullstackopen.com/en/part4/user_administration
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