const mongoose = require('mongoose')

if (process.argv.length<3) {
  console.log('give password as argument')
  process.exit(1)
}

const url =
  `mongodb+srv://anttonkasslin:${password}@cluster0.k9nljxh.mongodb.net/blogApp?retryWrites=true&w=majority` // this will rename it succesfully as "blogApp". The above won't. This is directly from the course material c:

mongoose.set('strictQuery',false)

mongoose.connect(url)

const blogSchema = new mongoose.Schema({
  title: String,
  author: String,
  likes: Number,
  url: String
})

const Blog = mongoose.model('Blog', blogSchema)

Blog.find({}).then(result => { // finds all. 
  result.forEach(blog => {
    console.log(blog)
  })
  mongoose.connection.close()
})