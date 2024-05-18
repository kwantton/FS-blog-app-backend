const { test, describe } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')

describe("Total likes:", () => {
    test('of empty list is zero', () => {
        const blogs = []
        const result = listHelper.totalLikes(blogs)
        assert.strictEqual(result, 0)
    })

    test('when list has only one blog equals the likes of that single blog', () => {
        const listWithOneBlog = [
            {
              _id: '5a422aa71b54a676234d17f8',
              title: 'Go To Statement Considered Harmful',
              author: 'Edsger W. Dijkstra',
              url: 'https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf',
              likes: 5,
              __v: 0
            }
        ]
        const result = listHelper.totalLikes(listWithOneBlog)
        assert.strictEqual(result, 5) // should find 5 likes, duh
    })

    test('of a bigger list is calculated correctly', () => {
        const many_blogs = [
            {
                _id:'9q2a83tua238uaf83a',
                title: 'I love it',
                author: 'Random Dude',
                url: 'https://youtube.com',
                likes: 10
            },
            {
                _id:'a9wf8euj2o3iu982uag3',
                title: 'I love it NOT',
                author: 'Some Guy',
                url: 'https://wikipedia.org',
                likes: 1
            },
            {
                _id:'a93jai2u3gh9pa823uga',
                title: 'I´m loving it',
                author: 'Ronald McDonald',
                url: 'https://whothehellknows.com',
                likes: 6
            },
            {
                _id:'a9823jioa2j3oru23oegrp9a8rug',
                title: 'I don´t think I love it any longer... :c',
                author: 'The Skeleton in your Closet',
                url: 'https://ranoutofideas.org',
                likes: 2
            }
        ]
        const result = listHelper.totalLikes(many_blogs)
        assert.strictEqual(result, 19) // should find 5 likes, duh
    })
})