const mongoose = require('mongoose')
const Schema = mongoose.Schema

const moduleSchema = new Schema({
  videoTitle: {
    type: String,
    required: true,
    default: 'Untitled Video'
  },
  videoPath: {
    type: String,
    required: true
  },
  notePath: {
    type: String,
    required: true
  },
  questionPath: {
    type: String,
    required: true
  }
})

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
  },
  price: {
    type: Number,
    required: true
  },
  ratedUsers: {
    type: Number,
    required: true,
    default: 0
  },
  totalStar: {
    type: Number,
    required: true,
    default: 0
  },
  rating: {
    type: Number,
    required: true,
    default: 0
  },
  category: {
    type: String,
    default: 'untitled',
    required: true
  },
  teacher: {
    type: String,
    required: true
  },
  modules: [moduleSchema]
})

module.exports = mongoose.model('Courses', courseSchema)
