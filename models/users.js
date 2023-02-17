const mongoose = require('mongoose')

const Schema = mongoose.Schema

const linksSchema = new Schema({
  linkdIn: {
    type: String,
    required: false
  },
  gitHub: {
    type: String,
    required: false
  },
  twitter: {
    type: String,
    required: false
  },
  instagram: {
    type: String,
    required: false
  }
})

const userSchema = new Schema({
  profile_img: {
    type: String,
    default: 'https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg'
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  user_verified: {
    type: Boolean,
    required: true,
    default: false
  },
  links: {
    type: linksSchema,
    required: false,
    default: {}
  },
  otp: {
    type: Number,
    required: true
  }
})

module.exports = mongoose.model('User', userSchema)
