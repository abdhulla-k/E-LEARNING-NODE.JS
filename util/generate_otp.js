// function to generate otp
const generateOtp = async () => {
  // stores all digits
  const digits = '0123456789'
  let OTP = ''
  for (let i = 0; i <= 3; i++) {
    OTP += digits[Math.floor(Math.random() * 10)]
  }
  return OTP
}

module.exports = generateOtp
