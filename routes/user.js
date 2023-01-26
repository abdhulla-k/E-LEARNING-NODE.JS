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

// to add a course to cart
router.post('/addToCart', userController.authorization, userController.isCourseExists, userController.addToCart)

// export the router
module.exports = router
