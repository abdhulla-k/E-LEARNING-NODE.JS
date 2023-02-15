// import inbuild modules
const fs = require('fs')
// const path = require('path')

// import models
const User = require('../models/users')
const Token = require('../models/tocken')
const Course = require('../models/courses')
const Cart = require('../models/cart')
const Wishlist = require('../models/wishlist')
const EntrolledCourse = require('../models/entrolled-courses')

const mongoose = require('mongoose')

// import stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

// import bcrypt
const bcrypt = require('bcryptjs')

// import jwt
const jwt = require('jsonwebtoken')

// import multer
const multer = require('multer')

// import util files
// import email facility
const emailSend = require('../util/send_email')

// import generate otp function
const generateOtp = require('../util/generate_otp')

// import crypto to generate tocken
const crypto = require('crypto')

// multer location set
const upload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/profile/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '_' + req.body.userId + '_' + Date.now() + '.jpg')
  }
})

const profilePicStore = multer({ storage: upload })

// middleware to act user signup functionality
module.exports.signup = (req, res, next) => {
  try {
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
                    token.save().then(async (data) => {
                      // generate otp
                      const otp = await generateOtp()
                      req.session.otp = otp
                      setTimeout(() => {
                        req.session.otp = null
                      }, 60 * 1000)

                      // send account verification email
                      emailSend(
                        createdData.email,
                        'successfully created your account.please verify by clicking this below link or entering otp',
                        `${process.env.BASE_URL}${createdData.id}/${token.token}           \n your otp is: ${otp}`)
                        .then(status => {
                          // send response
                          res.status(200).json({
                            status: false,
                            message: 'account successfully created. please verify your account',
                            userId: data.userId
                          })
                        })
                        .catch(err => {
                          if (err) {
                            res.status(500).json({ status: false, message: 'problem faced while creating tocken. please use resend email!' })
                          }
                        })
                    })
                  })
                    .catch(err => {
                      // handling error
                      if (err) {
                        res.status(500).json({ status: false, message: 'problem faced while saving data' })
                      }
                    })
                }
              })
            }
          })
        } else {
          // send response
          res.status(500).json({ status: false, message: 'email already exists' })
        }
      }
    })
  } catch {
    res.status(500).json({ status: false, message: 'unknow error' })
  }
}

// verify otp
// /user/verifyOtp
module.exports.verifyOtp = async (req, res, next) => {
  try {
    const userId = req.body.userId
    const otp = req.body.otp

    // find user with the id
    const user = await User.findOne({ _id: mongoose.Types.ObjectId(userId) })
    if (!user) return res.status(400).send({ message: 'user not exist with provided id' })
    if (parseInt(req.session.otp) === parseInt(otp)) {
      user.user_verified = true
      const savedUser = await user.save()
      if (savedUser) res.status(200).json({ message: 'successfully verifyed' })
    } else {
      res.status(400).json({ message: 'wrong otp' })
    }
  } catch {
    res.status(500).json({ message: 'error found while verifying otp! please try later' })
  }
}

// login middleware
module.exports.login = (req, res, next) => {
  try {
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
              res.status(404).json({ message: 'error found while finding user' })
            } else if (!isMatch) {
              res.status(403).json({ message: 'wrong password' })
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
                res.status(200).json({ jwtToken: token, message: 'user logged in', loggedIn: true, time: 10000000 })
              } else {
                res.status(554).json({ message: 'please verify your email' })
              }
            }
          }
        )
      } else {
        res.status(554).json({ message: 'email not exist', loggedIn: false })
      }
    })
      .catch(err => {
        if (err) {
          console.log(err)
          res.status(500).json({ message: 'error occured while finding user data', loggedIn: false })
        }
      })
  } catch {
    res.status(500).json({ message: 'error occured while finding user data', loggedIn: false })
  }
}

// to check and verify jwt token
module.exports.authorization = async (req, res, next) => {
  // take the token from string passed from user
  const token = req.header('Authorization')
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

// to get all cart details
// /user/getCart
module.exports.getCart = async (req, res, next) => {
  // find cart
  // const cartData = await Cart.findOne({ userId: req.body.userId })
  const cartData = await Cart.aggregate([{
    $match: { userId: mongoose.Types.ObjectId(req.body.userId) }
  }, {
    $unwind: '$courses'
  }, {
    $lookup: {
      from: 'courses',
      localField: 'courses.courseId',
      foreignField: '_id',
      as: 'course_details'
    }
  }])
  // send error message
  if (!cartData) return res.status(404).json({ status: false, message: 'cart not found' })

  // send success message and data
  res.status(200).json({ status: true, data: cartData })
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
          return res.status(400).json({ message: 'Course already exists in Cart.' })
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

// to remove course from cart
// /user/removeFromCart
module.exports.removeFromCart = async (req, res, next) => {
  try {
    // save user id and course id
    const userId = req.body.userId
    const courseId = req.params.courseId

    // find the user's cart
    const cart = await Cart.findOne({ user: userId })
    if (!cart) {
      // return error message
      return res.status(404).json({ message: 'Cart not found.' })
    }

    // remove the course from the user's cart
    cart.courses = cart.courses.filter(c => c.courseId.toString() !== mongoose.Types.ObjectId(courseId).toString())
    // save updated cart
    await cart.save()
    // send the success message
    res.status(200).json({ message: 'Course removed from cart.' })
  } catch (err) {
    // send error message
    res.status(500).json({ message: 'Error removing course from cart.' })
  }
}

// to checkout cart and place order
// /user/placeCartOrder
module.exports.placeCartOrder = async (req, res, next) => {
  try {
    // save user data
    const userId = req.body.userId

    // get cart data
    const cartData = await Cart.aggregate([{
      $match: { userId: mongoose.Types.ObjectId(userId) }
    }, {
      $unwind: '$courses'
    }, {
      $lookup: {
        from: 'courses',
        localField: 'courses.courseId',
        foreignField: '_id',
        as: 'course_details'
      }
    }])

    // create a token and add the token with the url to verify payment
    const tokenData = {
      cartId: cartData[0]._id,
      userId: req.body.userId
    }

    // create jwt token
    const token = jwt.sign(tokenData, process.env.JWT_SECRET_KEY)

    // send error message if token creation failed
    if (!token) return res.status(500).json({ message: 'unknown error! please try later' })

    // create stripe session and give all required data
    const session = await stripe.checkout.sessions.create({
      line_items: cartData[0].course_details.map((item) => {
        return {
          price_data: {
            currency: 'inr',
            product_data: {
              name: item.title
            },
            unit_amount: item.price * 100
          },
          quantity: 1
        }
      }),
      mode: 'payment',
      success_url: `${process.env.FRONTENT_USER_BASE_URL}payment/verify?token=${token}`,
      cancel_url: `${process.env.FRONTENT_USER_BASE_URL}myCart`
    })

    // send success message
    res.status(200).json({ session })
  } catch {
    // send error message
    res.status(500).json({ message: 'process failed! please try later' })
  }
}

// to verify order
// /user/payment/verify
module.exports.verifyOrder = async (req, res, next) => {
  try {
    // save token
    const token = req.body.token

    // verify token and get the data from the token.
    // there is userId and cart id in this token
    const verify = await jwt.verify(token, process.env.JWT_SECRET_KEY)

    // return error message if token wrongg
    if (!verify) return res.status(404).json({ status: false, message: 'wrong token!' })

    // make sure the userId from authorization token and verification token is same
    if (!req.body.userId === token.userId) return res.status()

    // get cart data
    const cart = await Cart.findById(verify.cartId)
    // send error response
    if (!cart) return res.staus(404).json({ status: false, message: 'cart not found' })

    // save course to entrolled courses
    // first find the course and check is null or not
    const entrolledCourse = await EntrolledCourse.findOne({ userId: mongoose.Types.ObjectId(req.body.userId) })

    // if it is null. then create new collection
    if (entrolledCourse === null) {
      const newEntrolle = new EntrolledCourse({
        userId: req.body.userId,
        courses: [...cart.courses]
      })
      await newEntrolle.save()
      // update if ther is existing collection
    } else {
      entrolledCourse.courses = [...entrolledCourse.courses, ...cart.courses]
      await entrolledCourse.save()
    }

    // delete cart
    const cartDelete = await Cart.findByIdAndDelete(verify.cartId)
    if (!cartDelete) return res.status(404).json({ status: false, message: 'cart not exist' })

    // send success message
    res.status(200).json({ status: true, message: 'order verifyed' })
  } catch {
    // find user data
    const userData = await User.findById(req.body.userId)

    try {
      // send email
      const status = await emailSend(
        userData.email,
        'successfully created your account.please verify',
        `${process.env.FRONTENT_USER_BASE_URL}payment/verify?token=${req.body.token})`
      )
      // return message
      if (!status.status) return res.status(500).json({ status: false, message: 'unknow error while verifying order! please contact us.' })
    } catch {
      // send error message
      return res.status(500).json({ status: false, message: 'unknow error while verifying order! please contact us.' })
    }
    // send error message
    res.status(500).json({ status: false, message: 'unknow error while verifying order! check your email to verify it' })
  }
}

// to get enrolled courses
// /user/enrolledCourses
module.exports.getEnrolledCourses = async (req, res, next) => {
  // expect an array while handling database
  try {
    // get user id
    const userId = req.body.userId
    // retrive course details
    const enrolledCourses = await EntrolledCourse.aggregate([{
      $match: {
        userId: mongoose.Types.ObjectId(userId)
      }
    }, {
      $unwind: '$courses'
    }, {
      $lookup: {
        from: 'courses',
        localField: 'courses.courseId',
        foreignField: '_id',
        as: 'course_details'
      }
    }])

    // return data to user
    res.status(200).json({ status: true, courses: enrolledCourses })
  } catch {
    // return error message
    res.status(500).json({
      status: false,
      message: 'error while getting enrolled course! please try later or make sure you already enrolled in any course'
    })
  }
}

// to rate course
// /user/rateCourse/courseId/starCount
// module.exports.rateCourse = async (req, res, next) => {
//   // save courseid and star count
//   const courseId = req.params.courseId
//   const starCount = req.params.starCount

//   // return error message if user send the number greater than 5
//   if (starCount > 5) return res.status(400).json({ message: 'star should be less then 6' })
//   // save the data in course
//   Course.findOne({_id: mongoose.Types})
// }

// to get all wishlist
// /user/getWishlist
module.exports.getWishlists = async (req, res, next) => {
  // find wishlist and aggregate course details
  const wishlist = await Wishlist.aggregate([{
    $match: { user: mongoose.Types.ObjectId(req.body.userId) }
  }, {
    $unwind: '$courses'
  }, {
    $lookup: {
      from: 'courses',
      localField: 'courses',
      foreignField: '_id',
      as: 'course_details'
    }
  }])

  // send error message
  if (!wishlist) return res.status(404).json({ status: false, message: 'wishlist not found' })

  // send success message and data
  res.status(200).json({ status: true, data: wishlist })
}

// to add course to user's wishlist
// /user/addToWishlist
module.exports.addToWishlist = async (req, res, next) => {
  try {
    // save user id and courseid
    const userId = req.body.userId
    const courseId = req.body.courseId

    // find the user's wishlist
    let wishlist = await Wishlist.findOne({ user: userId })
    // create new one if ther is no wishlist
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, courses: [] })
    }

    // Check if course already exists in the user's wishlist
    if (wishlist.courses.includes(courseId)) {
      return res.status(400).json({ message: 'Course already exists in wishlist.' })
    }

    // Add course to user's wishlist
    wishlist.courses.push(courseId)
    await wishlist.save()

    // send success message
    res.status(201).json({ message: 'Course added to wishlist.' })
  } catch (err) {
    // send error message
    res.status(500).json({ message: 'Error adding course to wishlist.' })
  }
}

// to remove from wishlist
// /user/removeFromWishlist
module.exports.removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.body.userId
    const courseId = req.params.courseId
    // find the user's wishlist
    const wishlist = await Wishlist.findOne({ user: userId })
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found.' })
    }

    // check if course exists in the user's wishlist
    if (!wishlist.courses.includes(courseId)) {
      // send error message
      return res.status(404).json({ message: 'Course not found in wishlist.' })
    }

    // remove the course from the user's wishlist
    wishlist.courses = wishlist.courses.filter(c => c.toString() !== courseId.toString())
    // save updated wishlist
    await wishlist.save()
    // send the success message
    res.status(200).json({ message: 'Course removed from wishlist.' })
  } catch (err) {
    // send error message
    res.status(500).json({ message: 'Error removing course from wishlist.' })
  }
}

// to play a video
module.exports.playVideo = async (req, res, next) => {
  try {
    // get the video name from params and set the path
    const path = `./public/modules/${req.params.name}`
    // set all required things to streem video
    // retrieve information about the file
    const stat = fs.statSync(path)
    const fileSize = stat.size
    // set range variable. header is used to specify the range of bytes of the video file to be returned in the response.
    const range = req.headers.range

    if (range) {
      // splits the range string into an array of two parts using the split method.
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

      const chunksize = (end - start) + 1
      // create a read stream from the file using the fs.createReadStream method
      const file = fs.createReadStream(path, { start, end })
      const head = {
        'Content-Range': `bytes ${start} - ${end} / ${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      }

      res.writeHead(206, head)
      file.pipe(res)
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      }
      res.writeHead(200, head)
      fs.createReadStream(path).pipe(res)
    }
  } catch {
    res.status(500).json({ message: 'error while playing video' })
  }
}

// to send user profile page data
module.exports.profile = async (req, res, next) => {
  // expecting an error when handling database
  try {
    // save user id
    const usersId = req.body.userId

    // get user data from database
    const userData = await User.findById(usersId)

    // send error message if ther is no user data
    if (!userData) return res.status(500).json({ status: false, message: 'error while getting user data' })

    // get entrolled courses from database
    const courses = await EntrolledCourse.findOne({ userId: usersId })

    // send data back
    res.status(200).json({
      status: true,
      userDetails: userData,
      entrolledCourse: courses === null ? [] : courses.courses
    })
  } catch {
    // send error message
    res.status(500).json({ status: false, message: 'error while finding user profile' })
  }
}

// to save the public profile links of user
// user/saveLinks
module.exports.saveLinks = async (req, res, next) => {
  const userId = req.body.userId
  // save user entered data
  const userlinks = {
    linkdIn: req.body.linkdIn,
    gitHub: req.body.gitHub,
    twitter: req.body.twitter,
    instagram: req.body.instagram
  }

  // update user profile
  const status = await User.findByIdAndUpdate(userId, { links: userlinks })

  // send the error message if ther is an error when saving the data
  if (!status) return res.status(500).json({ staus: false, message: 'error while saving the data' })

  const userData = await User.findById(userId)
  if (!userData) return res.status(500).json({ status: false, message: 'error while getting data back' })
  // send the data and success message
  res.status(200).json({
    status: true,
    userDetails: userData.links
  })
}

// to save the profile pic with multer
module.exports.saveProfilePic = profilePicStore.single('profilePic')

// to save profile path
// user/saveProfilePic
module.exports.saveProfilePath = async (req, res, next) => {
  try {
    // get user id
    const userId = req.body.userId
    // update the imagepath to user data
    const status = await User.findByIdAndUpdate(userId, { profile_img: req.file.path })
    // return error message if there any problem while saving the data
    if (!status) return res.status(500).json({ status: false, message: 'error while saving image path' })

    // send success message if ther is data
    res.status(200).json({ status: true, message: 'image successfully updated', newPath: req.file.path })
  } catch {
    // send error message
    res.status(500).json({ status: false, message: 'error while uploading data' })
  }
}
