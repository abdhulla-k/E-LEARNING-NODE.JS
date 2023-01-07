const express = require('express')

const router = express.Router()

const instructorController = require('../controllers/instructor')

router.post('/login', instructorController.login)

module.exports = router
