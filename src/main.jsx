import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import BASE_URL from './baseURL'

axios.defaults.baseURL = BASE_URL
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import UserContext from './context/userContext'
import CaptainContext from './context/CaptainContext'
import SocketProvider from './context/SocketContext'
import { ThemeProvider } from './context/themeContext'
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    
    {/* ✅ SABSE UPAR */}
    <ThemeProvider>
      <SocketProvider>

        <CaptainContext>
          <UserContext>

            <BrowserRouter>
              <App />
            </BrowserRouter>

          </UserContext>
        </CaptainContext>

      </SocketProvider>
    </ThemeProvider>

  </StrictMode>
)