import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import SuitTypes from "./features/SuitTypes";
import Customers from "./features/Customers";
import Employees from "./features/Employees";
import Orders from "./features/Orders";
import "./App.css";
import PrintOrder from "./features/PrintOrder";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { syncService } from "./utils/syncService";
import { dataInitializer } from "./utils/dataInitializer";

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="main-container">
                <Dashboard />
              </div>
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/suit-types"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="main-container">
                <SuitTypes />
              </div>
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="main-container">
                <Customers />
              </div>
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="main-container">
                <Employees />
              </div>
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="main-container">
                <Orders />
              </div>
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/print/:id"
        element={
          <ProtectedRoute>
            <PrintOrder />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize data from server or cache
        const success = await dataInitializer.initialize();
        
        if (!success) {
          setInitError(true);
        }
        
        // Initialize sync service
        syncService.init();
      } catch (error) {
        console.error('App initialization error:', error);
        setInitError(true);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
    
    // Cleanup on unmount
    return () => {
      syncService.destroy();
    };
  }, []);

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #800000 0%, #a93226 100%)',
        color: 'white',
        direction: 'rtl',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px',
          animation: 'spin 2s linear infinite'
        }}>
          ⚙️
        </div>
        <h2 style={{ margin: '10px 0', fontSize: '24px' }}>ٹیلر شاپ مینجمنٹ</h2>
        <p style={{ margin: '10px 0', fontSize: '16px', opacity: 0.9 }}>
          ڈیٹا لوڈ ہو رہا ہے...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #800000 0%, #a93226 100%)',
        color: 'white',
        direction: 'rtl',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{ margin: '10px 0', fontSize: '24px' }}>سرور سے رابطہ نہیں ہو سکا</h2>
        <p style={{ margin: '10px 0', fontSize: '16px', opacity: 0.9, maxWidth: '500px' }}>
          سرور تک رسائی نہیں ہو سکی اور کوئی محفوظ شدہ ڈیٹا دستیاب نہیں ہے۔
          براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں۔
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '12px 30px',
            fontSize: '16px',
            background: 'white',
            color: '#800000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          دوبارہ کوشش کریں
        </button>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <ToastContainer
          position="top-left"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={true}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
