const express = require('express')

const router = express.Router()

const instructorController = require('../controllers/instructor')

// instructor signup
router.post('/signup', instructorController.singup)

// to verify email
router.get('/verify/:id/:token', instructorController.verifyEmail)

// to login user
router.post('/login', instructorController.login)

module.exports = router
