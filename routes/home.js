// import express and create an instance
const express = require('express')
const router = express.Router()

// home controllers. It is for all users
const homeController = require('../controllers/home')

// for home page. empty url
router.get('/', homeController.homePage)

// to search courses
router.get('/courses/search', homeController.search)

// export the router
module.exports = router
