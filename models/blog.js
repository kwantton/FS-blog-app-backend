const mongoose = require('mongoose') // mongodb (from npm install mongoose; mongodb atlas on the web = cloud.mongodb.com).

mongoose.set('strictQuery', false)

const url = process.env.MONGODB_URI // "It's not a good idea to hardcode the address of the database into the code, so instead the address of the database is passed to the application via the MONGODB_URI environment variable." This is stored in root/.env of the git c:

console.log('connecting to', url)
mongoose.connect(url)

  .then(result => {
    console.log('connected to MongoDB')
  })
  .catch(error => {
    console.log('error connecting to MongoDB:', error.message)
  })

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    minLength: 3,
    required: true  // enforces that all these are true!
  },
  author: {
    type: String,
    minLength: 1,
    required: true
  },
  url: {
    type: String,
    minLength:1,
    required: true
  },
  likes: {
    type: Number,
    required:true
  }
})

blogSchema.set('toJSON', {  // author and title should be ok, no need to convert them to something else?
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    returnedObject.likes = returnedObject.likes // TO-DO: make sure the number becomes a number
    returnedObject.url = returnedObject.url.toString() // TO-DO: check
    delete returnedObject._id // "Even though the _id property of Mongoose objects looks like a string, it is in fact an object. The toJSON method we defined transforms it into a string just to be safe. If we didn't make this change, it would cause more harm to us in the future once we start writing tests." https://fullstackopen.com/en/part3/saving_data_to_mongo_db#fetching-objects-from-the-database
    delete returnedObject.number // TO-DO: make sure this is ok
    delete returnedObject.__v // "The versionKey is a property set on each document when first created by Mongoose. This keys value contains the internal revision of the document. The name of this document property is configurable. The default is __v." SO, I suppose the point is, that we don't need __v in a RETURNED object, so just get rid of it
  }
})

module.exports = mongoose.model('Blog', blogSchema)