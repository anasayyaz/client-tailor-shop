import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ValidatedInput from "../components/ValidatedInput";
import FractionalInput from "../components/FractionalInput";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [formModal, setFormModal] = useState({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  
  // Pagination states
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);

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
          // Query backend by phone instead of fetching all customers
          const res = await axios.get(`${API_ENDPOINTS.CUSTOMERS}/phone/${value}`, {
            signal: searchAbortController.current.signal
          });
          // If found, show a single result list to select from
          if (res.data) {
            setSearchResults([res.data]);
            // Auto-select when exact phone matches to fill fields immediately
            if (res.data.phone === value) {
              selectCustomer(res.data);
            }
          } else {
            setSearchResults([]);
          }
        } catch (err) {
          // Ignore abort errors
          if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
            if (err.response && err.response.status === 404) {
              // Not found for this phone input
              setSearchResults([]);
            } else {
              console.error("Error searching customers:", err);
              setSearchResults([]);
            }
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
    // Get suit types to access size type information
    const suitTypeMap = new Map();
    suitTypes.forEach(st => suitTypeMap.set(st._id, st));
    
    // Initialize suitDetails from customer's suits, but allow editing
    // This creates a copy that can be modified independently for this order
    const initialSuitDetails = customer.suits && customer.suits.length > 0 
      ? customer.suits.map((suit) => {
          const suitTypeId = typeof suit.suitType === "object" ? suit.suitType._id : suit.suitType;
          const suitTypeObj = typeof suit.suitType === "object" ? suit.suitType : suitTypeMap.get(suitTypeId);
          
          return {
            suitType: suitTypeId,
            items: suitTypeObj?.items?.map((suitTypeItem) => {
              // Use suit type items as the source of truth to ensure all sizes are included
              const customerItem = suit.items?.find(it => it.itemName === suitTypeItem.name);
              
              return {
                itemName: suitTypeItem.name,
                sizes: suitTypeItem.sizes.map((suitTypeSize) => {
                  // Find matching size in customer data to get existing value
                  const customerSize = customerItem?.sizes?.find(s => s.name === suitTypeSize.name);
                  
                  return {
                    name: suitTypeSize.name,
                    type: suitTypeSize.type || "text",
                    value: customerSize?.value !== undefined && customerSize?.value !== null 
                      ? customerSize.value 
                      : (suitTypeSize.type === "checkbox" ? false : ""),
                    options: suitTypeSize.options || []
                  };
                }),
              };
            }) || suit.items.map((item) => {
              // Fallback if suit type not found
              const suitTypeItem = suitTypeObj?.items?.find(it => it.name === item.itemName);
              
              return {
                itemName: item.itemName,
                sizes: item.sizes.map((size) => {
                  const suitTypeSize = suitTypeItem?.sizes?.find(s => s.name === size.name);
                  
                  return {
                    name: size.name,
                    type: suitTypeSize?.type || "text",
                    value: size.value !== null && size.value !== undefined ? size.value : "",
                    options: suitTypeSize?.options || []
                  };
                }),
              };
            }),
          };
        })
      : [];
    
    setForm({
      ...form,
      customerPhone: customer.phone,
      customerId: customer._id,
      customerName: customer.name,
      suitDetails: initialSuitDetails,
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

  const addSuitType = () => {
    setForm({
      ...form,
      suitDetails: [
        ...form.suitDetails,
        {
          suitType: "",
          items: [],
        },
      ],
    });
  };

  const removeSuitType = (suitIndex) => {
    const updatedSuitDetails = form.suitDetails.filter((_, index) => index !== suitIndex);
    setForm({ ...form, suitDetails: updatedSuitDetails });
  };

  const handleSuitTypeChange = (e, suitIndex) => {
    const suitTypeId = e.target.value;
    const selectedSuitType = suitTypes.find((st) => st._id === suitTypeId);

    if (selectedSuitType) {
      const newSuit = {
        suitType: selectedSuitType._id,
        items: selectedSuitType.items.map((item) => ({
          itemName: item.name,
          sizes: item.sizes.map((size) => ({
            name: size.name,
            type: size.type || "text",
            value: size.type === "checkbox" ? false : "",
            options: size.options || [],
          })),
        })),
      };

      const updatedSuitDetails = [...form.suitDetails];
      updatedSuitDetails[suitIndex] = newSuit;
      setForm({ ...form, suitDetails: updatedSuitDetails });
    }
  };

  const handleSizeValueChange = (e, suitIndex, itemIndex, sizeIndex) => {
    const { value, type, checked } = e.target;
    const updatedSuitDetails = [...form.suitDetails];
    const size = updatedSuitDetails[suitIndex].items[itemIndex].sizes[sizeIndex];
    
    if (type === "checkbox") {
      size.value = checked;
    } else {
      size.value = value;
    }
    
    setForm({ ...form, suitDetails: updatedSuitDetails });
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
      setFormModal({ isOpen: false });
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

  const handleEdit = async (order) => {
    // Handle both populated and non-populated customer data
    const customerId = order.customer?._id || order.customer || order.customerId || "";
    let customerName = order.customer?.name || order.customerName || "";
    let customerPhone = order.customer?.phone || order.customerPhone || "";
    
    // Fetch full customer data to get suit details with proper size types
    let customerData = null;
    if (customerId) {
      try {
        const res = await axios.get(`${API_ENDPOINTS.CUSTOMERS}/${customerId}`);
        customerData = res.data;
        // Update name and phone from fetched customer data if available
        if (customerData) {
          customerName = customerData.name || customerName;
          customerPhone = customerData.phone || customerPhone;
        }
      } catch (err) {
        console.error("Error fetching customer data:", err);
        // Fall back to order data if customer fetch fails
      }
    }
    
    // Always use order's suitDetails (not customer's suits) - each order has its own copy
    let suitDetailsToUse = order.suitDetails || [];
    
    // Enhance suitDetails with size types from suit types if needed
    if (suitDetailsToUse.length > 0) {
      const suitTypeMap = new Map();
      suitTypes.forEach(st => suitTypeMap.set(st._id, st));
      
      suitDetailsToUse = suitDetailsToUse.map((suit) => {
        const suitTypeId = typeof suit.suitType === "object" ? suit.suitType._id : suit.suitType;
        const suitTypeObj = suitTypeMap.get(suitTypeId);
        
        if (!suitTypeObj) {
          // If suit type not found, return as is
          return suit;
        }
        
        return {
          suitType: suitTypeId,
          items: suit.items.map((item) => {
            const suitTypeItem = suitTypeObj?.items?.find(it => it.name === item.itemName);
            
            if (!suitTypeItem) {
              // If item not found in suit type, return as is
              return {
                itemName: item.itemName,
                sizes: item.sizes.map((size) => ({
                  name: size.name,
                  type: "text",
                  value: size.value !== undefined && size.value !== null ? size.value : "",
                  options: []
                }))
              };
            }
            
            return {
              itemName: item.itemName,
              sizes: suitTypeItem.sizes.map((suitTypeSize) => {
                // Find matching size in order data to get order value
                const orderSize = item.sizes?.find(s => s.name === suitTypeSize.name);
                
                return {
                  name: suitTypeSize.name,
                  type: suitTypeSize.type || "text",
                  value: orderSize?.value !== undefined && orderSize?.value !== null 
                    ? orderSize.value 
                    : (suitTypeSize.type === "checkbox" ? false : ""),
                  options: suitTypeSize.options || []
                };
              }),
            };
          }),
        };
      });
    }
    
    // Use customer data if available for name and phone
    const finalCustomerName = customerData?.name || customerName || "";
    const finalCustomerPhone = customerData?.phone || customerPhone || "";
    
    // Ensure customer is properly selected
    const formData = {
      customerPhone: finalCustomerPhone,
      customerId: customerId,
      customerName: finalCustomerName,
      suitDetails: suitDetailsToUse,
      assignedEmployee: order.assignedEmployee?._id || order.assignedEmployee || "",
      notes: order.notes || "",
    };
    
    // Set form and open modal
    setForm(formData);
    setEditingId(order._id);
    setFormErrors({});
    setSearchResults([]);
    setFormModal({ isOpen: true });
  };

  const openAddModal = () => {
    setForm({
      customerPhone: "",
      customerId: "",
      customerName: "",
      suitDetails: [],
      assignedEmployee: "",
      notes: "",
    });
    setEditingId(null);
    setFormErrors({});
    setSearchResults([]);
    setFormModal({ isOpen: true });
  };

  const closeFormModal = () => {
    setFormModal({ isOpen: false });
    setForm({
      customerPhone: "",
      customerId: "",
      customerName: "",
      suitDetails: [],
      assignedEmployee: "",
      notes: "",
    });
    setEditingId(null);
    setFormErrors({});
    setSearchResults([]);
  };

  const filteredOrders = orders.filter(order => {
    const customerName = order.customer?.name || order.customerName || "";
    const customerPhone = order.customer?.phone || order.customerPhone || "";
    return (
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerPhone.includes(searchTerm)
    );
  });

  // Pagination for orders table
  const ordersStartIndex = (ordersPage - 1) * ordersPerPage;
  const ordersEndIndex = ordersStartIndex + ordersPerPage;
  const paginatedOrders = filteredOrders.slice(ordersStartIndex, ordersEndIndex);
  const totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage);

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
      {/* Order Form Modal */}
      {formModal.isOpen && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "آرڈر میں ترمیم" : "نیا آرڈر بنائیں"}</h3>
              <button className="modal-close" onClick={closeFormModal}>×</button>
            </div>
            <div className="modal-body">
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
                disabled={!!editingId && !!form.customerId}
                style={editingId && form.customerId ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
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

          <div className="form-section">
            <div className="flex gap-10 mb-20">
              <button type="button" onClick={addSuitType} className="primary">
                + سوٹ کی قسم شامل کریں
              </button>
            </div>

            {form.suitDetails.map((suit, suitIndex) => (
              <div key={suitIndex} className="suit-type-card">
                <div className="flex gap-10 mb-20">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>سوٹ کی قسم</label>
                    <select
                      onChange={(e) => handleSuitTypeChange(e, suitIndex)}
                      value={suit.suitType}
                      required
                    >
                      <option value="">-- منتخب کریں --</option>
                      {suitTypes.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={() => removeSuitType(suitIndex)}
                    className="danger"
                    style={{ alignSelf: 'end', marginTop: '25px' }}
                  >
                    حذف کریں
                  </button>
                </div>

                {suit.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="form-section">
                    <h4>{item.itemName}</h4>
                    <div className="form-row">
                      {item.sizes.map((size, sizeIndex) => {
                        const sizeType = size.type || "text";
                        
                        // Text field type
                        if (sizeType === "text") {
                          return (
                            <FractionalInput
                              key={sizeIndex}
                              fieldType="sizeValue"
                              type="text"
                              value={size.value || ""}
                              onChange={(e) =>
                                handleSizeValueChange(
                                  e,
                                  suitIndex,
                                  itemIndex,
                                  sizeIndex
                                )
                              }
                              placeholder="سائز درج کریں"
                              label={size.name}
                            />
                          );
                        }
                        
                        // Checkbox type
                        if (sizeType === "checkbox") {
                          return (
                            <div key={sizeIndex} className="form-group">
                              <label>{size.name}</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={size.value === true}
                                  onChange={(e) =>
                                    handleSizeValueChange(
                                      e,
                                      suitIndex,
                                      itemIndex,
                                      sizeIndex
                                    )
                                  }
                                  id={`order-size-checkbox-${suitIndex}-${itemIndex}-${sizeIndex}`}
                                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label 
                                  htmlFor={`order-size-checkbox-${suitIndex}-${itemIndex}-${sizeIndex}`}
                                  style={{ cursor: 'pointer', fontSize: '14px', margin: 0 }}
                                >
                                  منتخب کریں
                                </label>
                              </div>
                            </div>
                          );
                        }
                        
                        // Dropdown type
                        if (sizeType === "dropdown" && size.options && size.options.length > 0) {
                          return (
                            <div key={sizeIndex} className="form-group">
                              <label>{size.name}</label>
                              <select
                                value={size.value || ""}
                                onChange={(e) =>
                                  handleSizeValueChange(
                                    e,
                                    suitIndex,
                                    itemIndex,
                                    sizeIndex
                                  )
                                }
                              >
                                <option value="">-- منتخب کریں --</option>
                                {size.options.filter(opt => opt && opt.trim() !== "").map((option, optIndex) => (
                                  <option key={optIndex} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

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
                  <button 
                    type="button" 
                    onClick={closeFormModal}
                    className="secondary"
                  >
                    منسوخ کریں
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <h2 style={{ direction: 'rtl', textAlign: 'right' }}>آرڈرز کا انتظام</h2>

      {/* Search and Add Button */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="گاہک کے نام یا موبائل نمبر سے تلاش کریں..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setOrdersPage(1); // Reset to first page on search
              }}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          <button 
            onClick={openAddModal}
            className="primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            + نیا آرڈر بنائیں
          </button>
        </div>
      </div>

      <div className="card">
        <h3>آرڈرز کی فہرست</h3>
        
        {loading && orders.length === 0 ? (
          <div className="text-center p-20">
            <p>لوڈ ہو رہا ہے...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center p-20">
            <p>{searchTerm ? "تلاش کے نتائج نہیں ملے" : "کوئی آرڈر نہیں ملا"}</p>
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
              {paginatedOrders.map((order) => (
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
                        title="ترمیم"
                        style={{ fontSize: '18px', padding: '8px 12px' }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => window.open(`/print/${order._id}`, '_blank')}
                        className="primary"
                      >
                        پرنٹ
                      </button>
                      <button 
                        onClick={() => handleDelete(order._id)}
                        className="danger"
                        title="حذف"
                        style={{ fontSize: '18px', padding: '8px 12px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
        
        {filteredOrders.length > 0 && (
          <Pagination
            currentPage={ordersPage}
            totalPages={totalOrdersPages}
            onPageChange={setOrdersPage}
            itemsPerPage={ordersPerPage}
            totalItems={filteredOrders.length}
            onItemsPerPageChange={(value) => {
              setOrdersPerPage(value);
              setOrdersPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Orders;
