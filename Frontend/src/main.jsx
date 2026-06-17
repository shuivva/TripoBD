import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply saved theme on app load
const applySavedTheme = () => {
  const savedTheme = localStorage.getItem('appTheme') || 'light'
  const savedFontSize = localStorage.getItem('appFontSize') || 'medium'
  const savedLanguage = localStorage.getItem('appLanguage') || 'en'
  
  if (savedTheme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    document.documentElement.setAttribute('data-theme', savedTheme)
  }
  
  document.documentElement.setAttribute('data-font-size', savedFontSize)
  document.documentElement.setAttribute('data-language', savedLanguage)
  
  console.log('Initial theme applied:', savedTheme, 'data-theme:', document.documentElement.getAttribute('data-theme'))
  console.log('Initial language applied:', savedLanguage, 'data-language:', document.documentElement.getAttribute('data-language'))
}

applySavedTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
