const mongoose = require('mongoose')

const Schema = mongoose.Schema

const courseSchema = new Schema({
  courseId: {
    type: mongoose.Types.ObjectId,
    required: true
  }
})

const cartSchema = new Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  courses: [courseSchema]
})

module.exports = mongoose.model('Cart', cartSchema)
