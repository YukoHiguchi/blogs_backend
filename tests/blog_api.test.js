const mongoose = require('mongoose')

const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')
const bcrypt = require('bcrypt')

const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})
  const result = await api.post('/api/users').send(helper.initialUser)

  console.log('result.body', result.body)
  const blogObjects = helper.initialBlogs.map((blog) => {
    blog.user = result.body.id
    return new Blog(blog)
  })

  const promiseArray = blogObjects.map((blog) => blog.save())
  await Promise.all(promiseArray)
})
test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('the unique identifier preperty of the blog posts is named id', async () => {
  const result = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
  expect(result.body[0].id).toBeDefined()
})

test('create a new blog with correct token, and then the total number of blogs is incereased by one', async () => {
  const response = await api.post('/api/login').send(helper.initialUser)
  const username = response.body.username
  const user = await User.findOne({ username })
  const newBlog = {
    title: 'new blog',
    author: 'Mike Test',
    url: 'http://test.com/test.html',
    likes: 3,
    user: user.id,
  }
  await api
    .post('/api/blogs')
    .set('Authorization', response.body.token)
    .send(newBlog)
    .expect('Content-Type', /application\/json/)
  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
})

test('if the likes property is missing from the request, it will default to the value 0', async () => {
  const response = await api.post('/api/login').send(helper.initialUser)
  const user = User.findOne({ username: response.body.username })
  const newBlog = {
    title: 'new blog',
    author: 'Mike Test',
    url: 'http://test.com/test.html',
    user: user.id,
  }
  await api
    .post('/api/blogs')
    .set('Authorization', response.body.token)
    .send(newBlog)
    .expect('Content-Type', /application\/json/)
  const blogsAtEnd = await helper.blogsInDb()
  const addedBlog = blogsAtEnd.find((blog) => blog.author === 'Mike Test')
  expect(addedBlog.likes).toEqual(0)
})

test('if the title property is missing from the request, the backend responds to the request with the status code 400', async () => {
  const newBlog = {
    author: 'Mike Test',
    url: 'http://test.com/test.html',
  }
  const result = await api.post('/api/blogs').send(newBlog)

  expect(result.status).toEqual(400)
})

test('if the url property is missing from the request, the backend responds to the request with the status code 400', async () => {
  const newBlog = {
    title: 'dummy title',
    author: 'Mike Test',
  }
  const result = await api.post('/api/blogs').send(newBlog)

  expect(result.status).toEqual(400)
})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const titles = blogsAtEnd.map((r) => r.title)

    expect(titles).not.toContain(blogToDelete.title)
  })
})

test('a specific blog can be viewed', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToView = blogsAtStart[0]
  await api
    .get(`/api/blogs/${blogToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)
})
describe('when there is initially one user at db', () => {
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
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map((u) => u.username)
    expect(usernames).toContain(newUser.username)
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

    expect(result.body.error).toContain('expected `username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
