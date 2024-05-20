const mongoose = require('mongoose') // https://fullstackopen.com/en/part4/user_administration
// for some reason, strictQuery is not set to False here - but seems to work...
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required:true,
    minLength: 3 // 4.16
},
  name: String,
  passwordHash: String, // note: THIS IS passwordHash, NOT password!!! Hence: -> "NB Do not test password restrictions with Mongoose validations. It is not a good idea because the password received by the backend and the password hash saved to the database are not the same thing. The password length should be validated in the controller as we did in part 3 before using Mongoose validation."
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog' //  The ref option is what tells Mongoose which model to use during population, in our case the Blog model. All _ids we store here must be document _ids from the Blog model.
    }
  ],
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // the passwordHash should not be revealed
    delete returnedObject.passwordHash
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User