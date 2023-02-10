// import express and create an instance
const express = require('express');
const router = express.Router();

// home controllers. It is for all users
const userControllers = require('../controllers/home');

// for home page. empty url
router.get('/', userControllers.homePage);

// export the router
module.exports = router;
