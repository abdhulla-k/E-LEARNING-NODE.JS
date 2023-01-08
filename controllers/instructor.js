// import models
const Instructor = require('../models/instructor')
const Token = require('../models/tocken')

// import bcrypt
const bcrypt = require('bcryptjs')

// import jwt
const jwt = require('jsonwebtoken')

// import email facility
const emailSend = require('../util/send_email')

// import crypto to generate tocken
const crypto = require('crypto')

// singup controller
module.exports.singup = (req, res, next) => {
  // obtain all data user entered in signup form
  try {
    const signupData = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    }

    console.log(signupData)

    // set salt round to bcrypt the password
    const saltRound = 10

    // check is it exist or not
    Instructor.find({
      email: signupData.email
    }, (err, data) => {
      if (err) {
        console.log(err)
      } else {
        console.log(data)

        // save user if it is not exist in database
        if (data.length <= 0) {
          console.log(`length: ${data.length}`)
          // bcrypt the password
          bcrypt.genSalt(saltRound, (saltError, salt) => {
            if (saltError) {
              throw saltError
            } else {
              bcrypt.hash(signupData.password, salt, (hashError, hash) => {
                if (hashError) {
                  console.log(hashError)
                  throw hashError
                } else {
                  // create User object or document
                  const user = new Instructor({
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
                        `${process.env.BASE_URL_INST}${createdData.id}/${token.token}`)
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
  } catch {
    console.log('error')
  }
}

// to verify email id
exports.verifyEmail = async (req, res, next) => {
  try {
    const user = await Instructor.findOne({ _id: req.params.id })
    console.log(`user: ${user}`)
    if (!user) return res.json({ message: 'Invalid user', status: false })
    // if (!user) return res.status(400).send({ message: 'Invalid user', status: false })

    // check is it a valid user id
    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token
    })

    console.log(`token: ${token}`)

    if (!user) return res.json({ message: 'Invalid user', status: false })

    await Instructor.updateOne({ _id: user._id }, { user_verified: true })
    console.log('reached')
    await Token.findByIdAndRemove(token._id)
    console.log('completed')
    res.send({ message: 'email verified sucessfully', status: true })
  } catch (error) {
    // res.status(400).send({ message: 'An error occured', status: false })
    res.json({ message: 'An error occured', status: false })
  }
}

// login controller
module.exports.login = (req, res, next) => {
  const loginData = {
    email: req.body.email,
    password: req.body.password
  }

  Instructor.findOne({ email: loginData.email }).then(data => {
    if (data) {
      // compare password if a user exist with the given email
      bcrypt.compare(
        loginData.password,
        data.password,
        (err, isMatch) => {
          if (err) {
            res.json({ message: 'error found while finding instructor' })
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
              res.json({ jwtToken: token, message: 'instructor logged in', loggedIn: true, time: 10000000 })
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
        res.json({ message: 'error occured while finding instructor data', loggedIn: false })
      }
    })
}
