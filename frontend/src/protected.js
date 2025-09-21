import { Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/navFooter/Navbar/Navbar';
import Footer from './components/navFooter/Footer/Footer';

const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem('token');
  
  return isAuthenticated ? (
    <div style={{width: '100%'}}>
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;