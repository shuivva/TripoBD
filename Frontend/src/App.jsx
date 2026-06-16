import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import TravelerNavigation from './components/TravelerNavigation'
import GuideNavigation from './components/GuideNavigation'
import AdminNavigation from './components/AdminNavigation'
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
import AIAssistant from './pages/AIAssistant'
import LocalBookings from './pages/LocalBookings'
import NotificationsCentre from './pages/NotificationsCentre'
import ReviewsAndStories from './pages/ReviewsAndStories'
import AllStories from './pages/AllStories'
import NotFound from './pages/NotFound'

// Guide portal pages
import GuideDashboard from './pages/GuideDashboard'
import GuideProfile from './pages/GuideProfile'
import GuideBookings from './pages/GuideBookings'
import GuideEarnings from './pages/GuideEarnings'
import GuideSettings from './pages/GuideSettings'

// Admin portal pages
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminGuides from './pages/AdminGuides'
import AdminDestinations from './pages/AdminDestinations'
import AdminModeration from './pages/AdminModeration'
import AdminGroups from './pages/AdminGroups'
import AdminSupport from './pages/AdminSupport'
import AdminNotifications from './pages/AdminNotifications'
import AdminReports from './pages/AdminReports'
import AdminConfig from './pages/AdminConfig'
import AdminLogs from './pages/AdminLogs'
import AdminProfile from './pages/AdminProfile'

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
        
        {/* Traveler routes */}
        <Route path="/traveler/dashboard" element={<TravelerDashboard />} />
        <Route path="/traveler/profile" element={<TravelerProfile />} />
        <Route path="/traveler/room" element={<TravelerRoom />} />
        <Route path="/traveler/community" element={<TravelerCommunity />} />
        <Route path="/traveler/community/groups/:groupId" element={<GroupDetail />} />
        <Route path="/traveler/ai" element={<AIAssistant />} />
        <Route path="/traveler/bookings" element={<LocalBookings />} />
        <Route path="/traveler/notifications" element={<NotificationsCentre />} />
        <Route path="/traveler/reviews-stories" element={<ReviewsAndStories />} />
        <Route path="/traveler/stories" element={<AllStories />} />

        {/* Guide portal routes */}
        <Route path="/guide/dashboard" element={<GuideDashboard />} />
        <Route path="/guide/profile" element={<GuideProfile />} />
        <Route path="/guide/bookings" element={<GuideBookings />} />
        <Route path="/guide/earnings" element={<GuideEarnings />} />
        <Route path="/guide/settings" element={<GuideSettings />} />

        {/* Admin portal routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/guides" element={<AdminGuides />} />
        <Route path="/admin/destinations" element={<AdminDestinations />} />
        <Route path="/admin/moderation" element={<AdminModeration />} />
        <Route path="/admin/groups" element={<AdminGroups />} />
        <Route path="/admin/support" element={<AdminSupport />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/config" element={<AdminConfig />} />
        <Route path="/admin/logs" element={<AdminLogs />} />
        <Route path="/admin/profile" element={<AdminProfile />} />

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
  if (location.pathname.startsWith('/guide')) {
    return <GuideNavigation />
  }
  if (location.pathname.startsWith('/admin')) {
    return <AdminNavigation />
  }
  return <Navigation />
}

export default App
