import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();

  return (
    <div className="navbar" dir="rtl" style={{ textAlign: "right" }}>
      <div className="navbar-left" style={{ marginLeft: "auto" }}>
        <img src={logo} alt="لوگو" />
      </div>
      <div className="navbar-right" style={{ display: "flex", gap: "20px", marginRight: "20px" }}>
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
      </div>
    </div>
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
