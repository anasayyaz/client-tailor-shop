import React from "react";
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
