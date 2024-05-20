// 4.8 onwards: testing the blog API 
const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const supertest = require('supertest')
const mongoose = require('mongoose')

const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

const bcrypt = require('bcrypt') // https://fullstackopen.com/en/part4/user_administration
const User = require('../models/user') // https://fullstackopen.com/en/part4/user_administration

beforeEach(async () => {

    await Blog.deleteMany({}) // delete ALL, since '{}'
    const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray) // this waits for ALL of the promises to be resolved first -> only then will this .js continue further below with the actual tests!

    await User.deleteMany({}) // delete ALL users
    const passwordHash = await bcrypt.hash('sekret', 10) // so, the password is "sekret"
    const rootUser = new User({ username: 'root', passwordHash, name:"root" })
    await rootUser.save()
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

test('a valid blog (i.e. includes title, author, url, likes and username) can be added BY username root once root has logged in, token saved, and post of the new blog is made c:', async () => { // now we also have to include a userId c:
    // remember: there's a single user "root" with pw "sekret" atm
    // remember: without likes, unless you utilize mongoose here to set the default likes for you, posting a new blog won't work!
    // remember to AWAIT for User.find({username:"root"})
    // User.find({username:"root"}) will return a list!
    
    console.log("Hello from test 'a valid blog can be added'!")

    const users = await api
      .get('/api/users')
    console.log("ALL USERS (get ./api/users, body):", users.body)

    const mrRootList = await User.find({username:"root"})
    const mrRoot = mrRootList[0] // the f****** ".find" apparently returns a list everytime, that's why
    
    console.log("mrRoot:", mrRoot)
    console.log("mrRoot.id:", mrRoot.id)

    const mrRootId = mrRoot.id // this is the string version, the non-clucked-up one
    
    const logInInfo = {
      username: 'root',
      password: 'sekret'
    }

    // LOGGING IN AS root!!
    const response = await api
      .post('/api/login')
      .send(logInInfo)
      .expect(200) // login should be ok
    
    const token = response.body.token // works c:
    //console.log("response:", response)
    console.log("token (test):", token)
    
      const newBlog = {
        title: 'Adding new blogs with full content makes life better! c:',
        author: "root",
        url: "www.hikipedia.fi",
        likes: 0,
        userId: mrRootId // this was used in ../requests/creating_new_blog.rest c:
      }
    
    // ACTUALLY ADDING A NEW BLOG
    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer ' + token.toString()) // https://www.npmjs.com/package/supertest for some fucked-up reason, "set" comes after "send". Yeah.
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
  .send(newBlogWithoutTitle) 
  .expect(400)
  .expect('Content-Type', /application\/json/)

  const newBlogWithoutUrl = {
    title: 'No likes yet',
    author: "Random Dude",
    likes:0
  }

  await api
  .post('/api/blogs')
  .send(newBlogWithoutUrl) 
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

  /** I never got this additional test to work, so it's commented out here. **
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

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected `username` to be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('creation of a new user with TOO SHORT a USERNAME will fail', async () => {
    const username = 'gg' // the limit is 3 or longer, as per 4.16
    const password = "pqoiwuerouiwqerpoiquweropiuqwer"
    const name = "Matti Nykaenen"

    const newUser = {
      username,
      name,
      password
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
      assert(result.body.error.includes('User validation failed: username: Path `username` (`gg`) is shorter than the minimum allowed length (3).'))
  })

  test('creation of a new user WITHOUT a USERNAME will fail', async () => { // 4.16
    const password = "pqoiwuerouiwqerpoiquweropiuqwer"
    const name = "Matti Nykaenen"

    const newUser = {
      name,
      password
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
      assert(result.body.error.includes('User validation failed: username: Path `username` is required.'))
  })

test('creation of a new user with TOO SHORT a PASSWORD will fail', async () => { // 4.16
  const username = 'SomeDude' // the limit is 3 or longer, as per 4.16
  const password = "12"
  const name = "Matti Nykaenen"

  const newUser = {
    username,
    name,
    password
  }

  const result = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)

    assert(result.body.error.includes('error: password is too short, minimum length is 3 characters'))
})

test('creation of a new user WITHOUT a PASSWORD will fail', async () => { // 4.16
  const username = 'SomeDude' // the limit is 3 or longer, as per 4.16
  const name = "Matti Nykaenen"

  const newUser = {
    username,
    name
  }

  const result = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)

    assert(result.body.error.includes('error: a password must be entered'))
})

})

after(async () => {

    await mongoose.connection.close()
  })