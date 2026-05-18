import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import TravelerNavigation from './components/TravelerNavigation'
import { useLocation } from 'react-router-dom'
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
import TravelerProfile from './pages/TravelerProfile'
import TravelerRoom from './pages/TravelerRoom'
import TravelerCommunity from './pages/TravelerCommunity'
import NotFound from './pages/NotFound'

function App() {
  return (
    <BrowserRouter>
      {/* choose nav based on current location */}
      <NavSelector />
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
        <Route path="/traveler/profile" element={<TravelerProfile />} />
        <Route path="/traveler/room" element={<TravelerRoom />} />
        <Route path="/traveler/community" element={<TravelerCommunity />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

function NavSelector() {
  const location = useLocation()
  if (location.pathname.startsWith('/traveler')) {
    return <TravelerNavigation />
  }
  return <Navigation />
}

export default App
