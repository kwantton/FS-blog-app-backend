const { test, describe } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')

describe("Biggest Blogger (most blogs/author):", () => {
    test('of empty list is no-one (returns zero)', () => {
        const blogs = []
        const result = listHelper.mostLikes(blogs)
        assert.strictEqual(result, 0)
    })

    test('when list has only one blog, biggest blogger is its author, duh', () => {
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
        const result = listHelper.mostLikes(listWithOneBlog)
        assert.deepStrictEqual(result, {
            mostLikedBlogger: 'Edsger W. Dijkstra',
            maxLikes:5
          }) // should find 5 likes, duh
    })

    test('of a bigger list is calculated correctly: the blogger with most blogs', () => {
        const many_blogs = [
            {
                _id:'a9wf8euj2o3iu982uag3',
                title: 'I love it NOT',
                author: 'Ronald McDonald',
                url: 'https://wikipedia.org',
                likes: 1
            },
            {
                _id:'9q2a83tua238uaf83a',
                title: 'I love it',
                author: 'Random Dude',
                url: 'https://youtube.com',
                likes: 10
            },
            {
                _id:'a93jai2u3gh9pa823uga',
                title: 'I´m loving it',
                author: 'Ronald McDonald',
                url: 'https://whothehellknows.com',
                likes: 9
            },
            {
                _id:'a9382ai3gjai3',
                title: 'I love it JUST A BIT more',
                author: 'Random Dude',
                url: 'https://youtube.com',
                likes: 1000
            },
            {
                _id:'aa9p238aoiga3',
                title: 'I love it SO MUCH omg...',
                author: 'Random SuperMan',
                url: 'https://youtube.com',
                likes: 420
            },
            {
                _id:'a9823jioa2j3oru23oegrp9a8rug',
                title: 'I don´t think I love it any longer... :c',
                author: 'The Skeleton in your Closet',
                url: 'https://ranoutofideas.org',
                likes: 2
            }
        ]
        const result = listHelper.mostLikes(many_blogs)
        assert.deepStrictEqual(result, {
            mostLikedBlogger:'Random Dude', 
            maxLikes:1010
        })
    })
})