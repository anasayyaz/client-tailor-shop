import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SuitTypes from "./features/SuitTypes";
import Customers from "./features/Customers";
import Employees from "./features/Employees";
import Orders from "./features/Orders";
import "./App.css";
import PrintOrder from "./features/PrintOrder";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="main-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/suit-types" element={<SuitTypes />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/print/:id" element={<PrintOrder />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
