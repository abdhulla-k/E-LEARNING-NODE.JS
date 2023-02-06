// import express and implement route
const express = require('express')
const router = express.Router()

// import user controller
const userController = require('../controllers/user')

// user signup route
// /user/signup
router.post('/signup', userController.signup)

// user login route
// /user/login
router.post('/login', userController.login)

// email verification route
// /user/verify/:id/:token
router.get('/verify/:id/:token', userController.verifyEmail)

// to get courses
router.get('/getCourses/:index', userController.getCourses)

// to get detatils of a specific course
router.get('/courses/details/:courseId', userController.getCourseDetails)

// to get all cart data
router.get(
  '/getCart',
  userController.authorization,
  userController.getCart
)

// to add a course to cart
router.post(
  '/addToCart',
  userController.authorization,
  userController.isCourseExists,
  userController.addToCart
)

// to remove from cart
router.delete(
  '/removeFromCart/:courseId',
  userController.authorization,
  userController.removeFromCart
)

// to place order. buy entire cart
router.get(
  '/placeCartOrder',
  userController.authorization,
  userController.placeCartOrder
)

// to get all wishlist data
router.get(
  '/getWishlists',
  userController.authorization,
  userController.getWishlists
)

// add to wishlist
router.post(
  '/addToWishlist',
  userController.authorization,
  userController.isCourseExists,
  userController.addToWishlist
)

// remove from wishlist
router.delete(
  '/removeFromWishlist/:courseId',
  userController.authorization,
  userController.removeFromWishlist
)

// to play videos
router.get('/playVideo/:name', userController.playVideo)

// to get user profile data
router.get(
  '/userProfile',
  userController.authorization,
  userController.profile
)

// save user's public profile links
router.post(
  '/saveUserLinks',
  userController.authorization,
  userController.saveLinks
)

router.post(
  '/saveProfilePic',
  userController.authorization,
  userController.saveProfilePic,
  userController.saveProfilePath
)

// export the router
module.exports = router
