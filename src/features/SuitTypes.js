import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ValidatedInput from "../components/ValidatedInput";
import ConfirmModal from "../components/ConfirmModal";
import { validateForm, validateField, validationOptions } from "../utils/validation";
import { API_ENDPOINTS } from "../config/api";

function SuitTypes() {
  const [suitTypes, setSuitTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    name: "",
    items: [{ name: "", sizes: [{ name: "", sizeType: "", value: "", options: [] }] }],
  });
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [formModal, setFormModal] = useState({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const fetchSuitTypes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_ENDPOINTS.SUIT_TYPES);
      setSuitTypes(res.data || []);
    } catch (err) {
      console.error("Error fetching suit types:", err);
      setSuitTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuitTypes();
  }, []);

  const handleFormChange = (e, itemIndex, sizeIndex) => {
    const { name, value, type, checked } = e.target;
    const updatedForm = { ...form };

    if (name === "typeName") {
      updatedForm.name = value;
      // Clear error when user starts typing
      if (formErrors.typeName) {
        setFormErrors(prev => ({ ...prev, typeName: "" }));
      }
    } else if (name === "itemName") {
      updatedForm.items[itemIndex].name = value;
      // Clear error when user starts typing
      if (formErrors[`itemName_${itemIndex}`]) {
        setFormErrors(prev => ({ ...prev, [`itemName_${itemIndex}`]: "" }));
      }
    } else if (name === "sizeName") {
      updatedForm.items[itemIndex].sizes[sizeIndex].name = value;
      // Clear error when user starts typing
      if (formErrors[`sizeName_${itemIndex}_${sizeIndex}`]) {
        setFormErrors(prev => ({ ...prev, [`sizeName_${itemIndex}_${sizeIndex}`]: "" }));
      }
    } else if (name === "sizeType") {
      // Only allow setting type if it's not already set (lock after first selection)
      if (!updatedForm.items[itemIndex].sizes[sizeIndex].sizeType) {
        updatedForm.items[itemIndex].sizes[sizeIndex].sizeType = value;
        // Reset value and options when type is first set
        updatedForm.items[itemIndex].sizes[sizeIndex].value = "";
        if (value === "dropdown") {
          updatedForm.items[itemIndex].sizes[sizeIndex].options = [""];
        } else {
          updatedForm.items[itemIndex].sizes[sizeIndex].options = [];
        }
      }
    } else if (name === "sizeValue") {
      updatedForm.items[itemIndex].sizes[sizeIndex].value = value;
    } else if (name === "sizeChecked") {
      updatedForm.items[itemIndex].sizes[sizeIndex].value = checked;
    } else if (name === "dropdownOption") {
      const optionIndex = parseInt(e.target.dataset.optionIndex);
      const newOptions = [...updatedForm.items[itemIndex].sizes[sizeIndex].options];
      newOptions[optionIndex] = value;
      updatedForm.items[itemIndex].sizes[sizeIndex].options = newOptions;
    } else if (name === "dropdownSelected") {
      updatedForm.items[itemIndex].sizes[sizeIndex].value = value;
    }

    setForm(updatedForm);
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { name: "", sizes: [{ name: "", sizeType: "", value: "", options: [] }] }],
    });
  };

  const addSize = (itemIndex) => {
    const newItems = [...form.items];
    newItems[itemIndex].sizes.push({ name: "", sizeType: "", value: "", options: [] }); // Start with no type selected
    setForm({ ...form, items: newItems });
  };

  const addDropdownOption = (itemIndex, sizeIndex) => {
    const newItems = [...form.items];
    newItems[itemIndex].sizes[sizeIndex].options.push("");
    setForm({ ...form, items: newItems });
  };

  const removeDropdownOption = (itemIndex, sizeIndex, optionIndex) => {
    const newItems = [...form.items];
    newItems[itemIndex].sizes[sizeIndex].options = newItems[itemIndex].sizes[sizeIndex].options.filter(
      (_, index) => index !== optionIndex
    );
    setForm({ ...form, items: newItems });
  };

  const removeItem = (itemIndex) => {
    const newItems = form.items.filter((_, index) => index !== itemIndex);
    setForm({ ...form, items: newItems });
  };

  const removeSize = (itemIndex, sizeIndex) => {
    const newItems = [...form.items];
    newItems[itemIndex].sizes = newItems[itemIndex].sizes.filter(
      (_, index) => index !== sizeIndex
    );
    setForm({ ...form, items: newItems });
  };

  const validateSuitTypeForm = () => {
    const errors = {};
    let isValid = true;

    // Validate suit type name
    const nameValidation = validateField(form.name, 'suitTypeName', validationOptions.suitTypeName);
    if (!nameValidation.isValid) {
      errors.typeName = nameValidation.message;
      isValid = false;
    }

    // Validate items and sizes
    form.items.forEach((item, itemIndex) => {
      // Validate item name
      const itemNameValidation = validateField(item.name, 'itemName', validationOptions.itemName);
      if (!itemNameValidation.isValid) {
        errors[`itemName_${itemIndex}`] = itemNameValidation.message;
        isValid = false;
      }

      // Validate sizes
      item.sizes.forEach((size, sizeIndex) => {
        const sizeNameValidation = validateField(size.name, 'sizeName', validationOptions.sizeName);
        if (!sizeNameValidation.isValid) {
          errors[`sizeName_${itemIndex}_${sizeIndex}`] = sizeNameValidation.message;
          isValid = false;
        }
      });
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateSuitTypeForm()) {
      return;
    }

    try {
      setLoading(true);
      const isEditing = !!editingId;
      
      // Transform form data to match backend model structure
      const formData = {
        name: form.name,
        items: form.items.map(item => ({
          name: item.name,
          sizes: item.sizes.map(size => {
            const sizeData = {
              name: size.name,
              type: size.sizeType || "text" // Default to text when saving if somehow empty
            };
            
            if (size.sizeType === "checkbox") {
              sizeData.value = size.value === true;
            } else if (size.sizeType === "dropdown") {
              sizeData.options = size.options || [];
              sizeData.value = size.value || "";
            } else {
              sizeData.value = size.value || "";
            }
            
            return sizeData;
          })
        }))
      };
      
      if (editingId) {
        await axios.put(`${API_ENDPOINTS.SUIT_TYPES}/${editingId}`, formData);
        setEditingId(null);
      } else {
        await axios.post(API_ENDPOINTS.SUIT_TYPES, formData);
      }
      setForm({
        name: "",
        items: [{ name: "", sizes: [{ name: "", sizeType: "", value: "", options: [] }] }],
      });
      setFormErrors({});
      setFormModal({ isOpen: false });
      await fetchSuitTypes();
      toast.success(isEditing ? "سوٹ کی قسم کی معلومات کامیابی سے اپ ڈیٹ ہو گئیں" : "سوٹ کی قسم کامیابی سے شامل ہو گئی");
    } catch (error) {
      console.error("Error saving suit type:", error);
      const errorMessage = error.response?.data?.message || "سوٹ کی قسم کو محفوظ کرنے میں مسئلہ ہوا ہے۔ براہ کرم دوبارہ کوشش کریں۔";
      setFormErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (st) => {
    // Deep copy the suit type data to avoid reference issues
    setForm({
      name: st.name || "",
      items: st.items ? st.items.map(item => ({
        name: item.name || "",
        sizes: item.sizes ? item.sizes.map(size => ({
          name: size.name || "",
          sizeType: size.type || "", // Map 'type' from backend to 'sizeType' in form (empty if no type set)
          value: size.value !== undefined && size.value !== null ? size.value : "",
          options: size.options || []
        })) : [{ name: "", sizeType: "", value: "", options: [] }]
      })) : [{ name: "", sizes: [{ name: "", sizeType: "", value: "", options: [] }] }]
    });
    setEditingId(st._id);
    setFormErrors({});
    setFormModal({ isOpen: true });
  };

  const openAddModal = () => {
    setForm({
      name: "",
      type: "",
      items: [{ name: "", sizes: [{ name: "", sizeType: "", value: "", options: [] }] }],
    });
    setEditingId(null);
    setFormErrors({});
    setFormModal({ isOpen: true });
  };

  const closeFormModal = () => {
    setFormModal({ isOpen: false });
    setForm({
      name: "",
      type: "",
      items: [{ name: "", sizes: [{ name: "", sizeType: "", value: "", options: [] }] }],
    });
    setEditingId(null);
    setFormErrors({});
  };

  const filteredSuitTypes = suitTypes.filter(st => 
    st.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_ENDPOINTS.SUIT_TYPES}/${deleteModal.id}`);
      await fetchSuitTypes();
      toast.success("سوٹ کی قسم کامیابی سے حذف ہو گئی");
    } catch (error) {
      console.error("Error deleting suit type:", error);
      toast.error("سوٹ کی قسم کو حذف کرنے میں مسئلہ ہوا ہے۔ براہ کرم دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
      setDeleteModal({ isOpen: false, id: null });
    }
  };


  return (
    <div dir="rtl" style={{ direction: 'rtl', textAlign: 'right' }}>
      <style>{`
        @media (max-width: 768px) {
          .suit-type-card {
            padding: 12px !important;
          }
          
          .form-row {
            grid-template-columns: 1fr !important;
            gap: 15px !important;
          }
          
          .modal-content .form-group {
            min-width: 100% !important;
            flex: 1 1 100% !important;
          }
          
          .modal-content .flex {
            flex-direction: column !important;
          }
          
          .modal-content .flex > * {
            width: 100% !important;
            min-width: 100% !important;
            flex: 1 1 100% !important;
          }
          
          .modal-content button[style*="alignSelf"] {
            align-self: stretch !important;
            margin-top: 10px !important;
          }
          
          .modal-content .suit-type-card > div[style*="display: flex"] {
            flex-direction: column !important;
          }
          
          .modal-content .suit-type-card > div[style*="display: flex"] > * {
            width: 100% !important;
            min-width: 100% !important;
            margin-top: 10px !important;
          }
          
          .modal-content .suit-type-card > div[style*="display: flex"] > button {
            margin-top: 10px !important;
            align-self: stretch !important;
          }
        }
        
        @media (max-width: 480px) {
          .modal-content .suit-type-card {
            padding: 10px !important;
            margin-bottom: 15px !important;
          }
          
          .modal-content .form-section {
            padding: 12px !important;
          }
        }
      `}</style>
      
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="سوٹ کی قسم حذف کریں"
        message="کیا آپ واقعی اس سوٹ کی قسم کو حذف کرنا چاہتے ہیں؟"
        confirmText="حذف کریں"
        cancelText="منسوخ کریں"
      />

      {/* Form Modal */}
      {formModal.isOpen && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "سوٹ کی قسم میں ترمیم" : "نیا سوٹ کی قسم شامل کریں"}</h3>
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
                    fieldType="suitTypeName"
                    name="typeName"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="سوٹ کی قسم کا نام درج کریں"
                    label="سوٹ کی قسم کا نام"
                    required
                  />
                </div>

                <div className="form-section" style={{ padding: '12px', marginBottom: '15px' }}>
                  <button type="button" onClick={addItem} className="primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                    + آئٹم شامل کریں
                  </button>

                  {form.items.map((item, i) => (
                    <div key={i} className="suit-type-card" style={{ padding: '12px', marginBottom: '15px' }}>
                      <div className="flex gap-10 mb-20" style={{ flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                          <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block', fontWeight: '600' }}>آئٹم {i + 1} کا نام *</label>
                          <input
                            type="text"
                            name="itemName"
                            value={item.name}
                            onChange={(e) => handleFormChange(e, i)}
                            placeholder="آئٹم کا نام"
                            required
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              fontSize: '14px',
                              border: '1px solid #ddd',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                        
                        <button 
                          type="button" 
                          onClick={() => removeItem(i)}
                          className="danger"
                          style={{ 
                            alignSelf: 'flex-end', 
                            marginTop: '24px', 
                            whiteSpace: 'nowrap',
                            padding: '8px 12px',
                            fontSize: '13px'
                          }}
                          disabled={form.items.length === 1}
                        >
                          حذف
                        </button>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <button 
                          type="button" 
                          onClick={() => addSize(i)} 
                          className="secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px'
                          }}
                        >
                          + سائز شامل کریں
                        </button>
                      </div>

                      <div className="form-row" style={{ gap: '10px' }}>
                        {item.sizes.map((size, j) => (
                          <div key={j} className="suit-type-card" style={{ marginBottom: '10px', padding: '10px' }}>
                              <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                alignItems: 'flex-start', 
                                marginBottom: '8px',
                                flexWrap: 'wrap'
                              }}>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                  <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>سائز {j + 1}</label>
                                  <input
                                    type="text"
                                    name="sizeName"
                                    value={size.name}
                                    onChange={(e) => handleFormChange(e, i, j)}
                                    placeholder="نام"
                                    required
                                    style={{ 
                                      width: '100%',
                                      padding: '6px 8px',
                                      fontSize: '13px',
                                      border: '1px solid #ddd',
                                      borderRadius: '4px'
                                    }}
                                  />
                                </div>
                                {!size.sizeType && (
                                  <div style={{ flex: '0 1 120px', minWidth: '120px' }}>
                                    <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>قسم *</label>
                                    <select
                                      name="sizeType"
                                      value={size.sizeType || ""}
                                      onChange={(e) => handleFormChange(e, i, j)}
                                      required
                                      style={{
                                        width: '100%',
                                        padding: '6px 8px',
                                        fontSize: '13px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                      }}
                                    >
                                      <option value="">-- منتخب کریں --</option>
                                      <option value="text">ٹیکسٹ</option>
                                      <option value="checkbox">چیک باکس</option>
                                      <option value="dropdown">ڈراپ ڈاؤن</option>
                                    </select>
                                  </div>
                                )}
                                <button 
                                  type="button" 
                                  onClick={() => removeSize(i, j)}
                                  className="danger"
                                  disabled={item.sizes.length === 1}
                                  style={{ 
                                    padding: '6px 10px', 
                                    marginTop: '20px',
                                    flex: '0 0 auto',
                                    minWidth: '35px',
                                    fontSize: '16px',
                                    lineHeight: '1'
                                  }}
                                  title="حذف کریں"
                                >
                                  ×
                                </button>
                              </div>
                              
                              {!size.sizeType && (
                                <div style={{ 
                                  padding: '6px', 
                                  background: '#fff3cd', 
                                  border: '1px solid #ffc107', 
                                  borderRadius: '4px',
                                  marginBottom: '8px',
                                  fontSize: '11px',
                                  color: '#856404'
                                }}>
                                  ⚠️ قسم منتخب کریں
                                </div>
                              )}

                              {/* Input fields (text, checkbox, dropdown) will only be shown when placing orders or taking customer measurements */}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="action-buttons">
                    <button type="submit" className="primary">
                      {editingId ? "تبدیلیاں محفوظ کریں" : "سوٹ کی قسم شامل کریں"}
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

      <h2 style={{ direction: 'rtl', textAlign: 'right' }}>سوٹ کی اقسام کا انتظام</h2>

      {/* Search and Add Button */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="سوٹ کی قسم کے نام سے تلاش کریں..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            + نیا سوٹ کی قسم شامل کریں
          </button>
        </div>
      </div>

      {/* Suit Types List */}
      <div className="card">
        <h3>موجودہ سوٹ کی اقسام</h3>
        
        {loading && suitTypes.length === 0 ? (
          <div className="text-center p-20">
            <p>لوڈ ہو رہا ہے...</p>
          </div>
        ) : filteredSuitTypes.length === 0 ? (
          <div className="text-center p-20">
            <p>{searchTerm ? "تلاش کے نتائج نہیں ملے" : "کوئی سوٹ کی قسم نہیں ملی"}</p>
          </div>
        ) : (
          <div className="table-wrapper" dir="rtl">
            <table dir="rtl">
                      <thead>
                        <tr>
                          <th>نام</th>
                          <th>آئٹمز اور سائز</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSuitTypes.map((suit) => (
                          <tr key={suit._id}>
                            <td>
                              <strong>{suit.name}</strong>
                            </td>
                            <td>
                              {suit.items.map((item, i) => (
                                <div key={i} className="mb-20">
                                  <div className="status-badge status-pending">
                                    {item.name}
                                  </div>
                                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                                    <strong>سائز:</strong>{" "}
                                    {item.sizes.map((s, j) => {
                                      let displayValue = "";
                                      if (s.type === "checkbox") {
                                        displayValue = s.value ? "✓" : "";
                                      } else if (s.type === "dropdown") {
                                        displayValue = s.value ? `(${s.value})` : "";
                                      } else {
                                        displayValue = s.value ? `: ${s.value}` : "";
                                      }
                                      
                                      return (
                                        <span key={j} style={{ marginLeft: '5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <span className="status-badge status-completed">
                                            {s.name}{displayValue}
                                          </span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleEdit(suit)}
                          className="secondary"
                          title="ترمیم"
                          style={{ fontSize: '18px', padding: '8px 12px' }}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(suit._id)}
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
      </div>
    </div>
  );
}

export default SuitTypes;
