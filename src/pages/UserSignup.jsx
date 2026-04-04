import React from 'react'
import { Navigate } from 'react-router-dom'

// User signup backend mein OTP-based hai (/users/send-otp → /users/verify-otp)
// Alag register route exist nahi karta, isliye login page pe redirect karo
const UserSignup = () => {
  return <Navigate to='/login' replace />
}

export default UserSignup