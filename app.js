// import express
const express = require('express');

// import cors
const cors = require('cors');

// import dotenv
const dotenv = require('dotenv');

// import jwt
const jwt = require('jsonwebtoken');

// import mongoose
const mongoose = require('mongoose');

// create the instance of expresslibrary
const app = express();

// Set up Global configuration access for dotenv
dotenv.config();

// configuring cors
const corsOptions = {
    origin: 'http://localhost:9000'
}
app.use(cors(corsOptions));

// import routers
const userRoutes = require('./routes/home');

// to user routes
app.use('/', userRoutes);

// connect with database
mongoose.connect("mongodb://localhost:27017/newApplication").then(data => {
    console.log("connected");

    // make it listenable
    app.listen(3000);
}).catch(err => {
    console.log(err);
})