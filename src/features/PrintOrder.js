import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import "../styles/PrintOrder.css";
import { API_ENDPOINTS } from "../config/api";

function PrintOrder() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_ENDPOINTS.ORDERS}/${id}`);
      setOrder(res.data);
      setTimeout(() => {
        window.print();
      }, 1000);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(err.response?.data?.message || "آرڈر لوڈ کرنے میں مسئلہ ہوا ہے");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ padding: "20px", color: "red" }}>{error}</div>;
  if (!order) return <div>آرڈر نہیں ملا</div>;

  return (
    <div className="print-container" dir="rtl" style={{ textAlign: "right" }}>
      <div className="print-header">
        <img src={logo} alt="Logo" className="print-logo" />
        <div className="shop-details">
          <h1>ال-انصاری درزی</h1>
          <p><strong>مالک:</strong> عرفان انصاری</p>
          <p><strong>فون:</strong> 0301-8019530</p>
          <p><strong>پتہ:</strong> امان پلازہ، بلاک ایچ 3، فیز 2، جوہر ٹاؤن، لاہور</p>
        </div>
      </div>

      <hr />

      <div className="print-section">
        <p><strong>گاہک:</strong> {order.customer?.name || order.customerName || "N/A"}</p>
        <p><strong>فون:</strong> {order.customer?.phone || order.customerPhone || "N/A"}</p>
        <p><strong>تاریخ:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
      </div>

      <div className="print-section">
        <h2>آرڈر کی تفصیلات</h2>
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
        <p><strong>کل آئٹمز:</strong> {order.suitDetails.reduce((total, s) => total + s.items.length, 0)}</p>
        {order.assignedEmployee && (
          <p><strong>تفویض شدہ درزی:</strong> {order.assignedEmployee.name}</p>
        )}
      </div>

      <div className="print-signature">
        <div className="signature-box">
          <p>گاہک کا دستخط</p>
        </div>
        <div className="signature-box">
          <p>درزی / مہر</p>
        </div>
      </div>

      <div className="print-footer">
        <p>ال-انصاری درزیوں کا انتخاب کرنے کے لیے شکریہ!</p>
      </div>
    </div>
  );
}

export default PrintOrder;
