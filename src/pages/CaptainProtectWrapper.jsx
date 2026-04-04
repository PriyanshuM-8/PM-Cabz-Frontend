import { useContext, useEffect, useRef, useState } from 'react'
import { CaptainDataContext } from '../context/CaptainContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const CaptainProtectWrapper = ({ children }) => {
  const navigate = useNavigate()
  const { setCaptain } = useContext(CaptainDataContext)
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false) // prevent double fetch in StrictMode

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const token = localStorage.getItem('captain-token')

    if (!token) {
      navigate('/captain-login')
      return
    }

    axios
      .get(`${import.meta.env.VITE_BASE_URL}/captains/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCaptain(res.data.captain)
        setIsLoading(false)
      })
      .catch(() => {
        localStorage.removeItem('captain-token')
        navigate('/captain-login')
      })
  }, []) // empty deps — sirf mount pe run karo

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-900/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-amber-400 rounded-full animate-spin"></div>
          <p className="text-white text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default CaptainProtectWrapper
