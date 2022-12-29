require('dotenv').config()
const nodemailer = require('nodemailer')

const sendEmail = async (email, subjectSend, textSend) => {
  try {
    console.log(process.env.USER_EMAIL)
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: 587,
      secure: true,
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.PASS
      }
    })

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subjectSend,
      text: textSend
    })
    console.log('email sent successfully')
  } catch (error) {
    console.log('email not sent')
    console.log(error)
  }
}

module.exports = sendEmail
