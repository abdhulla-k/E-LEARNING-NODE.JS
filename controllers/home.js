// import jwt
const jwt = require('jsonwebtoken')
const Courses = require('../models/courses')

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

// to search courses
// /search
exports.search = async (req, res, next) => {
  try {
    const pattern = `${req.query.searchData}`
    // Search for documents based on a regular expression
    const query = { title: { $regex: pattern } }
    const cursor = await Courses.find(query)
    res.status(200).json({ status: true, data: cursor })
  } catch {
    res.status(500).json({ status: false, message: 'error found while searching' })
  }
}
