import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/PrintOrder.css";
import { API_ENDPOINTS, api } from "../config/api";

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
      const res = await api.get(`${API_ENDPOINTS.ORDERS}/${id}`);
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

  const customerName = order.customer?.name || order.customerName || "—";
  const customerPhone = order.customer?.phone || order.customerPhone || "—";
  const customerSerial = order.customer?.serialNumber || order.customerSerial || "—";

  return (
    <div className="print-container" dir="rtl" style={{ textAlign: "right" }}>
      <div className="print-header bordered">
        <img src={logo} alt="Logo" className="print-logo" />
        <div className="shop-details">
          <h1>ال-انصاری درزی</h1>
          <p><strong>مالک:</strong> عرفان انصاری</p>
          <p><strong>فون:</strong> 0301-8019530</p>
          <p><strong>پتہ:</strong> امان پلازہ، بلاک ایچ 3، فیز 2، جوہر ٹاؤن، لاہور</p>
        </div>
      </div>

      <div className="meta bordered">
        <div className="meta-row">
          <div><strong>سیریل نمبر:</strong> {customerSerial}</div>
          <div><strong>تاریخ:</strong> {new Date(order.orderDate).toLocaleDateString('ur-PK')}</div>
        </div>
        <div className="meta-row">
          <div><strong>نام:</strong> {customerName}</div>
          <div><strong>فون:</strong> {customerPhone}</div>
        </div>
      </div>

      {order.suitDetails.map((suit, i) => {
        const shalwar =
          suit.items.find(it => it.itemName?.includes('شلوار')) ||
          suit.items.find(it => it.itemName?.toLowerCase?.().includes('shalwar'));
        const kameez =
          suit.items.find(it => it.itemName?.includes('قمیض')) ||
          suit.items.find(it => it.itemName?.toLowerCase?.().includes('kameez'));
        
        // Helper function to get size type from suitType
        const getSizeType = (itemName, sizeName) => {
          if (!suit.suitType?.items) return null;
          const suitTypeItem = suit.suitType.items.find(it => 
            it.name === itemName || 
            (itemName?.includes('قمیض') && it.name?.includes('قمیض')) ||
            (itemName?.includes('شلوار') && it.name?.includes('شلوار'))
          );
          if (!suitTypeItem) return null;
          const suitTypeSize = suitTypeItem.sizes?.find(s => s.name === sizeName);
          return suitTypeSize?.type || null;
        };

        // Helper function to render size value
        const renderSizeValue = (sz, itemName) => {
          const sizeType = getSizeType(itemName, sz.name);
          if (sizeType === 'checkbox') {
            // For checkbox, show tick or cross in the value area
            const isChecked = sz.value === true || sz.value === 'true';
            return (
              <div key={sz.name} className="size-row">
                <span className="size-name">{sz.name}</span>
                <span className="size-dots"></span>
                <span className="size-value">{isChecked ? '✓' : '✗'}</span>
              </div>
            );
          } else {
            // For other types, show value as before
            return (
              <div key={sz.name} className="size-row">
                <span className="size-name">{sz.name}</span>
                <span className="size-dots"></span>
                <span className="size-value">{sz.value || "—"}</span>
              </div>
            );
          }
        };

        return (
          <div key={i} className="suit-card bordered">
            <div className="suit-title">{suit.suitType?.name || "سوٹ"}</div>
            <div className="two-col">
              <div className="col">
                <div className="item-name">{kameez?.itemName || 'قمیض'}</div>
                <div className="sizes-grid">
                  {(kameez?.sizes || []).map((sz, k) => renderSizeValue(sz, kameez?.itemName))}
                </div>
              </div>
              <div className="col">
                <div className="item-name">{shalwar?.itemName || 'شلوار'}</div>
                <div className="sizes-grid">
                  {(shalwar?.sizes || []).map((sz, k) => renderSizeValue(sz, shalwar?.itemName))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PrintOrder;
