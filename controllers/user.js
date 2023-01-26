// import models
const User = require('../models/users')
const Token = require('../models/tocken')
const Course = require('../models/courses')
const Cart = require('../models/cart')

const mongoose = require('mongoose')

// import bcrypt
const bcrypt = require('bcryptjs')

// import jwt
const jwt = require('jsonwebtoken')

// import email facility
const emailSend = require('../util/send_email')

// import crypto to generate tocken
const crypto = require('crypto')

// middleware to act user signup functionality
module.exports.signup = (req, res, next) => {
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
module.exports.login = (req, res, next) => {
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

// to check and verify jwt token
module.exports.authorization = async (req, res, next) => {
  // take the token from string passed from user
  const token = JSON.parse(req.header('Authorization')).jwtToken
  if (!token) {
    res.status(402).send({ message: 'token not exist' })
  }

  try {
    // verify the token
    const verify = await jwt.verify(token, process.env.JWT_SECRET_KEY)
    // send error if ther is no token
    if (!verify) {
      res.status(402).send({ message: 'token not exist' })
    }
    // save the user id to req.body
    req.body.userId = verify.userId
    // call next middleware
    next()
  } catch {
    // send error message
    res.status(500).send({ message: 'error while verifying token' })
  }
}

// to verify email id
module.exports.verifyEmail = async (req, res, next) => {
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

// to get the details of a specific course
module.exports.getCourseDetails = async (req, res, next) => {
  // save the course id
  const courseId = req.params.courseId
  // expect an error
  try {
    // get the course data
    const data = await Course.findById(courseId)
    // data exist. no errors
    if (data) {
      // send the data to user
      res.status(200).send({ course: data, entrolled: false })
    }
  } catch {
    // error found. send error message
    res.status(500).send({ message: 'error while geting course details' })
  }
}

// to check is there any existing course with given id
module.exports.isCourseExists = async (req, res, next) => {
  // expect an error
  try {
    // check the existency of course with given id
    const data = await Course.findById(req.body.courseId)
    if (data) {
      // course exists. go ahead
      next()
    } else {
      // send error message
      res.status(400).send({ message: 'wrong id' })
    }
  } catch {
    // send error message
    res.status(500).send({ message: 'unknow error' })
  }
}

// to add course to user's cart
// /user/addToCart/
module.exports.addToCart = async (req, res, next) => {
  if (req.body.userId) {
    // expect an error
    try {
      // check is ther already a cart array in database
      const cart = await Cart.find({ userId: req.body.userId })
      // there is cart. so add to cart
      if (cart.length) {
        // check is it already in cart
        const existance = await Cart.find({
          userId: req.body.userId,
          'courses.courseId': mongoose.Types.ObjectId(req.body.courseId)
        })

        console.log(existance)
        if (existance.length) {
          // send the information to user
          res.status(200).send({ message: 'already exist in cart' })
        } else {
          // course not exist in cart. so add to cart
          const data = await Cart.findOneAndUpdate(
            { userId: req.body.userId },
            { $push: { courses: { courseId: req.body.courseId } } }
          )

          // send success message
          if (data) {
            res.status(200).send({ message: 'successfully added!' })
          }
        }

        // ther is no cart array
      } else {
        // create new cart and add the course to the cart
        const newCart = new Cart({
          userId: req.body.userId,
          courses: [{ courseId: req.body.courseId }]
        })

        // save createated cart
        const data = await newCart.save()
        if (data) {
          // send success message
          res.status(200).send({ message: 'successfully added!' })
        }
      }
    } catch {
      // send error message
      res.status(500).send({ message: 'error while adding course to cart' })
    }
  }
}
