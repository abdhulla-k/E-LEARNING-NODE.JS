const mongoose = require('mongoose')
const Schema = mongoose.Schema

const courseSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    require: true
  },
  imgPath: {
    type: String,
    required: true
  },
  imgName: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Courses', courseSchema)
