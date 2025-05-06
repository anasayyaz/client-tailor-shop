import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import "../styles/PrintOrder.css";

function PrintOrder() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    const res = await axios.get(`https://server-al-ansari.onrender.com/api/orders`);
    const found = res.data.find((o) => o._id === id);
    setOrder(found);
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  if (!order) return <div>Loading...</div>;

  return (
    <div className="print-container">
      <div className="print-header">
        <img src={logo} alt="Logo" className="print-logo" />
        <div className="shop-details">
          <h1>AL-ANSARI TAILORS</h1>
          <p><strong>Owner:</strong> Irfan Ansari</p>
          <p><strong>Phone:</strong> 0301-8019530</p>
          <p><strong>Address:</strong> Aman Plaza, Block H3, Phase 2, Johar Town, Lahore</p>
        </div>
      </div>

      <hr />

      <div className="print-section">
        <p><strong>Customer:</strong> {order.customer?.name}</p>
        <p><strong>Phone:</strong> {order.customer?.phone}</p>
        <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
      </div>

      <div className="print-section">
        <h2>Order Details</h2>
        {order.suitDetails.map((suit, i) => (
          <div key={i} className="suit-block">
            <h3>{suit.suitType?.name || "Suit"}</h3>
            {suit.items.map((item, j) => (
              <div key={j}>
                <b>{item.itemName}</b>: {item.sizes.map(sz => `${sz.name}: ${sz.value}`).join(", ")}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="print-section">
        <p><strong>Total Items:</strong> {order.suitDetails.reduce((total, s) => total + s.items.length, 0)}</p>
        {order.assignedEmployee && (
          <p><strong>Assigned Tailor:</strong> {order.assignedEmployee.name}</p>
        )}
      </div>

      <div className="print-signature">
        <div className="signature-box">
          <p>Customer Signature</p>
        </div>
        <div className="signature-box">
          <p>Tailor / Stamp</p>
        </div>
      </div>

      <div className="print-footer">
        <p>Thank you for choosing Al-Ansari Tailors!</p>
      </div>
    </div>
  );
}

export default PrintOrder;
