const express = require('express')

const router = express.Router()

const instructorController = require('../controllers/instructor')

// instructor signup
router.post('/signup', instructorController.singup)

// to verify email
router.get('/verify/:id/:token', instructorController.verifyEmail)

// to login user
router.post('/login', instructorController.login)

// to create course
router.post('/createCourse', instructorController.upload, instructorController.createCourse)

// to add modules to course
router.post('/:courseId/module',
  instructorController.productIdValidity,
  instructorController.saveModule,
  instructorController.createModule
)

// to get course details
router.get('/getCourses/:index', instructorController.getCourses)

// get the course details
router.get('/details/:courseId', instructorController.details)

// to delete an entire course
router.delete('/delete/:courseId', instructorController.deleteCourse)

module.exports = router
