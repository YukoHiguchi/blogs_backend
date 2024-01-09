const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((n, { likes }) => n + likes, 0)
}

const favoriteBlog = (blogs) => {
  const { title, author, likes } = blogs.reduce(function (prev, current) {
    if (prev && prev.likes > current.likes) {
      return prev
    } else {
      return current
    }
  })
  return { title, author, likes }
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) return null
  let groupByAuthor = {}
  let maxAuthor = null
  let maxCount = 0
  blogs.forEach((blog) => {
    const { author } = blog
    if (groupByAuthor[author]) {
      groupByAuthor[author] += 1
    } else {
      groupByAuthor[author] = 1
    }
  })

  let keys = Object.keys(groupByAuthor)
  for (let i = 0; i < keys.length; i++) {
    if (maxCount < groupByAuthor[keys[i]]) {
      maxAuthor = keys[i]
      maxCount = groupByAuthor[keys[i]]
    }
  }
  return { author: maxAuthor, blogs: maxCount }
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) return null
  let groupByAuthor = {}
  blogs.forEach((blog) => {
    const { author, likes } = blog
    if (groupByAuthor[author]) {
      groupByAuthor[author] += likes
    } else {
      groupByAuthor[author] = likes
    }
  })
  let maxCount = 0
  let maxAuthor = null
  for (let author in groupByAuthor) {
    if (groupByAuthor[author] > maxCount) {
      maxCount = groupByAuthor[author]
      maxAuthor = author
    }
  }
  return { author: maxAuthor, likes: maxCount }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}
