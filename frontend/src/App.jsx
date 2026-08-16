import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import SwipePages from './components/SwipePages';
import Home from './pages/Home';
import Rides from './pages/Rides';
import CreateRide from './pages/CreateRide';
import ManageRide from './pages/ManageRide';
import MyRides from './pages/MyRides';
import MyBookings from './pages/MyBookings';

// Scroll to top on every navigation. Rendered last so that SwipePages (inside
// <main>) can read the outgoing scroll position before it is reset.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// The route table. `location` comes from SwipePages, which renders two screens
// at once while they slide past each other (see components/SwipePages.jsx).
function AppRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/rides" element={<Rides />} />
      <Route path="/create" element={<CreateRide />} />
      <Route path="/my-rides" element={<MyRides />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/manage/:id" element={<ManageRide />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Module-level so its identity never changes — SwipePages memoises each screen
// on this function plus its location.
const renderRoutes = (location) => <AppRoutes location={location} />;

export default function App() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar />
      <main className="flex-1">
        <SwipePages render={renderRoutes} />
      </main>
      <Footer />
      <MobileBottomNav />
      <ScrollToTop />
    </div>
  );
}
