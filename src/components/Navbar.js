import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";
import logo from "../assets/logo.png";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutModal(false);
  };

  return (
    <>
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="لاگ آؤٹ"
        message="کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟"
        confirmText="لاگ آؤٹ"
        cancelText="منسوخ کریں"
      />
      <nav className="navbar" dir="rtl">
        <div className="navbar-container">
        <div className="navbar-brand">
          <img src={logo} alt="لوگو" className="navbar-logo" />
          <span className="brand-text">ٹیلر شاپ مینجمنٹ</span>
        </div>
        
        <div className="navbar-menu">
          <NavLink to="/" label="🏠︎ ہوم" current={location.pathname === "/"} />
          <NavLink
            to="/suit-types"
            label="سوٹ کی اقسام"
            current={location.pathname.includes("/suit-types")}
          />
          <NavLink
            to="/customers"
            label="گاہک"
            current={location.pathname.includes("/customers")}
          />
          <NavLink
            to="/employees"
            label="ملازمین"
            current={location.pathname.includes("/employees")}
          />
          <NavLink
            to="/orders"
            label="آرڈرز"
            current={location.pathname.includes("/orders")}
          />
          <button
            onClick={handleLogout}
            className="nav-link logout-btn"
            title="لاگ آؤٹ"
          >
            <svg 
              className="logout-icon"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </nav>
    </>
  );
}

function NavLink({ to, label, current }) {
  return (
    <Link to={to} className={`nav-link ${current ? "active" : ""}`}>
      {label}
    </Link>
  );
}

export default Navbar;
