const dummy = blogs => {
    return 1
}

const totalLikes = blogs => {
    if(blogs.length === 0) { 
        console.log("pituus oli 0!")
        console.log("-likes: 0")
        console.log("---")
        return 0
    } else {
        console.log("pituus:", blogs.length)
        const likes = blogs.reduce((previous, current) => {
            return previous + Number.parseInt(current.likes)
            }, 0)
        console.log("-likes", likes)
        console.log("---")
        return likes}
}

const favoriteBlog = blogs => {
    if(blogs.length === 0) { 
        console.log("No blogs, cannot determine favoriteBlog!")
        console.log("---")
        return 0
    } else {
        console.log("finding favorite blog...")
        let max = blogs[0]
        blogs.forEach(blog => {
            if (blog.likes > max.likes) {
                max = blog
            }
        })
        console.log("favorite blog was found! Title:", max.title, "- with this many likes:", max.likes)
        console.log("---")
        return max
}
}

const mostBlogs = blogs => {
    if(blogs.length === 0) { 
        console.log("No blogs, cannot determine author with most blogs!")
        console.log("---")
        return 0
    } else {
        const numberOfBlogsPerAuthor = {} // author:blogcount, for each author
        console.log("finding the author with most blogs...")
        let mostBlogger = blogs[0].author
        let maxBlogs = 1
        blogs.forEach(blog => {
            numberOfBlogsPerAuthor[blog.author] = 0 // initializing the object "author" which I'll use for counting the number of blogs each author has written
        })
        // actual counting
        blogs.forEach(blog => {
            numberOfBlogsPerAuthor[blog.author] += 1
            if (numberOfBlogsPerAuthor[blog.author] > maxBlogs) {
                mostBlogger = blog.author
                maxBlogs = numberOfBlogsPerAuthor[blog.author]
            }
        })
        console.log("Author with most blogs was found! Name:", mostBlogger, "with", maxBlogs, "blogs")
        console.log("---")
        return {
            mostBlogger,
            maxBlogs
        }
}
}

const mostLikes = blogs => {
    if(blogs.length === 0) { 
        console.log("No blogs, cannot determine author with most likes!")
        console.log("---")
        return 0
    } else {
        const numberOfLikesPerAuthor = {} // author:blogcount, for each author
        console.log("finding the author with most likes...")
        let mostLikedBlogger = blogs[0].author
        let maxLikes = 0
        blogs.forEach(blog => {
            numberOfLikesPerAuthor[blog.author] = 0 // initializing the object "author" which I'll use for counting the number of blogs each author has written
        })
        // actual counting
        blogs.forEach(blog => {
            numberOfLikesPerAuthor[blog.author] += blog.likes
            if (numberOfLikesPerAuthor[blog.author] > maxLikes) {
                mostLikedBlogger = blog.author
                maxLikes = numberOfLikesPerAuthor[blog.author]
            }
        })
        console.log("Author with most likes was found! Name:", mostLikedBlogger, "with", maxLikes, "likes")
        console.log("---")
        return {
            mostLikedBlogger,
            maxLikes
        }
}
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}