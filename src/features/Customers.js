import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ValidatedInput from "../components/ValidatedInput";
import FractionalInput from "../components/FractionalInput";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import { validateForm, validationOptions } from "../utils/validation";
import { API_ENDPOINTS } from "../config/api";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [suitTypes, setSuitTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    serialNumber: "",
    suits: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [formModal, setFormModal] = useState({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  
  // Pagination states
  const [customersPage, setCustomersPage] = useState(1);
  const [customersPerPage, setCustomersPerPage] = useState(10);

  useEffect(() => {
    fetchCustomers();
    fetchSuitTypes();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_ENDPOINTS.CUSTOMERS);
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuitTypes = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.SUIT_TYPES);
      setSuitTypes(res.data || []);
      return res.data || [];
    } catch (err) {
      console.error("Error fetching suit types:", err);
      setSuitTypes([]);
      return [];
    }
  };

  const handleBasicChange = (e) => {
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
      suits: [
        ...form.suits,
        {
          suitType: "",
          items: [],
        },
      ],
    });
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
            type: size.type || "text", // Preserve size type
            value: size.type === "checkbox" ? false : "", // Initialize based on type
            options: size.options || [], // Preserve dropdown options
          })),
        })),
      };

      const updatedSuits = [...form.suits];
      updatedSuits[suitIndex] = newSuit;
      setForm({ ...form, suits: updatedSuits });
    }
  };

  const handleSizeValueChange = (e, suitIndex, itemIndex, sizeIndex) => {
    const { value, type, checked } = e.target;
    const updatedSuits = [...form.suits];
    const size = updatedSuits[suitIndex].items[itemIndex].sizes[sizeIndex];
    
    if (type === "checkbox") {
      size.value = checked;
    } else {
      size.value = value;
    }
    
    setForm({ ...form, suits: updatedSuits });
  };

  const validateCustomerForm = () => {
    const fieldsToValidate = [
      { name: 'name', type: 'name' },
      { name: 'phone', type: 'phone' },
      { name: 'serialNumber', type: 'serialNumber' }
    ];

    const validation = validateForm(form, fieldsToValidate);
    setFormErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCustomerForm()) {
      return;
    }

    try {
      setLoading(true);
      const isEditing = !!editingId;
      
      // Clean up form data before sending - ensure suits array exists and filter out empty suits
      const formData = {
        name: form.name || "",
        phone: form.phone || "",
        serialNumber: form.serialNumber || "",
        suits: (form.suits || []).filter(suit => suit.suitType) // Only include suits with a suitType selected
      };
      
      if (editingId) {
        await axios.put(`${API_ENDPOINTS.CUSTOMERS}/${editingId}`, formData);
        setEditingId(null);
      } else {
        await axios.post(API_ENDPOINTS.CUSTOMERS, formData);
      }
      setForm({ name: "", phone: "", serialNumber: "", suits: [] });
      setFormErrors({});
      setFormModal({ isOpen: false });
      await fetchCustomers();
      toast.success(isEditing ? "گاہک کی معلومات کامیابی سے اپ ڈیٹ ہو گئیں" : "گاہک کامیابی سے شامل ہو گیا");
    } catch (error) {
      console.error("Error saving customer:", error);
      const errorMessage = error.response?.data?.message || "گاہک کو محفوظ کرنے میں مسئلہ ہوا ہے۔ براہ کرم دوبارہ کوشش کریں۔";
      setFormErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (cust) => {
    // Always refresh suit types to ensure we have latest data with new size types
    const latestSuitTypes = await fetchSuitTypes();
    const suitTypesToUse = latestSuitTypes.length > 0 ? latestSuitTypes : suitTypes;
    
    // Transform customer data to match form structure
    // Convert populated suitType objects back to IDs
    const transformedForm = {
      name: cust.name || "",
      phone: cust.phone || "",
      serialNumber: cust.serialNumber || "",
      suits: cust.suits ? cust.suits.map(suit => {
        // Get the suit type to access size type information
        const suitTypeId = typeof suit.suitType === 'object' ? suit.suitType._id : suit.suitType;
        const suitTypeObj = typeof suit.suitType === 'object' 
          ? suit.suitType 
          : suitTypesToUse.find(st => st._id === suitTypeId);
        
        return {
          suitType: suitTypeId || "",
          items: suit.items ? suit.items.map(item => {
            // Find matching item in suit type to get size types
            const suitTypeItem = suitTypeObj?.items?.find(it => it.name === item.itemName);
            
            // Use suit type items as source of truth to ensure all sizes are included
            if (suitTypeItem && suitTypeItem.sizes) {
              return {
                itemName: suitTypeItem.name || item.itemName || "",
                sizes: suitTypeItem.sizes.map(suitTypeSize => {
                  // Find matching size in customer data to get existing value
                  const customerSize = item.sizes?.find(s => s.name === suitTypeSize.name);
                  
                  return {
                    name: suitTypeSize.name || "",
                    type: suitTypeSize.type || "text", // Get type from suit type definition
                    value: customerSize?.value !== undefined && customerSize?.value !== null 
                      ? customerSize.value 
                      : (suitTypeSize.type === "checkbox" ? false : ""),
                    options: suitTypeSize.options || [] // Get options from suit type definition
                  };
                })
              };
            }
            
            // Fallback if suit type item not found
            return {
              itemName: item.itemName || "",
              sizes: item.sizes ? item.sizes.map(size => {
                // Find matching size in suit type to get type and options
                const suitTypeSize = suitTypeItem?.sizes?.find(s => s.name === size.name);
                
                return {
                  name: size.name || "",
                  type: suitTypeSize?.type || "text", // Get type from suit type definition
                  value: size.value !== undefined && size.value !== null ? size.value : (suitTypeSize?.type === "checkbox" ? false : ""),
                  options: suitTypeSize?.options || [] // Get options from suit type definition
                };
              }) : []
            };
          }) : []
        };
      }) : []
    };
    
    setForm(transformedForm);
    setEditingId(cust._id);
    setFormErrors({});
    setFormModal({ isOpen: true });
  };

  const openAddModal = () => {
    setForm({ name: "", phone: "", serialNumber: "", suits: [] });
    setEditingId(null);
    setFormErrors({});
    setFormModal({ isOpen: true });
  };

  const closeFormModal = () => {
    setFormModal({ isOpen: false });
    setForm({ name: "", phone: "", serialNumber: "", suits: [] });
    setEditingId(null);
    setFormErrors({});
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination for customers table
  const customersStartIndex = (customersPage - 1) * customersPerPage;
  const customersEndIndex = customersStartIndex + customersPerPage;
  const paginatedCustomers = filteredCustomers.slice(customersStartIndex, customersEndIndex);
  const totalCustomersPages = Math.ceil(filteredCustomers.length / customersPerPage);

  const handleDelete = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_ENDPOINTS.CUSTOMERS}/${deleteModal.id}`);
      await fetchCustomers();
      toast.success("گاہک کامیابی سے حذف ہو گیا");
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("گاہک کو حذف کرنے میں مسئلہ ہوا ہے۔ براہ کرم دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  const removeSuitType = (suitIndex) => {
    const updatedSuits = form.suits.filter((_, index) => index !== suitIndex);
    setForm({ ...form, suits: updatedSuits });
  };

  return (
    <div dir="rtl" style={{ direction: 'rtl', textAlign: 'right' }}>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="گاہک حذف کریں"
        message="کیا آپ واقعی اس گاہک کو حذف کرنا چاہتے ہیں؟"
        confirmText="حذف کریں"
        cancelText="منسوخ کریں"
      />

      {/* Form Modal */}
      {formModal.isOpen && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "گاہک کی معلومات میں ترمیم" : "نیا گاہک شامل کریں"}</h3>
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
                  <ValidatedInput
                    fieldType="name"
                    name="name"
                    value={form.name}
                    onChange={handleBasicChange}
                    placeholder="گاہک کا نام درج کریں"
                    label="نام"
                    required
                  />
                  
                  <ValidatedInput
                    fieldType="serialNumber"
                    name="serialNumber"
                    value={form.serialNumber}
                    onChange={handleBasicChange}
                    placeholder="سیریل نمبر درج کریں"
                    label="سیریل نمبر"
                  />
                  
                  <ValidatedInput
                    fieldType="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleBasicChange}
                    placeholder="موبائل نمبر درج کریں"
                    label="موبائل نمبر"
                    required
                  />
                </div>

                <div className="form-section">
                  <div className="flex gap-10 mb-20">
                    <button type="button" onClick={addSuitType} className="primary">
                      + سوٹ کی قسم شامل کریں
                    </button>
                  </div>

                  {form.suits.map((suit, suitIndex) => (
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
                                        id={`size-checkbox-${suitIndex}-${itemIndex}-${sizeIndex}`}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                      />
                                      <label 
                                        htmlFor={`size-checkbox-${suitIndex}-${itemIndex}-${sizeIndex}`}
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

                  <div className="action-buttons">
                    <button type="submit" className="primary">
                      {editingId ? "تبدیلیاں محفوظ کریں" : "گاہک شامل کریں"}
                    </button>
                    <button 
                      type="button" 
                      onClick={closeFormModal}
                      className="secondary"
                    >
                      منسوخ کریں
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <h2 style={{ direction: 'rtl', textAlign: 'right' }}>گاہک کا انتظام</h2>

      {/* Search and Add Button */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="نام، موبائل یا سیریل نمبر سے تلاش کریں..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCustomersPage(1); // Reset to first page on search
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
            + نیا گاہک شامل کریں
          </button>
        </div>
      </div>

      {/* Customers List */}
      <div className="card">
        <h3>گاہکوں کی فہرست</h3>
        
        {loading && customers.length === 0 ? (
          <div className="text-center p-20">
            <p>لوڈ ہو رہا ہے...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center p-20">
            <p>{searchTerm ? "تلاش کے نتائج نہیں ملے" : "کوئی گاہک نہیں ملا"}</p>
          </div>
        ) : (
          <div className="table-wrapper" dir="rtl">
            <table dir="rtl">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>سیریل نمبر</th>
                  <th>موبائل</th>
                  <th>سوٹ کی تفصیلات</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
              {paginatedCustomers.map((c) => (
                <tr key={c._id}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td>{c.serialNumber || "-"}</td>
                  <td>{c.phone}</td>
                  <td>
                    {c.suits.map((s, i) => {
                      // Handle both populated object and ID string
                      const suitTypeName = typeof s.suitType === 'object' && s.suitType !== null
                        ? s.suitType.name
                        : suitTypes.find((st) => st._id === s.suitType)?.name || 'Unknown';
                      
                      return (
                        <div key={i} className="mb-20">
                          <div className="status-badge status-pending">
                            {suitTypeName}
                          </div>
                          {s.items && s.items.map((it, j) => (
                            <div key={j} style={{ marginTop: '8px', fontSize: '13px' }}>
                              <strong>{it.itemName}:</strong>{" "}
                              {it.sizes && it.sizes
                                .filter(sz => sz.value)
                                .map((sz) => `${sz.name}: ${sz.value}`)
                                .join(", ")}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleEdit(c)}
                        className="secondary"
                        title="ترمیم"
                        style={{ fontSize: '18px', padding: '8px 12px' }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(c._id)}
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
        
        {filteredCustomers.length > 0 && (
          <Pagination
            currentPage={customersPage}
            totalPages={totalCustomersPages}
            onPageChange={setCustomersPage}
            itemsPerPage={customersPerPage}
            totalItems={filteredCustomers.length}
            onItemsPerPageChange={(value) => {
              setCustomersPerPage(value);
              setCustomersPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Customers;
