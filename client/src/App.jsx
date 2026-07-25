import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StockIn from './pages/StockIn';
import Products from './pages/Products';
import Sales from './pages/Sales';
import SalesHistory from './pages/SalesHistory';
import Categories from './pages/Categories';
import Activation from './pages/Activation';
import logo from './assets/logo.png';
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="stock-in" element={<StockIn />} />
        <Route path="products" element={<Products />} />
        <Route path="sales" element={<Sales />} />
        <Route path="sales-history" element={<SalesHistory />} />
        <Route path="categories" element={<Categories />} />
      </Route>
    </Routes>
  );
};

function App() {
  const [isActivated, setIsActivated] = useState(null);

  useEffect(() => {
    checkActivation();
  }, []);

  const checkActivation = async () => {
    try {
      const res = await fetch('/api/activation/status');
      const data = await res.json();
      setIsActivated(data.isActivated);
    } catch (error) {
      console.error('Failed to check activation status');
      setIsActivated(false);
    }
  };

  if (isActivated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <img src={logo} alt="Loading..." className="h-16 w-auto animate-pulse drop-shadow-md" />
      </div>
    );
  }

  if (!isActivated) {
    return (
      <>
        <Toaster position="top-right" />
        <Activation onActivate={() => setIsActivated(true)} />
      </>
    );
  }

  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
