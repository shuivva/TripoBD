import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import Home from './pages/Home'
import Discover from './pages/Discover'
import DestinationDetail from './pages/DestinationDetail'
import RoutesPage from './pages/Routes'
import About from './pages/About'
import NotFound from './pages/NotFound'

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/destination/:slug" element={<DestinationDetail />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
