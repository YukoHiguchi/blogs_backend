const mongoose = require('mongoose')

const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)
const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})

  const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog))
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

test('a new blog is created and the total number of blogs is incereased by one', async () => {
  const newBlog = {
    title: 'new blog',
    author: 'Mike Test',
    url: 'http://test.com/test.html',
    likes: 3,
  }
  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect('Content-Type', /application\/json/)
  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
})

test('if the likes property is missing from the request, it will default to the value 0', async () => {
  const newBlog = {
    title: 'new blog',
    author: 'Mike Test',
    url: 'http://test.com/test.html',
  }
  await api
    .post('/api/blogs')
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

afterAll(async () => {
  await mongoose.connection.close()
})
