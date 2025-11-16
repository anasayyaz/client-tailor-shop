import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ValidatedInput from "../components/ValidatedInput";
import ConfirmModal from "../components/ConfirmModal";
import { validateForm, validateField, validationOptions } from "../utils/validation";
import { API_ENDPOINTS } from "../config/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [suitTypes, setSuitTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [formErrors, setFormErrors] = useState({});

  const [form, setForm] = useState({
    customerPhone: "",
    customerId: "",
    customerName: "",
    suitDetails: [],
    assignedEmployee: "",
    notes: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const typingTimeout = useRef(null);
  const searchAbortController = useRef(null);

  useEffect(() => {
    fetchOrders();
    fetchSuitTypes();
    fetchEmployees();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_ENDPOINTS.ORDERS);
      setOrders(res.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuitTypes = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.SUIT_TYPES);
      setSuitTypes(res.data || []);
    } catch (err) {
      console.error("Error fetching suit types:", err);
      setSuitTypes([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.EMPLOYEES);
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    }
  };

  const handlePhoneChange = (e) => {
    const { value } = e.target;
    setForm({
      ...form,
      customerPhone: value,
      customerId: "",
      customerName: "",
      suitDetails: [],
    });
    setHighlightIndex(-1);
    
    // Clear error when user starts typing
    if (formErrors.customerPhone) {
      setFormErrors(prev => ({ ...prev, customerPhone: "" }));
    }

    // Cancel previous timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Cancel previous search request
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }

    if (value.length >= 1) {
      typingTimeout.current = setTimeout(async () => {
        // Create new AbortController for this search
        searchAbortController.current = new AbortController();
        setSearchLoading(true);
        try {
          const res = await axios.get(API_ENDPOINTS.CUSTOMERS, {
            signal: searchAbortController.current.signal
          });
          const allCustomers = res.data;
          const matches = allCustomers.filter((c) => 
            c.phone && c.phone.startsWith(value)
          );
          setSearchResults(matches);
        } catch (err) {
          // Ignore abort errors
          if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
            console.error("Error searching customers:", err);
            setSearchResults([]);
          }
        } finally {
          setSearchLoading(false);
        }
      }, 400);
    } else {
      setSearchResults([]);
      setSearchLoading(false);
    }
  };

  const selectCustomer = (customer) => {
    setForm({
      ...form,
      customerPhone: customer.phone,
      customerId: customer._id,
      customerName: customer.name,
      suitDetails: customer.suits.map((suit) => ({
        suitType:
          typeof suit.suitType === "object" ? suit.suitType._id : suit.suitType,
        items: suit.items.map((item) => ({
          itemName: item.itemName,
          sizes: item.sizes.map((size) => ({
            name: size.name,
            value: size.value,
          })),
        })),
      })),
    });
    setSearchResults([]);
    setHighlightIndex(-1);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateOrderForm = () => {
    const errors = {};
    let isValid = true;

    // Validate customer phone
    if (!form.customerPhone) {
      errors.customerPhone = "گاہک کا موبائل نمبر درج کرنا ضروری ہے";
      isValid = false;
    } else {
      const phoneValidation = validateField(form.customerPhone, 'phone', validationOptions.phone);
      if (!phoneValidation.isValid) {
        errors.customerPhone = phoneValidation.message;
        isValid = false;
      }
    }

    // Validate customer selection
    if (!form.customerId) {
      errors.customerId = "براہ کرم گاہک منتخب کریں";
      isValid = false;
    }

    // Employee selection is optional

    // Validate notes (optional)
    if (form.notes) {
      const notesValidation = validateField(form.notes, 'notes', validationOptions.notes);
      if (!notesValidation.isValid) {
        errors.notes = notesValidation.message;
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateOrderForm()) {
      return;
    }

    try {
      setLoading(true);
      const isEditing = !!editingId;
      const orderData = {
        ...form,
        orderDate: new Date().toISOString(),
      };

      if (editingId) {
        await axios.put(`${API_ENDPOINTS.ORDERS}/${editingId}`, orderData);
        setEditingId(null);
      } else {
        await axios.post(API_ENDPOINTS.ORDERS, orderData);
      }

      setForm({
        customerPhone: "",
        customerId: "",
        customerName: "",
        suitDetails: [],
        assignedEmployee: "",
        notes: "",
      });
      setFormErrors({});
      setSearchResults([]);
      await fetchOrders();
      toast.success(isEditing ? "آرڈر کی معلومات کامیابی سے اپ ڈیٹ ہو گئیں" : "آرڈر کامیابی سے بنایا گیا");
    } catch (error) {
      console.error("Error saving order:", error);
      const errorMessage = error.response?.data?.message || "آرڈر کو محفوظ کرنے میں مسئلہ ہوا ہے۔ براہ کرم دوبارہ کوشش کریں۔";
      setFormErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order) => {
    // Handle both populated and non-populated customer data
    const customerId = order.customer?._id || order.customer || order.customerId || "";
    const customerName = order.customer?.name || order.customerName || "";
    const customerPhone = order.customer?.phone || order.customerPhone || "";
    
    setForm({
      customerPhone: customerPhone,
      customerId: customerId,
      customerName: customerName,
      suitDetails: order.suitDetails || [],
      assignedEmployee: order.assignedEmployee?._id || order.assignedEmployee || "",
      notes: order.notes || "",
    });
    setEditingId(order._id);
    setFormErrors({});
  };

  const handleDelete = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_ENDPOINTS.ORDERS}/${deleteModal.id}`);
      await fetchOrders();
      toast.success("آرڈر کامیابی سے حذف ہو گیا");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("آرڈر کو حذف کرنے میں مسئلہ ہوا ہے۔ براہ کرم دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectCustomer(searchResults[highlightIndex]);
    }
  };

  return (
    <div dir="rtl" style={{ direction: 'rtl', textAlign: 'right' }}>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="آرڈر حذف کریں"
        message="کیا آپ واقعی اس آرڈر کو حذف کرنا چاہتے ہیں؟"
        confirmText="حذف کریں"
        cancelText="منسوخ کریں"
      />
      <h2 style={{ direction: 'rtl', textAlign: 'right' }}>آرڈرز کا انتظام</h2>

      <div className="card">
        <h3>{editingId ? "آرڈر میں ترمیم" : "نیا آرڈر بنائیں"}</h3>
        
        <form onSubmit={handleSubmit}>
          {formErrors.submit && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              {formErrors.submit}
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>گاہک کا موبائل نمبر</label>
              <input
                type="text"
                name="customerPhone"
                value={form.customerPhone}
                onChange={handlePhoneChange}
                onKeyDown={handleKeyDown}
                placeholder="موبائل نمبر درج کریں"
                className={formErrors.customerPhone ? 'error ltr' : 'ltr'}
                dir="ltr"
                required
              />
              {formErrors.customerPhone && (
                <div className="error-message" style={{ 
                  fontSize: '12px', 
                  marginTop: '4px',
                  color: '#dc3545',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: '14px' }}>⚠️</span>
                  {formErrors.customerPhone}
                </div>
              )}
              
              {searchLoading && <div className="loader"></div>}
              
              {searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((customer, index) => (
                    <div
                      key={customer._id}
                      onClick={() => selectCustomer(customer)}
                      style={{
                        backgroundColor:
                          index === highlightIndex ? "#f0f0f0" : "transparent",
                      }}
                    >
                      {customer.name} - {customer.phone}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>منتخب گاہک</label>
              <input
                type="text"
                value={form.customerName || "کوئی گاہک منتخب نہیں"}
                readOnly
                className={formErrors.customerId ? 'error' : ''}
              />
              {formErrors.customerId && (
                <div className="error-message" style={{ 
                  fontSize: '12px', 
                  marginTop: '4px',
                  color: '#dc3545',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: '14px' }}>⚠️</span>
                  {formErrors.customerId}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>ملازم منتخب کریں</label>
              <select
                name="assignedEmployee"
                value={form.assignedEmployee}
                onChange={handleFormChange}
                className={formErrors.assignedEmployee ? 'error' : ''}
              >
                <option value="">-- منتخب کریں --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              {formErrors.assignedEmployee && (
                <div className="error-message" style={{ 
                  fontSize: '12px', 
                  marginTop: '4px',
                  color: '#dc3545',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: '14px' }}>⚠️</span>
                  {formErrors.assignedEmployee}
                </div>
              )}
            </div>
          </div>

          {form.suitDetails.length > 0 && (
            <div className="form-section">
              <h4>سوٹ کی تفصیلات</h4>
              {form.suitDetails.map((suit, suitIndex) => (
                <div key={suitIndex} className="suit-type-card">
                  <h5>
                    {suitTypes.find((st) => st._id === suit.suitType)?.name}
                  </h5>
                  {suit.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="mb-20">
                      <strong>{item.itemName}:</strong>
                      <div className="form-row">
                        {item.sizes.map((size, sizeIndex) => (
                          <div key={sizeIndex} className="form-group">
                            <label>{size.name}</label>
                            <input
                              type="number"
                              value={size.value}
                              readOnly
                              style={{ backgroundColor: '#f8f9fa' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label>نوٹس</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              placeholder="آرڈر کے بارے میں نوٹس درج کریں (اختیاری)"
              rows="3"
              className={formErrors.notes ? 'error' : ''}
            />
            {formErrors.notes && (
              <div className="error-message" style={{ 
                fontSize: '12px', 
                marginTop: '4px',
                color: '#dc3545',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ fontSize: '14px' }}>⚠️</span>
                {formErrors.notes}
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button type="submit" className="primary">
              {editingId ? "تبدیلیاں محفوظ کریں" : "آرڈر بنائیں"}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    customerPhone: "",
                    customerId: "",
                    customerName: "",
                    suitDetails: [],
                    assignedEmployee: "",
                    notes: "",
                  });
                  setFormErrors({});
                }}
                className="secondary"
              >
                منسوخ کریں
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>آرڈرز کی فہرست</h3>
        
        {loading && orders.length === 0 ? (
          <div className="text-center p-20">
            <p>لوڈ ہو رہا ہے...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center p-20">
            <p>کوئی آرڈر نہیں ملا</p>
          </div>
        ) : (
          <div className="table-wrapper" dir="rtl">
            <table dir="rtl">
              <thead>
                <tr>
                  <th>گاہک</th>
                  <th>موبائل</th>
                  <th>ملازم</th>
                  <th>سوٹ کی تفصیلات</th>
                  <th>تاریخ</th>
                  <th>نوٹس</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <strong>{order.customer?.name || order.customerName || "-"}</strong>
                  </td>
                  <td>{order.customer?.phone || order.customerPhone || "-"}</td>
                  <td>
                    {employees.find((emp) => emp._id === order.assignedEmployee)?.name || "-"}
                  </td>
                  <td>
                    {order.suitDetails.map((suit, i) => (
                      <div key={i} className="mb-20">
                        <div className="status-badge status-pending">
                          {suitTypes.find((st) => st._id === suit.suitType)?.name}
                        </div>
                        {suit.items.map((item, j) => (
                          <div key={j} style={{ marginTop: '8px', fontSize: '13px' }}>
                            <strong>{item.itemName}:</strong>{" "}
                            {item.sizes
                              .filter(sz => sz.value)
                              .map((sz) => `${sz.name}: ${sz.value}`)
                              .join(", ")}
                          </div>
                        ))}
                      </div>
                    ))}
                  </td>
                  <td>
                    {new Date(order.orderDate).toLocaleDateString('ur-PK')}
                  </td>
                  <td>
                    {order.notes || "-"}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleEdit(order)}
                        className="secondary"
                      >
                        ترمیم
                      </button>
                      <button 
                        onClick={() => handleDelete(order._id)}
                        className="danger"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
