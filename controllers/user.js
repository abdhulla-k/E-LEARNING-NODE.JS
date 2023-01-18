// import models
const User = require('../models/users')
const Token = require('../models/tocken')
const Course = require('../models/courses')

// import bcrypt
const bcrypt = require('bcryptjs')

// import jwt
const jwt = require('jsonwebtoken')

// import email facility
const emailSend = require('../util/send_email')

// import crypto to generate tocken
const crypto = require('crypto')

// middleware to act user signup functionality
exports.signup = (req, res, next) => {
  // obtain all data user entered in signup form
  const signupData = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  }

  // set salt round to bcrypt the password
  const saltRound = 10

  // check is it exist or not
  User.find({
    email: signupData.email
  }, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      // save user if it is not exist in database
      if (data.length === 0) {
        // bcrypt the password
        bcrypt.genSalt(saltRound, (saltError, salt) => {
          if (saltError) {
            throw saltError
          } else {
            bcrypt.hash(signupData.password, salt, (hashError, hash) => {
              if (hashError) {
                throw hashError
              } else {
                // create User object or document
                const user = new User({
                  name: signupData.name,
                  email: signupData.email,
                  password: hash,
                  user_verified: false
                })
                // save user data
                user.save().then(createdData => {
                  // create a tocken and save it in tocken collection to verify email.
                  const token = new Token({
                    userId: createdData.id,
                    token: crypto.randomBytes(32).toString('hex')
                  })
                  token.save().then(data => {
                    console.log(data)
                    // send account verification email
                    console.log('start')
                    emailSend(
                      createdData.email,
                      'successfully created your account.please verify',
                      `${process.env.BASE_URL}${createdData.id}/${token.token}`)
                      .then(status => {
                        // send response
                        res.json({
                          status: 200,
                          message: 'account successfully created. please verify your account'
                        })
                      })
                      .catch(err => {
                        if (err) {
                          res.json({ message: 'problem faced while creating tocken. please use resend email!' })
                        }
                      })
                  })
                })
                  .catch(err => {
                    // handling error
                    if (err) {
                      res.json({ message: 'problem faced while saving data' })
                    }
                  })
              }
            })
          }
        })
      } else {
        // send response
        res.json({ status: 409, message: 'email already exists' })
      }
    }
  })
}

// login middleware
exports.login = (req, res, next) => {
  const loginData = {
    email: req.body.email,
    password: req.body.password
  }

  User.findOne({ email: loginData.email }).then(data => {
    if (data) {
      // compare password if a user exist with the given email
      bcrypt.compare(
        loginData.password,
        data.password,
        (err, isMatch) => {
          if (err) {
            res.json({ message: 'error found while finding user' })
          } else if (!isMatch) {
            res.json({ message: 'wrong password' })
          } else {
            if (data.user_verified === true) {
              // create jwt token
              const jwtSecretKey = process.env.JWT_SECRET_KEY
              const tokenData = {
                time: Date(),
                userId: data.id
              }

              // generate token
              const token = jwt.sign(tokenData, jwtSecretKey)
              res.json({ jwtToken: token, message: 'user logged in', loggedIn: true, time: 10000000 })
            } else {
              res.json({ message: 'please verify your email' })
            }
          }
        }
      )
    } else {
      res.json({ message: 'email not exist', loggedIn: false })
    }
  })
    .catch(err => {
      if (err) {
        console.log(err)
        res.json({ message: 'error occured while finding user data', loggedIn: false })
      }
    })
}

// to verify email id
exports.verifyEmail = async (req, res, next) => {
  // expecting an error while verifying email
  try {
    // get user data with the id provided in link
    const user = await User.findOne({ _id: req.params.id })
    // send error message if there is no user
    if (!user) return res.json({ message: 'Invalid user', status: false })
    // if (!user) return res.status(400).send({ message: 'Invalid user', status: false })

    // check is it a valid user id
    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token
    })

    if (!user) return res.json({ message: 'Invalid user', status: false })

    // user exist. so
    // verify user
    await User.updateOne({ _id: user._id }, { user_verified: true })

    // delete the token from collection
    await Token.findByIdAndRemove(token._id)

    // send success message
    res.send({ message: 'email verified sucessfully', status: true })
  } catch (error) {
    // res.status(400).send({ message: 'An error occured', status: false })
    res.json({ message: 'An error occured', status: false })
  }
}

// send the courses to frontend
module.exports.getCourses = async (req, res, next) => {
  // expect error while fetching data
  try {
    // get the index to skip data while fetching
    const index = req.params.index
    // get the course details
    const courses = await Course.find({}).skip(index * 10)
    // send it to instructor
    res.json(courses)
  } catch {
    // send error message
    res.json({ message: 'error while fetching data' })
  }
}
