const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
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
  userVerified: {
    type: Boolean,
    required: true,
    default: false
  },
  adminApprouved: {
    type: Boolean,
    require: true,
    default: false
  }
})

module.exports = mongoose.model('Instructor', userSchema)
