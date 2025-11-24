import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ValidatedInput from "../components/ValidatedInput";
import FractionalInput from "../components/FractionalInput";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import SpeechToText from "../components/SpeechToText";
import { validateForm, validationOptions } from "../utils/validation";
import { API_ENDPOINTS, api } from "../config/api";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [suitTypes, setSuitTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    serialNumber: "",
    rawSpeechInput: "",
    suits: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [formModal, setFormModal] = useState({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [speechModal, setSpeechModal] = useState({ isOpen: false });
  
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
      const res = await api.get(API_ENDPOINTS.CUSTOMERS);
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
      const res = await api.get(API_ENDPOINTS.SUIT_TYPES);
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
          sizes: item.sizes.map((size) => {
            let initialValue;
            if (size.type === "checkbox") {
              initialValue = false;
            } else if (size.type === "group") {
              // Initialize group with all fields
              initialValue = size.fields.map(field => ({
                name: field.name,
                type: field.type,
                value: field.type === "checkbox" ? false : "",
                options: field.options || []
              }));
            } else if (size.type === "array") {
              // Initialize empty array
              initialValue = [];
            } else {
              initialValue = "";
            }
            
            return {
              name: size.name,
              type: size.type || "text",
              value: initialValue,
              options: size.options || [],
              fields: size.fields || [],
              itemTemplate: size.itemTemplate || [],
              minItems: size.minItems || 0,
              maxItems: size.maxItems || 10
            };
          }),
        })),
      };

      const updatedSuits = [...form.suits];
      updatedSuits[suitIndex] = newSuit;
      setForm({ ...form, suits: updatedSuits });
    }
  };

  const handleSizeValueChange = (e, suitIndex, itemIndex, sizeIndex, nestedPath = null) => {
    const { value, type, checked } = e.target;
    const updatedSuits = JSON.parse(JSON.stringify(form.suits)); // Deep clone
    const size = updatedSuits[suitIndex].items[itemIndex].sizes[sizeIndex];
    
    if (nestedPath) {
      // Handle nested field changes (for group and array types)
      const { fieldType, fieldIndex, subFieldIndex } = nestedPath;
      
      if (fieldType === 'group') {
        if (type === "checkbox") {
          size.value[fieldIndex].value = checked;
        } else {
          size.value[fieldIndex].value = value;
        }
      } else if (fieldType === 'array') {
        if (type === "checkbox") {
          size.value[fieldIndex][subFieldIndex].value = checked;
        } else {
          size.value[fieldIndex][subFieldIndex].value = value;
        }
      }
    } else {
      // Handle simple field changes
      if (type === "checkbox") {
        size.value = checked;
      } else {
        size.value = value;
      }
    }
    
    setForm({ ...form, suits: updatedSuits });
  };

  const addArrayItem = (suitIndex, itemIndex, sizeIndex) => {
    const updatedSuits = JSON.parse(JSON.stringify(form.suits));
    const size = updatedSuits[suitIndex].items[itemIndex].sizes[sizeIndex];
    
    // Create new item from template
    const newItem = size.itemTemplate.map(field => ({
      name: field.name,
      type: field.type,
      value: field.type === "checkbox" ? false : "",
      options: field.options || []
    }));
    
    if (!Array.isArray(size.value)) {
      size.value = [];
    }
    
    if (size.value.length < (size.maxItems || 10)) {
      size.value.push(newItem);
      setForm({ ...form, suits: updatedSuits });
    }
  };

  const removeArrayItem = (suitIndex, itemIndex, sizeIndex, arrayItemIndex) => {
    const updatedSuits = JSON.parse(JSON.stringify(form.suits));
    const size = updatedSuits[suitIndex].items[itemIndex].sizes[sizeIndex];
    
    if (Array.isArray(size.value) && size.value.length > (size.minItems || 0)) {
      size.value.splice(arrayItemIndex, 1);
      setForm({ ...form, suits: updatedSuits });
    }
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
        rawSpeechInput: form.rawSpeechInput || "",
        suits: (form.suits || []).filter(suit => suit.suitType) // Only include suits with a suitType selected
      };
      
      if (editingId) {
        await api.put(`${API_ENDPOINTS.CUSTOMERS}/${editingId}`, formData);
        setEditingId(null);
      } else {
        await api.post(API_ENDPOINTS.CUSTOMERS, formData);
      }
      setForm({ name: "", phone: "", serialNumber: "", rawSpeechInput: "", suits: [] });
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
      rawSpeechInput: cust.rawSpeechInput || "",
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
    setForm({ name: "", phone: "", serialNumber: "", rawSpeechInput: "", suits: [] });
    setEditingId(null);
    setFormErrors({});
    setFormModal({ isOpen: true });
  };

  const closeFormModal = () => {
    setFormModal({ isOpen: false });
    setForm({ name: "", phone: "", serialNumber: "", rawSpeechInput: "", suits: [] });
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
      await api.delete(`${API_ENDPOINTS.CUSTOMERS}/${deleteModal.id}`);
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

  const handleSpeechDataParsed = async (parsedData) => {
    try {
      // Set customer basic info including raw speech
      setForm(prev => ({
        ...prev,
        name: parsedData.customer.name || prev.name,
        phone: parsedData.customer.phone || prev.phone,
        serialNumber: parsedData.customer.serialNumber || prev.serialNumber,
        rawSpeechInput: parsedData.rawSpeechInput || ""
      }));

      // Process suit details if available
      if (parsedData.suitDetails && parsedData.suitDetails.length > 0) {
        const speechSuit = parsedData.suitDetails[0];
        
        // Find or use first suit type (assuming Shalwar Kameez)
        let suitTypeToUse = suitTypes.find(st => 
          st.name.includes('شلوار') || 
          st.name.toLowerCase().includes('shalwar')
        );
        
        // If no matching suit type, use first available
        if (!suitTypeToUse && suitTypes.length > 0) {
          suitTypeToUse = suitTypes[0];
        }

        if (suitTypeToUse) {
          // Build suit data matching the structure
          const newSuit = {
            suitType: suitTypeToUse._id,
            items: suitTypeToUse.items.map(templateItem => {
              // Find matching item in speech data
              const speechItem = speechSuit.items.find(item => 
                item.itemName === templateItem.name ||
                (item.itemName.includes('شلوار') && templateItem.name.includes('شلوار')) ||
                (item.itemName.includes('قمیض') && templateItem.name.includes('قمیض'))
              );

              return {
                itemName: templateItem.name,
                sizes: templateItem.sizes.map(templateSize => {
                  // Find matching size in speech data
                  const speechSize = speechItem?.sizes.find(size => 
                    size.name === templateSize.name ||
                    size.name.toLowerCase() === templateSize.name.toLowerCase()
                  );

                  return {
                    name: templateSize.name,
                    type: templateSize.type || 'text',
                    value: speechSize ? speechSize.value : (templateSize.type === 'checkbox' ? false : ''),
                    options: templateSize.options || []
                  };
                })
              };
            })
          };

          setForm(prev => ({
            ...prev,
            suits: [newSuit]
          }));
        }
      }

      toast.success('ڈیٹا کامیابی سے لوڈ ہو گیا!');
      setSpeechModal({ isOpen: false });
      setFormModal({ isOpen: true });
    } catch (error) {
      console.error('Error processing speech data:', error);
      toast.error('ڈیٹا لوڈ کرنے میں مسئلہ ہوا');
    }
  };

  const openSpeechModal = () => {
    setSpeechModal({ isOpen: true });
  };

  const closeSpeechModal = () => {
    setSpeechModal({ isOpen: false });
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

      {/* Speech Input Modal */}
      {speechModal.isOpen && (
        <div className="modal-overlay" onClick={closeSpeechModal}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎤 آواز سے گاہک اور ماپ شامل کریں</h2>
              <button className="close-btn" onClick={closeSpeechModal}>✕</button>
            </div>
            <div className="modal-body">
              <SpeechToText
                onDataParsed={handleSpeechDataParsed}
                onError={(error) => toast.error(error)}
              />
            </div>
          </div>
        </div>
      )}

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

                {/* Show raw speech input if it exists */}
                {form.rawSpeechInput && (
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: 'bold', color: '#667eea' }}>
                      🎤 اصل آواز کا متن:
                    </label>
                    <div 
                      style={{ 
                        background: '#f5f7fa', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '2px solid #667eea',
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}
                    >
                      {form.rawSpeechInput}
                    </div>
                  </div>
                )}

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
                              
                              // Group type - nested fields
                              if (sizeType === "group" && size.fields && size.fields.length > 0) {
                                return (
                                  <div key={sizeIndex} className="form-group" style={{ gridColumn: '1 / -1', width: '100%' }}>
                                    <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>{size.name}</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
                                      {size.fields.map((field, fieldIndex) => {
                                        const fieldValue = Array.isArray(size.value) && size.value[fieldIndex] 
                                          ? size.value[fieldIndex] 
                                          : { name: field.name, type: field.type, value: field.type === "checkbox" ? false : "", options: field.options || [] };
                                        
                                        if (field.type === "text") {
                                          return (
                                            <div key={fieldIndex} className="form-group" style={{ marginBottom: 0 }}>
                                              <label style={{ fontSize: '13px' }}>{field.name}</label>
                                              <input
                                                type="text"
                                                value={fieldValue.value || ""}
                                                onChange={(e) =>
                                                  handleSizeValueChange(
                                                    e,
                                                    suitIndex,
                                                    itemIndex,
                                                    sizeIndex,
                                                    { fieldType: 'group', fieldIndex }
                                                  )
                                                }
                                                placeholder={field.name}
                                              />
                                            </div>
                                          );
                                        }
                                        
                                        if (field.type === "checkbox") {
                                          return (
                                            <div key={fieldIndex} className="form-group" style={{ marginBottom: 0 }}>
                                              <label style={{ fontSize: '13px' }}>{field.name}</label>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                                <input
                                                  type="checkbox"
                                                  checked={fieldValue.value === true}
                                                  onChange={(e) =>
                                                    handleSizeValueChange(
                                                      e,
                                                      suitIndex,
                                                      itemIndex,
                                                      sizeIndex,
                                                      { fieldType: 'group', fieldIndex }
                                                    )
                                                  }
                                                  id={`group-checkbox-${suitIndex}-${itemIndex}-${sizeIndex}-${fieldIndex}`}
                                                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                />
                                                <label 
                                                  htmlFor={`group-checkbox-${suitIndex}-${itemIndex}-${sizeIndex}-${fieldIndex}`}
                                                  style={{ cursor: 'pointer', fontSize: '13px', margin: 0 }}
                                                >
                                                  منتخب کریں
                                                </label>
                                              </div>
                                            </div>
                                          );
                                        }
                                        
                                        if (field.type === "dropdown" && field.options && field.options.length > 0) {
                                          return (
                                            <div key={fieldIndex} className="form-group" style={{ marginBottom: 0 }}>
                                              <label style={{ fontSize: '13px' }}>{field.name}</label>
                                              <select
                                                value={fieldValue.value || ""}
                                                onChange={(e) =>
                                                  handleSizeValueChange(
                                                    e,
                                                    suitIndex,
                                                    itemIndex,
                                                    sizeIndex,
                                                    { fieldType: 'group', fieldIndex }
                                                  )
                                                }
                                              >
                                                <option value="">-- منتخب کریں --</option>
                                                {field.options.filter(opt => opt && opt.trim() !== "").map((option, optIndex) => (
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
                                );
                              }
                              
                              // Array type - repeatable fields
                              if (sizeType === "array" && size.itemTemplate && size.itemTemplate.length > 0) {
                                const arrayItems = Array.isArray(size.value) ? size.value : [];
                                
                                return (
                                  <div key={sizeIndex} className="form-group" style={{ gridColumn: '1 / -1', width: '100%' }}>
                                    <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>{size.name}</label>
                                    <div style={{ padding: '15px', background: '#fff4e6', borderRadius: '4px' }}>
                                      {arrayItems.map((arrayItem, arrayItemIndex) => (
                                        <div key={arrayItemIndex} style={{ marginBottom: '15px', padding: '15px', background: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <strong style={{ fontSize: '13px' }}>آئٹم {arrayItemIndex + 1}</strong>
                                            <button
                                              type="button"
                                              onClick={() => removeArrayItem(suitIndex, itemIndex, sizeIndex, arrayItemIndex)}
                                              className="danger"
                                              disabled={arrayItems.length <= (size.minItems || 0)}
                                              style={{ padding: '4px 10px', fontSize: '12px' }}
                                            >
                                              حذف
                                            </button>
                                          </div>
                                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                            {size.itemTemplate.map((field, subFieldIndex) => {
                                              const fieldValue = arrayItem[subFieldIndex] || { value: field.type === "checkbox" ? false : "" };
                                              
                                              if (field.type === "text") {
                                                return (
                                                  <div key={subFieldIndex} className="form-group" style={{ marginBottom: 0 }}>
                                                    <label style={{ fontSize: '12px' }}>{field.name}</label>
                                                    <input
                                                      type="text"
                                                      value={fieldValue.value || ""}
                                                      onChange={(e) =>
                                                        handleSizeValueChange(
                                                          e,
                                                          suitIndex,
                                                          itemIndex,
                                                          sizeIndex,
                                                          { fieldType: 'array', fieldIndex: arrayItemIndex, subFieldIndex }
                                                        )
                                                      }
                                                      placeholder={field.name}
                                                      style={{ fontSize: '13px' }}
                                                    />
                                                  </div>
                                                );
                                              }
                                              
                                              if (field.type === "checkbox") {
                                                return (
                                                  <div key={subFieldIndex} className="form-group" style={{ marginBottom: 0 }}>
                                                    <label style={{ fontSize: '12px' }}>{field.name}</label>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                                      <input
                                                        type="checkbox"
                                                        checked={fieldValue.value === true}
                                                        onChange={(e) =>
                                                          handleSizeValueChange(
                                                            e,
                                                            suitIndex,
                                                            itemIndex,
                                                            sizeIndex,
                                                            { fieldType: 'array', fieldIndex: arrayItemIndex, subFieldIndex }
                                                          )
                                                        }
                                                        id={`array-checkbox-${suitIndex}-${itemIndex}-${sizeIndex}-${arrayItemIndex}-${subFieldIndex}`}
                                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                      />
                                                      <label 
                                                        htmlFor={`array-checkbox-${suitIndex}-${itemIndex}-${sizeIndex}-${arrayItemIndex}-${subFieldIndex}`}
                                                        style={{ cursor: 'pointer', fontSize: '12px', margin: 0 }}
                                                      >
                                                        منتخب کریں
                                                      </label>
                                                    </div>
                                                  </div>
                                                );
                                              }
                                              
                                              if (field.type === "dropdown" && field.options && field.options.length > 0) {
                                                return (
                                                  <div key={subFieldIndex} className="form-group" style={{ marginBottom: 0 }}>
                                                    <label style={{ fontSize: '12px' }}>{field.name}</label>
                                                    <select
                                                      value={fieldValue.value || ""}
                                                      onChange={(e) =>
                                                        handleSizeValueChange(
                                                          e,
                                                          suitIndex,
                                                          itemIndex,
                                                          sizeIndex,
                                                          { fieldType: 'array', fieldIndex: arrayItemIndex, subFieldIndex }
                                                        )
                                                      }
                                                      style={{ fontSize: '13px' }}
                                                    >
                                                      <option value="">-- منتخب کریں --</option>
                                                      {field.options.filter(opt => opt && opt.trim() !== "").map((option, optIndex) => (
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
                                      <button
                                        type="button"
                                        onClick={() => addArrayItem(suitIndex, itemIndex, sizeIndex)}
                                        className="secondary"
                                        disabled={arrayItems.length >= (size.maxItems || 10)}
                                        style={{ padding: '8px 16px', fontSize: '13px', marginTop: '10px' }}
                                      >
                                        + آئٹم شامل کریں
                                      </button>
                                    </div>
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={openSpeechModal}
              className="secondary"
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              🎤 آواز سے شامل کریں
            </button>
            <button 
              onClick={openAddModal}
              className="primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              + نیا گاہک شامل کریں
            </button>
          </div>
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
                    {/* Show raw speech input if available */}
                    {c.rawSpeechInput && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '8px', 
                        background: '#f0f7ff', 
                        borderRadius: '6px',
                        borderRight: '3px solid #667eea',
                        fontSize: '12px'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#667eea' }}>
                          🎤 اصل آواز:
                        </div>
                        <div style={{ opacity: 0.9 }}>
                          {c.rawSpeechInput}
                        </div>
                      </div>
                    )}
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
