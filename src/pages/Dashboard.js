import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, api } from "../config/api";

function Dashboard() {
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [todayCustomers, setTodayCustomers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalEmployeeExpense, setTotalEmployeeExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "صبح بخیر";
    if (hour < 17) return "دوپہر بخیر";
    if (hour < 20) return "شام بخیر";
    return "رات بخیر";
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [customersRes, ordersRes, employeesRes] = await Promise.all([
        api.get(API_ENDPOINTS.CUSTOMERS).catch(err => {
          console.error("Error fetching customers:", err);
          return { data: [] };
        }),
        api.get(API_ENDPOINTS.ORDERS).catch(err => {
          console.error("Error fetching orders:", err);
          return { data: [] };
        }),
        api.get(API_ENDPOINTS.EMPLOYEES).catch(err => {
          console.error("Error fetching employees:", err);
          return { data: [] };
        })
      ]);

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
      setError("ڈیش بورڈ ڈیٹا لوڈ کرنے میں مسئلہ ہوا ہے");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>لوڈ ہو رہا ہے...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
        <p>{error}</p>
        <button onClick={fetchDashboardData} style={{ marginTop: "10px", padding: "8px 16px" }}>
          دوبارہ کوشش کریں
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", direction: "rtl", textAlign: "right" }}>
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
          padding: "35px 25px",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e0e0e0",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: "700",
            color: "#000000",
            margin: "0 0 12px 0",
            direction: "rtl",
            letterSpacing: "1px",
            lineHeight: "1.5",
          }}
        >
          السلام علیکم عرفان صاحب
        </h1>
        <p
          style={{
            fontSize: "clamp(20px, 3vw, 26px)",
            fontWeight: "600",
            color: "#333333",
            margin: "0 0 12px 0",
            direction: "rtl",
          }}
        >
          {getTimeBasedGreeting()}
        </p>
        <p
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            fontWeight: "400",
            color: "#666666",
            margin: 0,
            direction: "rtl",
          }}
        >
          خوش آمدید! آپ کے کاروبار کا خلاصہ
        </p>
      </div>
      
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontSize: "28px",
          color: "#2c3e50",
          direction: "rtl",
        }}
      >
        انتظامی صفحہ
      </h2>

      <div className="dashboard-grid" style={gridStyle}>
        <div style={cardStyle} onClick={() => navigate("/customers")}>
          <h3 style={{ color: "#ffffff", margin: "0 0 10px 0" }}>کل گاہک</h3>
          <p style={{ color: "#ffffff", margin: 0, fontSize: "24px" }}>{totalCustomers}</p>
        </div>
        <div style={cardStyle} onClick={() => navigate("/customers")}>
          <h3 style={{ color: "#ffffff", margin: "0 0 10px 0" }}>آج کے گاہک</h3>
          <p style={{ color: "#ffffff", margin: 0, fontSize: "24px" }}>{todayCustomers}</p>
        </div>
        <div style={cardStyle} onClick={() => navigate("/orders")}>
          <h3 style={{ color: "#ffffff", margin: "0 0 10px 0" }}>کل آرڈرز</h3>
          <p style={{ color: "#ffffff", margin: 0, fontSize: "24px" }}>{totalOrders}</p>
        </div>
        <div style={cardStyle} onClick={() => navigate("/orders")}>
          <h3 style={{ color: "#ffffff", margin: "0 0 10px 0" }}>آج کے آرڈرز</h3>
          <p style={{ color: "#ffffff", margin: 0, fontSize: "24px" }}>{todayOrders}</p>
        </div>
        <div style={cardStyle} onClick={() => navigate("/employees")}>
          <h3 style={{ color: "#ffffff", margin: "0 0 10px 0" }}>کل ملازمین</h3>
          <p style={{ color: "#ffffff", margin: 0, fontSize: "24px" }}>{totalEmployees}</p>
        </div>
        <div style={cardStyle} onClick={() => navigate("/employees")}>
          <h3 style={{ color: "#ffffff", margin: "0 0 10px 0" }}>ملازمین کے اخراجات</h3>
          <p style={{ color: "#ffffff", margin: 0, fontSize: "24px" }}>{totalEmployeeExpense} : روپے</p>
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
  direction: "rtl",
};

// Responsive grid styles
const getGridStyle = () => {
  const isMobile = window.innerWidth <= 768;
  return {
    ...gridStyle,
    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: isMobile ? "15px" : "20px",
  };
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
  color: "#ffffff", // White text for dark background
};

export default Dashboard;
