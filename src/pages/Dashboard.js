import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // to handle page redirects

function Dashboard() {
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [todayCustomers, setTodayCustomers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalEmployeeExpense, setTotalEmployeeExpense] = useState(0);

  const navigate = useNavigate(); // to navigate on click

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const customersRes = await axios.get(
        "https://server-al-ansari.onrender.com/api/customers"
      );
      const ordersRes = await axios.get("https://server-al-ansari.onrender.com/api/orders");
      const employeesRes = await axios.get(
        "https://server-al-ansari.onrender.com/api/employees"
      );

      const today = new Date().toISOString().slice(0, 10);

      const todayCustomersCount = customersRes.data.filter((c) => {
        if (!c.createdAt) return false;
        const date = new Date(c.createdAt);
        if (isNaN(date.getTime())) return false;
        return date.toISOString().slice(0, 10) === today;
      }).length;

      const todayOrdersCount = ordersRes.data.filter((o) => {
        if (!o.orderDate) return false;
        const date = new Date(o.orderDate);
        if (isNaN(date.getTime())) return false;
        return date.toISOString().slice(0, 10) === today;
      }).length;

      const allExpenses = employeesRes.data.flatMap(
        (emp) => emp.expenses || []
      );
      const totalExpenseAmount = allExpenses.reduce(
        (sum, ex) => sum + (ex.amount || 0),
        0
      );

      setTotalCustomers(customersRes.data.length);
      setTodayCustomers(todayCustomersCount);
      setTotalOrders(ordersRes.data.length);
      setTodayOrders(todayOrdersCount);
      setTotalEmployees(employeesRes.data.length);
      setTotalEmployeeExpense(totalExpenseAmount);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontSize: "32px",
          color: "#2c3e50",
        }}
      >
        انتظامی صفحہ
      </h2>

      <div className="dashboard-grid" style={gridStyle}>
        <div style={cardStyle} onClick={() => navigate("/customers")}>
          <h3>کل گاہک</h3>
          <p>{totalCustomers}</p>
        </div>
        <div style={cardStyle} onClick={() => navigate("/customers")}>
          <h3>آج کے گاہک</h3>
          <p>{todayCustomers}</p>
        </div>
        <div style={cardStyle} onClick={() => navigate("/orders")}>
          <h3>کل آرڈرز</h3>
          <p>{totalOrders}</p>
        </div>
        <div style={cardStyle} onClick={() => navigate("/orders")}>
          <h3>آج کے آرڈرز</h3>
          <p>{todayOrders}</p>
        </div>
        <div style={cardStyle} onClick={() => navigate("/employees")}>
          <h3>کل ملازمین</h3>
          <p>{totalEmployees}</p>
        </div>
        <div style={cardStyle} onClick={() => navigate("/employees")}>
          <h3>ملازمین کے اخراجات</h3>
          <p>{totalEmployeeExpense} : روپے</p>
        </div>
      </div>
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gap: "20px",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  marginTop: "20px",
};

const cardStyle = {
  background: "linear-gradient(135deg, #800000 0%, #a93226 100%)", // ✨ Decent Maroon gradient
  borderRadius: "12px",
  padding: "25px 15px",
  textAlign: "center",
  fontWeight: "bold",
  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
  transition: "0.3s",
  cursor: "pointer",
  color: "#f8f9fa", // Light text for dark background
};

export default Dashboard;
