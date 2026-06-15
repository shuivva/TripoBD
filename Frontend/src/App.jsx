import { BrowserRouter, Routes, Route } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import TravelerNavigation from './components/TravelerNavigation'
import { useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import Home from './pages/Home'
import Discover from './pages/Discover'
import DestinationDetail from './pages/DestinationDetail'
import FeaturedDestinations from './pages/FeaturedDestinations'
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
import GroupDetail from './pages/GroupDetail'
import TourGuides from './pages/TourGuides'
import TourGuideDetail from './pages/TourGuideDetail'
import BoatCharterDetail from './pages/BoatCharterDetail'
import VehicleRentalDetail from './pages/VehicleRentalDetail'
import MyBookings from './pages/MyBookings'
import BoatCharters from './pages/BoatCharters'
import VehicleRentals from './pages/VehicleRentals'
import LocalServices from './pages/LocalServices'
import NotFound from './pages/NotFound'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* choose nav based on current location */}
      <NavSelector />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/featured-destinations" element={<FeaturedDestinations />} />
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
        <Route path="/traveler/community/groups/:groupId" element={<GroupDetail />} />
        <Route path="/traveler/local-services" element={<LocalServices />} />
        <Route path="/traveler/tour-guides/:guideId" element={<TourGuideDetail />} />
        <Route path="/traveler/boat-charters/:charterId" element={<BoatCharterDetail />} />
        <Route path="/traveler/vehicle-rentals/:rentalId" element={<VehicleRentalDetail />} />
        <Route path="/traveler/bookings" element={<MyBookings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

function NavSelector() {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    setIsAuthenticated(!!userId)
  }, [])

  // Show TravelerNavigation if authenticated or if on traveler pages
  if (isAuthenticated || location.pathname.startsWith('/traveler')) {
    return <TravelerNavigation />
  }
  return <Navigation />
}

export default App
