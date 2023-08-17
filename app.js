// import express
const express = require('express')

// import path module
const path = require('path')

// import cors
const cors = require('cors')

// import dotenv
const dotenv = require('dotenv')

// import jwt
// const jwt = require('jsonwebtoken')

// import mongoose
const mongoose = require('mongoose')

// create the instance of expresslibrary
const app = express()

// Set up Global configuration access for dotenv
dotenv.config()

// set public path
app.use(express.static(path.join(__dirname, 'public')))
// Function to serve all static files
// inside public directory.
app.use('/public', express.static('public'))

// configuring cors
const corsOptions = {
  origin: 'http://localhost:9000'
}
app.use(cors(corsOptions))

// get the user entered data
app.use(express.json())

// import routers
const homeRoutes = require('./routes/home')
const userRoutes = require('./routes/user')
const instructorRoutes = require('./routes/instructor')

// enable routing
app.use('/', homeRoutes) // home routes
app.use('/user', userRoutes) // users related routes
app.use('/instructor', instructorRoutes)

// connect with database
mongoose.set('strictQuery', false)
mongoose.connect(
  'mongodb+srv://Abdhulla_K:OQ0ZRgli20eGqKGI@cluster0.fojetus.mongodb.net/?retryWrites=true&w=majority'
)
  .then(data => {
    console.log('connected')

    // make it listenable
    app.listen(3000)
  }).catch(err => {
    console.log(err)
  })
