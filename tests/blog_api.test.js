// 4.8 onwards: testing the blog API 
const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const supertest = require('supertest')
const mongoose = require('mongoose')

const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {

    await Blog.deleteMany({}) // delete ALL, since '{}'

    const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray) // this waits for ALL of the promises to be resolved first -> only then will this .js continue further below with the actual tests!
})

test('(1) blogs are returned as json (2) the number of blogs is correct', async () => {

    const response = await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    assert.strictEqual(response.body.length, helper.initialBlogs.length)
})

test('unique identifier of each blog post is "id", never "_id"', async () => {

    let found_id = false // "_id" found, instead of "id"?
    const response = await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    response.body.forEach(blog => {
        if (blog._id) {
            found_id = true
        }
    })
    assert.strictEqual(found_id, false)
})

test('a valid blog (i.e. includes title, author, url and likes) can be added', async () => {

    const newBlog = {
      title: 'Adding new blogs with full content makes life better! c:',
      author: "Random Dude",
      url: "www.hikipedia.fi",
      likes: 69
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
  
    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1) // has the blog really been added?
  
    const titles = blogsAtEnd.map(blog => blog.title)
    //console.log("contents:", titles)
    assert(titles.includes('Adding new blogs with full content makes life better! c:')) 
})

test('if "likes" property is missing from the POST request, it will default to 0', async () => {

    const newBlogWithoutLikes = {
        title: 'No likes yet',
        author: "Random Dude",
        url: "www.givemelikes.com"
        // likes: undefined! Yet Fret Not: the mongoose blogSchema (blog.js) should fix this by using default value of 0 for the "likes" property
      }

    const newMongooseBlog = new Blog(newBlogWithoutLikes) // since this is what WILL happen in the actual app by the Blog schema c:
    const fixedBlog = newMongooseBlog.toJSON() // for .send below however, an actual JSON is needed c:
  
      await api
        .post('/api/blogs')
        .send(fixedBlog) // did mongoose do its job and fix the missing likes to likes:0?
        .expect(201)
        .expect('Content-Type', /application\/json/)
    
      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1) // has the blog really been added?
    
      const returnedBlogs = blogsAtEnd.map(blog => blog)
      //console.log("contents:", returnedBlogs)
      let found = false
      returnedBlogs.forEach(blog => {
        if (blog.title === 'No likes yet' && blog.likes === 0) {
            found = true
        }
      })
      assert.strictEqual(found, true) // are there 0 likes?
  })

test('if "title" or "author" is missing from the POST request, 400 bad request will be received', async () => {

  const newBlogWithoutAuthor = {
      title: 'No likes yet',
      url: "www.givemelikes.com",
      likes:0
    }

  await api
    .post('/api/blogs')
    .send(newBlogWithoutAuthor) // did mongoose do its job and fix the missing likes to likes:0?
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const newBlogWithoutTitle = {
    author: "Random Dude",
    url: "www.givemelikes.com",
    likes:0
  }

  await api
  .post('/api/blogs')
  .send(newBlogWithoutTitle) // did mongoose do its job and fix the missing likes to likes:0?
  .expect(400)
  .expect('Content-Type', /application\/json/)

  const newBlogWithoutUrl = {
    title: 'No likes yet',
    author: "Random Dude",
    likes:0
  }

  await api
  .post('/api/blogs')
  .send(newBlogWithoutUrl) // did mongoose do its job and fix the missing likes to likes:0?
  .expect(400)
  .expect('Content-Type', /application\/json/)
})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]
    //console.log("blogToDelete:", blogToDelete)

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)

    const urls = blogsAtEnd.map(b => b.url)
    assert(!urls.includes(blogToDelete.url))
  })
})

describe('updating of a blog´s number of likes', () => {
  test('succeeds with status code 200 ok for an existing blog', async () => {
    const allBlogs = await helper.blogsInDb()
    //console.log("allBlogs:", allBlogs)
    const blogToLike = allBlogs[0]
    //console.log("blogToLike:", blogToLike)

    const okBlogToUpdate = {
      author:blogToLike.author,
      title:blogToLike.title,
      url:blogToLike.url,
      likes:100,
      id:blogToLike.id
    }

    await api
      .put(`/api/blogs/${blogToLike.id}`)
      .send(okBlogToUpdate)
      .expect(200)

    let ok = false
    const blogsAtEnd = await helper.blogsInDb()
    blogsAtEnd.forEach(blog => {
      if(blog.likes === 100 && blog.author == blogToLike.author) {
        ok = true
      }
    })
    assert.strictEqual(ok, true)
  })

  /**
  test('fails with status code 400 bad request for a non-existing blog', async () => {
    const nonexistingBlogId = await helper.nonExistingId()

    const badBlogToUpdate = {
      author:"someGuyThatDoesNotExist",
      title:"notCoolTitle!",
      url:"aöwoeijaowifj",
      likes:0,
      id:nonexistingBlogId
    }

    await api
      .put(`/api/blogs/${nonexistingBlogId}`)
      .send(badBlogToUpdate)
      .expect(400)  
  }) */
})

after(async () => {

    await mongoose.connection.close()
  })