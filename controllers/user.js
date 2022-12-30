// import models
const User = require('../models/users')
const Token = require('../models/tocken')

// import bcrypt
const bcrypt = require('bcryptjs')

// import jwt
// const jwt = require('jsonwebtoken')

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

// to verify email id
exports.verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id })
    if (!user) return res.status(400).send('Invalid link')

    // check is it a valid user id
    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token
    })

    if (!token) return res.status(400).send('Invalid link')

    await User.updateOne({ _id: user._id, verified: true })
    await Token.findByIdAndRemove(token._id)

    res.send('email verified sucessfully')
  } catch (error) {
    res.status(400).send('An error occured')
  }
}
