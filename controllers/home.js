// import jwt
const jwt = require('jsonwebtoken');

let jwtSecretKey = process.env.JWT_SECRET_KEY;

exports.homePage = (req, res, next) => {
  let data = {
    time: Date(),
    userId: 12
  }
  const token = jwt.sign(data, jwtSecretKey);
  console.log(token);
  res.json({ title: 'Home page' });
}
