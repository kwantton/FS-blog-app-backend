require('dotenv').config()

const PORT = process.env.PORT // environment variable PORT, defined in .env of the root folder! NEVER share that folder in GitHub - include it in .gitignore
const MONGODB_URI = process.env.MONGODB_URI

module.exports = {
  MONGODB_URI,
  PORT // should be 3003
}