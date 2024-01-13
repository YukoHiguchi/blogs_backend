const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
  if (!request.body.url || !request.body.title) {
    return response.status(400).end()
  }
  if (!request.token) {
    return response.status(401).json({ error: 'token invalid' })
  }
  const user = request.user
  const blog = new Blog({
    title: request.body.title,
    url: request.body.url,
    author: request.body.author,
    likes: request.body.likes || 0,
    user: user._id,
  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()
  response.status(201).json(savedBlog)
})

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

blogsRouter.delete(
  '/:id',
  middleware.userExtractor,
  async (request, response) => {
    const user = request.user
    const blog = await Blog.findById(request.params.id)
    if (blog) {
      if (blog.user.toString() !== user.id.toString()) {
        console.log('blog.user.toString()', blog.user.toString())
        return response.status(401).json({ error: 'token invalid' })
      } else {
        await Blog.findByIdAndDelete(request.params.id)
      }
      response.status(204).end()
    } else {
      response.status(404).end()
    }
  }
)

blogsRouter.put('/:id', (request, response, next) => {
  const body = request.body

  const blog = {
    likes: body.likes,
  }

  Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    .then((updatedBlog) => {
      response.json(updatedBlog)
    })
    .catch((error) => next(error))
})

module.exports = blogsRouter
