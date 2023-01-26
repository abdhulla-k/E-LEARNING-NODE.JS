const mongoose = require('mongoose')

const Schema = mongoose.Schema

const wishlistSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }]
})

module.exports = mongoose.model('Wishlist', wishlistSchema)
