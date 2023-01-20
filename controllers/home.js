// import jwt
const jwt = require('jsonwebtoken')

const jwtSecretKey = process.env.JWT_SECRET_KEY

exports.homePage = (req, res, next) => {
  const data = {
    time: Date(),
    userId: 12
  }
  const token = jwt.sign(data, jwtSecretKey)
  console.log(token)
  res.json({ title: 'Home page' })
}
