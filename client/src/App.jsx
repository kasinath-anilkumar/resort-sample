import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from './components/Footer';
import Header from './components/Header';
import About from './pages/About';
import BookingCancel from './pages/BookingCancel';
import BookingSuccess from './pages/BookingSuccess';

import Contact from './pages/Contact';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RoomDetails from './pages/RoomDetails';
import Rooms from './pages/Rooms';
import UserDashboard from './pages/UserDashboard';
import Packages from './pages/Packages';

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  const hideLayoutRoutes = [
    '/login',
    '/register',
    '/dashboard',
  ];

  const hideLayout = hideLayoutRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-water-light text-charcoal">
      {!hideLayout && <Header />}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
      />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/booking/success/:id" element={<BookingSuccess />} />
          <Route path="/booking/cancel/:id" element={<BookingCancel />} />
        </Routes>
      </main>

      {!hideLayout && <Footer />}
    </div>
  );
}

export default App;