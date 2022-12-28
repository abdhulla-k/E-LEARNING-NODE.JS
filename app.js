// import express
const express = require('express');

// import cors
const cors = require('cors');

// create the instance of expresslibrary
const app = express();

// configuring cors
const corsOptions = {
    origin: 'http://localhost:9000'
}
app.use(cors(corsOptions));

// import routers
const userRoutes = require('./routes/home');

// to user routes
app.use('/', userRoutes);

// make it possible to listen
app.listen(3000);
