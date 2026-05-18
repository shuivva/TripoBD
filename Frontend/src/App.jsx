import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import Home from './pages/Home'
import Discover from './pages/Discover'
import DestinationDetail from './pages/DestinationDetail'
import RoutesPage from './pages/Routes'
import About from './pages/About'
import FAQ from './pages/FAQ'
import TravelerRegistration from './pages/TravelerRegistration'
import ServiceProviderRegistration from './pages/ServiceProviderRegistration'
import TravelerDashboard from './pages/TravelerDashboard'
import SignIn from './pages/SignIn'
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
        <Route path="/faq" element={<FAQ />} />
        <Route path="/register/traveler" element={<TravelerRegistration />} />
        <Route path="/register/service-provider" element={<ServiceProviderRegistration />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/traveler/dashboard" element={<TravelerDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
