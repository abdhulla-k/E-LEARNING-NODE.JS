// import express
const express = require('express');

// create the instance of expresslibrary
const app = express();

// import routers
const userRoutes = require("./routes/home");

// to user routes
app.use('/', userRoutes);

// make it possible to listen
app.listen(3000);