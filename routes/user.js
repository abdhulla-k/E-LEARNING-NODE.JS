// import express and implement route
const express = require('express')
const router = express.Router()

// import user controller
const userController = require('../controllers/user')

// user signup route
// /user/signup
router.post('/signup', userController.signup)

// export the router
module.exports = router
