const Blog = require('../models/blog')

const initialBlogs = [
    {
        title: 'My water monitor is monitoring around :)>',
        author: "Lizard Person",
        url: "www.monitorblog.blog.org",
        likes:10
    },
    {
        title: 'Some Dude`s life',
        author: "Jaska Jokunen",
        url: "www.imaginary.com",
        likes:0
    }
]

const nonExistingId = async () => {
  const blog = new Blog({ title: 'this_should_not_pass_tests' })
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(note => note.toJSON())
}

module.exports = {
  initialBlogs, nonExistingId, blogsInDb
}