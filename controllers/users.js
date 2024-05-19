const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.post('/', async (request, response) => { // 4.16 password validation has to be done here, not in models/user, since the mongoose scehma uses passwordHash, not password! That is, the  validations for the actual password, have to be done here.
  const { username, name, password } = request.body

  if (!password) {
    return response.status(400).json({
        error:'error: a password must be entered'
    })
  }
  if (password.length < 3) { // 4.16 password requirements validation
  return response.status(400).json({
    error: 'error: password is too short, minimum length is 3 characters'})
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)
})

usersRouter.get('/', async (request, response) => {
    const users = await User.find({})
    .populate('blogs', {}) // https://fullstackopen.com/en/part4/user_administration so that also the selected properties of all the 'blogs' by the user will be seen
    response.json(users)
  })

module.exports = usersRouter