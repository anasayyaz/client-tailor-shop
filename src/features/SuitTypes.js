import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ValidatedInput from "../components/ValidatedInput";
import ConfirmModal from "../components/ConfirmModal";
import { validateForm, validateField, validationOptions } from "../utils/validation";
import { API_ENDPOINTS, api } from "../config/api";

function SuitTypes() {
  const [suitTypes, setSuitTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const getEmptySize = () => ({
    name: "",
    sizeType: "",
    value: "",
    options: [],
    fields: [], // For group type
    itemTemplate: [], // For array type
    minItems: 0,
    maxItems: 10
  });
  
  const [form, setForm] = useState({
    name: "",
    items: [{ name: "", sizes: [getEmptySize()] }],
  });
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [formModal, setFormModal] = useState({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const fetchSuitTypes = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.SUIT_TYPES);
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

  const handleFormChange = (e, itemIndex, sizeIndex, nestedFieldIndex = null) => {
    const { name, value, type, checked } = e.target;
    const updatedForm = JSON.parse(JSON.stringify(form)); // Deep clone

    if (name === "typeName") {
      updatedForm.name = value;
      if (formErrors.typeName) {
        setFormErrors(prev => ({ ...prev, typeName: "" }));
      }
    } else if (name === "itemName") {
      updatedForm.items[itemIndex].name = value;
      if (formErrors[`itemName_${itemIndex}`]) {
        setFormErrors(prev => ({ ...prev, [`itemName_${itemIndex}`]: "" }));
      }
    } else if (name === "sizeName") {
      updatedForm.items[itemIndex].sizes[sizeIndex].name = value;
      if (formErrors[`sizeName_${itemIndex}_${sizeIndex}`]) {
        setFormErrors(prev => ({ ...prev, [`sizeName_${itemIndex}_${sizeIndex}`]: "" }));
      }
    } else if (name === "sizeType") {
      const size = updatedForm.items[itemIndex].sizes[sizeIndex];
      if (!size.sizeType) {
        size.sizeType = value;
        size.value = "";
        if (value === "dropdown") {
          size.options = [""];
        } else if (value === "group") {
          size.fields = [{ name: "", type: "text", value: "", options: [] }];
        } else if (value === "array") {
          size.itemTemplate = [{ name: "", type: "text", value: "", options: [] }];
          size.minItems = 0;
          size.maxItems = 10;
        } else {
          size.options = [];
          size.fields = [];
          size.itemTemplate = [];
        }
      }
    } else if (name === "dropdownOption") {
      const optionIndex = parseInt(e.target.dataset.optionIndex);
      updatedForm.items[itemIndex].sizes[sizeIndex].options[optionIndex] = value;
    } else if (name === "groupFieldName") {
      updatedForm.items[itemIndex].sizes[sizeIndex].fields[nestedFieldIndex].name = value;
    } else if (name === "groupFieldType") {
      const field = updatedForm.items[itemIndex].sizes[sizeIndex].fields[nestedFieldIndex];
      field.type = value;
      field.value = value === "checkbox" ? false : "";
      field.options = value === "dropdown" ? [""] : [];
    } else if (name === "groupFieldOption") {
      const optionIndex = parseInt(e.target.dataset.optionIndex);
      updatedForm.items[itemIndex].sizes[sizeIndex].fields[nestedFieldIndex].options[optionIndex] = value;
    } else if (name === "templateFieldName") {
      updatedForm.items[itemIndex].sizes[sizeIndex].itemTemplate[nestedFieldIndex].name = value;
    } else if (name === "templateFieldType") {
      const field = updatedForm.items[itemIndex].sizes[sizeIndex].itemTemplate[nestedFieldIndex];
      field.type = value;
      field.value = value === "checkbox" ? false : "";
      field.options = value === "dropdown" ? [""] : [];
    } else if (name === "templateFieldOption") {
      const optionIndex = parseInt(e.target.dataset.optionIndex);
      updatedForm.items[itemIndex].sizes[sizeIndex].itemTemplate[nestedFieldIndex].options[optionIndex] = value;
    } else if (name === "minItems") {
      updatedForm.items[itemIndex].sizes[sizeIndex].minItems = parseInt(value) || 0;
    } else if (name === "maxItems") {
      updatedForm.items[itemIndex].sizes[sizeIndex].maxItems = parseInt(value) || 10;
    }

    setForm(updatedForm);
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { name: "", sizes: [getEmptySize()] }],
    });
  };

  const addSize = (itemIndex) => {
    const newItems = [...form.items];
    newItems[itemIndex].sizes.push(getEmptySize());
    setForm({ ...form, items: newItems });
  };

  const addDropdownOption = (itemIndex, sizeIndex) => {
    const newForm = JSON.parse(JSON.stringify(form));
    newForm.items[itemIndex].sizes[sizeIndex].options.push("");
    setForm(newForm);
  };

  const removeDropdownOption = (itemIndex, sizeIndex, optionIndex) => {
    const newForm = JSON.parse(JSON.stringify(form));
    newForm.items[itemIndex].sizes[sizeIndex].options = 
      newForm.items[itemIndex].sizes[sizeIndex].options.filter((_, index) => index !== optionIndex);
    setForm(newForm);
  };

  const addGroupField = (itemIndex, sizeIndex) => {
    const newForm = JSON.parse(JSON.stringify(form));
    newForm.items[itemIndex].sizes[sizeIndex].fields.push({
      name: "",
      type: "text",
      value: "",
      options: []
    });
    setForm(newForm);
  };

  const removeGroupField = (itemIndex, sizeIndex, fieldIndex) => {
    const newForm = JSON.parse(JSON.stringify(form));
    newForm.items[itemIndex].sizes[sizeIndex].fields = 
      newForm.items[itemIndex].sizes[sizeIndex].fields.filter((_, index) => index !== fieldIndex);
    setForm(newForm);
  };

  const addGroupFieldOption = (itemIndex, sizeIndex, fieldIndex) => {
    const newForm = JSON.parse(JSON.stringify(form));
    newForm.items[itemIndex].sizes[sizeIndex].fields[fieldIndex].options.push("");
    setForm(newForm);
  };

  const removeGroupFieldOption = (itemIndex, sizeIndex, fieldIndex, optionIndex) => {
    const newForm = JSON.parse(JSON.stringify(form));
    newForm.items[itemIndex].sizes[sizeIndex].fields[fieldIndex].options = 
      newForm.items[itemIndex].sizes[sizeIndex].fields[fieldIndex].options.filter((_, index) => index !== optionIndex);
    setForm(newForm);
  };

  const addTemplateField = (itemIndex, sizeIndex) => {
    const newForm = JSON.parse(JSON.stringify(form));
    newForm.items[itemIndex].sizes[sizeIndex].itemTemplate.push({
      name: "",
      type: "text",
      value: "",
      options: []
    });
    setForm(newForm);
  };

  const removeTemplateField = (itemIndex, sizeIndex, fieldIndex) => {
    const newForm = JSON.parse(JSON.stringify(form));
    newForm.items[itemIndex].sizes[sizeIndex].itemTemplate = 
      newForm.items[itemIndex].sizes[sizeIndex].itemTemplate.filter((_, index) => index !== fieldIndex);
    setForm(newForm);
  };

  const addTemplateFieldOption = (itemIndex, sizeIndex, fieldIndex) => {
    const newForm = JSON.parse(JSON.stringify(form));
    newForm.items[itemIndex].sizes[sizeIndex].itemTemplate[fieldIndex].options.push("");
    setForm(newForm);
  };

  const removeTemplateFieldOption = (itemIndex, sizeIndex, fieldIndex, optionIndex) => {
    const newForm = JSON.parse(JSON.stringify(form));
    newForm.items[itemIndex].sizes[sizeIndex].itemTemplate[fieldIndex].options = 
      newForm.items[itemIndex].sizes[sizeIndex].itemTemplate[fieldIndex].options.filter((_, index) => index !== optionIndex);
    setForm(newForm);
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

    const nameValidation = validateField(form.name, 'suitTypeName', validationOptions.suitTypeName);
    if (!nameValidation.isValid) {
      errors.typeName = nameValidation.message;
      isValid = false;
    }

    form.items.forEach((item, itemIndex) => {
      const itemNameValidation = validateField(item.name, 'itemName', validationOptions.itemName);
      if (!itemNameValidation.isValid) {
        errors[`itemName_${itemIndex}`] = itemNameValidation.message;
        isValid = false;
      }

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
      
      const formData = {
        name: form.name,
        items: form.items.map(item => ({
          name: item.name,
          sizes: item.sizes.map(size => {
            const sizeData = {
              name: size.name,
              type: size.sizeType || "text"
            };
            
            if (size.sizeType === "dropdown") {
              sizeData.options = size.options.filter(opt => opt && opt.trim() !== "");
              sizeData.value = "";
            } else if (size.sizeType === "group") {
              sizeData.fields = size.fields.map(field => ({
                name: field.name,
                type: field.type,
                value: field.type === "checkbox" ? false : "",
                options: field.type === "dropdown" ? field.options.filter(opt => opt && opt.trim() !== "") : []
              }));
            } else if (size.sizeType === "array") {
              sizeData.itemTemplate = size.itemTemplate.map(field => ({
                name: field.name,
                type: field.type,
                value: field.type === "checkbox" ? false : "",
                options: field.type === "dropdown" ? field.options.filter(opt => opt && opt.trim() !== "") : []
              }));
              sizeData.minItems = size.minItems || 0;
              sizeData.maxItems = size.maxItems || 10;
            } else if (size.sizeType === "checkbox") {
              sizeData.value = false;
            } else {
              sizeData.value = "";
            }
            
            return sizeData;
          })
        }))
      };
      
      if (editingId) {
        await api.put(`${API_ENDPOINTS.SUIT_TYPES}/${editingId}`, formData);
        setEditingId(null);
      } else {
        await api.post(API_ENDPOINTS.SUIT_TYPES, formData);
      }
      
      setForm({
        name: "",
        items: [{ name: "", sizes: [getEmptySize()] }],
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
    setForm({
      name: st.name || "",
      items: st.items ? st.items.map(item => ({
        name: item.name || "",
        sizes: item.sizes ? item.sizes.map(size => ({
          name: size.name || "",
          sizeType: size.type || "",
          value: size.value !== undefined && size.value !== null ? size.value : "",
          options: size.options || [],
          fields: size.fields ? size.fields.map(field => ({
            name: field.name || "",
            type: field.type || "text",
            value: field.value !== undefined && field.value !== null ? field.value : "",
            options: field.options || []
          })) : [],
          itemTemplate: size.itemTemplate ? size.itemTemplate.map(field => ({
            name: field.name || "",
            type: field.type || "text",
            value: field.value !== undefined && field.value !== null ? field.value : "",
            options: field.options || []
          })) : [],
          minItems: size.minItems || 0,
          maxItems: size.maxItems || 10
        })) : [getEmptySize()]
      })) : [{ name: "", sizes: [getEmptySize()] }]
    });
    setEditingId(st._id);
    setFormErrors({});
    setFormModal({ isOpen: true });
  };

  const openAddModal = () => {
    setForm({
      name: "",
      items: [{ name: "", sizes: [getEmptySize()] }],
    });
    setEditingId(null);
    setFormErrors({});
    setFormModal({ isOpen: true });
  };

  const closeFormModal = () => {
    setFormModal({ isOpen: false });
    setForm({
      name: "",
      items: [{ name: "", sizes: [getEmptySize()] }],
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
      await api.delete(`${API_ENDPOINTS.SUIT_TYPES}/${deleteModal.id}`);
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

  const renderSizeFieldEditor = (size, itemIndex, sizeIndex) => {
    return (
      <div key={sizeIndex} className="suit-type-card" style={{ marginBottom: '10px', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
            <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>سائز {sizeIndex + 1}</label>
            <input
              type="text"
              name="sizeName"
              value={size.name}
              onChange={(e) => handleFormChange(e, itemIndex, sizeIndex)}
              placeholder="نام"
              required
              style={{ width: '100%', padding: '6px 8px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          {!size.sizeType && (
            <div style={{ flex: '0 1 140px', minWidth: '140px' }}>
              <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>قسم *</label>
              <select
                name="sizeType"
                value={size.sizeType || ""}
                onChange={(e) => handleFormChange(e, itemIndex, sizeIndex)}
                required
                style={{ width: '100%', padding: '6px 8px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">-- منتخب کریں --</option>
                <option value="text">ٹیکسٹ</option>
                <option value="checkbox">چیک باکس</option>
                <option value="dropdown">ڈراپ ڈاؤن</option>
                <option value="group">گروپ (متعدد فیلڈز)</option>
                <option value="array">اریے (تکرار فیلڈز)</option>
              </select>
            </div>
          )}
          <button 
            type="button" 
            onClick={() => removeSize(itemIndex, sizeIndex)}
            className="danger"
            disabled={form.items[itemIndex].sizes.length === 1}
            style={{ padding: '6px 10px', marginTop: '20px', flex: '0 0 auto', minWidth: '35px', fontSize: '16px', lineHeight: '1' }}
            title="حذف کریں"
          >
            ×
          </button>
        </div>
        
        {!size.sizeType && (
          <div style={{ padding: '6px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', marginBottom: '8px', fontSize: '11px', color: '#856404' }}>
            ⚠️ قسم منتخب کریں
          </div>
        )}

        {size.sizeType === 'dropdown' && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>ڈراپ ڈاؤن آپشنز:</label>
            {size.options.map((option, optIdx) => (
              <div key={optIdx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                <input
                  type="text"
                  name="dropdownOption"
                  data-option-index={optIdx}
                  value={option}
                  onChange={(e) => handleFormChange(e, itemIndex, sizeIndex)}
                  placeholder={`آپشن ${optIdx + 1}`}
                  style={{ flex: 1, padding: '5px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <button
                  type="button"
                  onClick={() => removeDropdownOption(itemIndex, sizeIndex, optIdx)}
                  className="danger"
                  disabled={size.options.length === 1}
                  style={{ padding: '5px 10px', fontSize: '14px' }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addDropdownOption(itemIndex, sizeIndex)}
              className="secondary"
              style={{ padding: '5px 10px', fontSize: '12px', marginTop: '5px' }}
            >
              + آپشن شامل کریں
            </button>
          </div>
        )}

        {size.sizeType === 'group' && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#e7f3ff', borderRadius: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>گروپ فیلڈز:</label>
            {size.fields && size.fields.map((field, fieldIdx) => (
              <div key={fieldIdx} style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '4px', border: '1px solid #ccc' }}>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 100px' }}>
                    <input
                      type="text"
                      name="groupFieldName"
                      value={field.name}
                      onChange={(e) => handleFormChange(e, itemIndex, sizeIndex, fieldIdx)}
                      placeholder="فیلڈ کا نام"
                      style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ flex: '0 1 100px' }}>
                    <select
                      name="groupFieldType"
                      value={field.type}
                      onChange={(e) => handleFormChange(e, itemIndex, sizeIndex, fieldIdx)}
                      style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="text">ٹیکسٹ</option>
                      <option value="checkbox">چیک باکس</option>
                      <option value="dropdown">ڈراپ ڈاؤن</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGroupField(itemIndex, sizeIndex, fieldIdx)}
                    className="danger"
                    disabled={size.fields.length === 1}
                    style={{ padding: '5px 10px', fontSize: '14px', flex: '0 0 auto' }}
                  >
                    ×
                  </button>
                </div>
                {field.type === 'dropdown' && (
                  <div style={{ marginTop: '5px', paddingLeft: '10px' }}>
                    {field.options.map((opt, optIdx) => (
                      <div key={optIdx} style={{ display: 'flex', gap: '5px', marginBottom: '3px' }}>
                        <input
                          type="text"
                          name="groupFieldOption"
                          data-option-index={optIdx}
                          value={opt}
                          onChange={(e) => handleFormChange(e, itemIndex, sizeIndex, fieldIdx)}
                          placeholder={`آپشن ${optIdx + 1}`}
                          style={{ flex: 1, padding: '4px', fontSize: '11px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeGroupFieldOption(itemIndex, sizeIndex, fieldIdx, optIdx)}
                          className="danger"
                          disabled={field.options.length === 1}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addGroupFieldOption(itemIndex, sizeIndex, fieldIdx)}
                      className="secondary"
                      style={{ padding: '3px 8px', fontSize: '11px', marginTop: '3px' }}
                    >
                      + آپشن
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addGroupField(itemIndex, sizeIndex)}
              className="secondary"
              style={{ padding: '5px 10px', fontSize: '12px', marginTop: '5px' }}
            >
              + فیلڈ شامل کریں
            </button>
          </div>
        )}

        {size.sizeType === 'array' && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#fff4e6', borderRadius: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>اریے ٹیمپلیٹ فیلڈز:</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px' }}>کم از کم:</label>
                <input
                  type="number"
                  name="minItems"
                  value={size.minItems}
                  onChange={(e) => handleFormChange(e, itemIndex, sizeIndex)}
                  min="0"
                  style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px' }}>زیادہ سے زیادہ:</label>
                <input
                  type="number"
                  name="maxItems"
                  value={size.maxItems}
                  onChange={(e) => handleFormChange(e, itemIndex, sizeIndex)}
                  min="1"
                  style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            {size.itemTemplate && size.itemTemplate.map((field, fieldIdx) => (
              <div key={fieldIdx} style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '4px', border: '1px solid #ccc' }}>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 100px' }}>
                    <input
                      type="text"
                      name="templateFieldName"
                      value={field.name}
                      onChange={(e) => handleFormChange(e, itemIndex, sizeIndex, fieldIdx)}
                      placeholder="فیلڈ کا نام"
                      style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ flex: '0 1 100px' }}>
                    <select
                      name="templateFieldType"
                      value={field.type}
                      onChange={(e) => handleFormChange(e, itemIndex, sizeIndex, fieldIdx)}
                      style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="text">ٹیکسٹ</option>
                      <option value="checkbox">چیک باکس</option>
                      <option value="dropdown">ڈراپ ڈاؤن</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTemplateField(itemIndex, sizeIndex, fieldIdx)}
                    className="danger"
                    disabled={size.itemTemplate.length === 1}
                    style={{ padding: '5px 10px', fontSize: '14px', flex: '0 0 auto' }}
                  >
                    ×
                  </button>
                </div>
                {field.type === 'dropdown' && (
                  <div style={{ marginTop: '5px', paddingLeft: '10px' }}>
                    {field.options.map((opt, optIdx) => (
                      <div key={optIdx} style={{ display: 'flex', gap: '5px', marginBottom: '3px' }}>
                        <input
                          type="text"
                          name="templateFieldOption"
                          data-option-index={optIdx}
                          value={opt}
                          onChange={(e) => handleFormChange(e, itemIndex, sizeIndex, fieldIdx)}
                          placeholder={`آپشن ${optIdx + 1}`}
                          style={{ flex: 1, padding: '4px', fontSize: '11px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeTemplateFieldOption(itemIndex, sizeIndex, fieldIdx, optIdx)}
                          className="danger"
                          disabled={field.options.length === 1}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addTemplateFieldOption(itemIndex, sizeIndex, fieldIdx)}
                      className="secondary"
                      style={{ padding: '3px 8px', fontSize: '11px', marginTop: '3px' }}
                    >
                      + آپشن
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addTemplateField(itemIndex, sizeIndex)}
              className="secondary"
              style={{ padding: '5px 10px', fontSize: '12px', marginTop: '5px' }}
            >
              + فیلڈ شامل کریں
            </button>
          </div>
        )}
      </div>
    );
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
        }
        
        @media (max-width: 480px) {
          .table-wrapper table td > div {
            flex-direction: column !important;
          }
          .table-wrapper table td > div > div {
            width: 100% !important;
            min-width: 100% !important;
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

      {formModal.isOpen && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
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
                            style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px' }}
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeItem(i)}
                          className="danger"
                          style={{ alignSelf: 'flex-end', marginTop: '24px', whiteSpace: 'nowrap', padding: '8px 12px', fontSize: '13px' }}
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
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          + سائز شامل کریں
                        </button>
                      </div>

                      <div className="form-row" style={{ gap: '10px' }}>
                        {item.sizes.map((size, j) => renderSizeFieldEditor(size, i, j))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="action-buttons">
                  <button type="submit" className="primary">
                    {editingId ? "تبدیلیاں محفوظ کریں" : "سوٹ کی قسم شامل کریں"}
                  </button>
                  <button type="button" onClick={closeFormModal} className="secondary">
                    منسوخ کریں
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <h2 style={{ direction: 'rtl', textAlign: 'right' }}>سوٹ کی اقسام کا انتظام</h2>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="سوٹ کی قسم کے نام سے تلاش کریں..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <button onClick={openAddModal} className="primary" style={{ whiteSpace: 'nowrap' }}>
            + نیا سوٹ کی قسم شامل کریں
          </button>
        </div>
      </div>

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
                    <td><strong>{suit.name}</strong></td>
                    <td>
                      {suit.items.map((item, i) => (
                        <div key={i} style={{ marginBottom: '20px' }}>
                          <div className="status-badge status-pending" style={{ marginBottom: '10px' }}>{item.name}</div>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '8px',
                            fontSize: '12px' 
                          }}>
                            {item.sizes.map((s, j) => {
                              let typeLabel = '';
                              let details = '';
                              
                              if (s.type === 'text') {
                                typeLabel = 'ٹیکسٹ';
                              } else if (s.type === 'checkbox') {
                                typeLabel = 'چیک باکس';
                              } else if (s.type === 'dropdown') {
                                typeLabel = 'ڈراپ ڈاؤن';
                                details = s.options && s.options.length > 0 
                                  ? ` (${s.options.filter(opt => opt).join(', ')})` 
                                  : '';
                              } else if (s.type === 'group') {
                                typeLabel = 'گروپ';
                                details = s.fields && s.fields.length > 0
                                  ? ` (${s.fields.map(f => `${f.name}`).join(', ')})`
                                  : '';
                              } else if (s.type === 'array') {
                                typeLabel = 'اریے';
                                details = s.itemTemplate && s.itemTemplate.length > 0
                                  ? ` (${s.itemTemplate.map(f => `${f.name}`).join(', ')})`
                                  : '';
                              }
                              
                              return (
                                <div 
                                  key={j} 
                                  style={{ 
                                    background: '#e8f5e9',
                                    border: '1px solid #4caf50',
                                    borderRadius: '6px',
                                    padding: '8px 12px',
                                    flex: '0 1 auto',
                                    minWidth: '120px',
                                    maxWidth: '100%'
                                  }}
                                >
                                  <div style={{ 
                                    fontWeight: '600', 
                                    color: '#2e7d32',
                                    marginBottom: '4px',
                                    fontSize: '13px'
                                  }}>
                                    {s.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: '11px', 
                                    color: '#555',
                                    fontWeight: '500'
                                  }}>
                                    {typeLabel}
                                  </div>
                                  {details && (
                                    <div style={{ 
                                      fontSize: '10px', 
                                      color: '#666',
                                      marginTop: '4px',
                                      fontStyle: 'italic',
                                      wordBreak: 'break-word'
                                    }}>
                                      {details}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEdit(suit)} className="secondary" title="ترمیم" style={{ fontSize: '18px', padding: '8px 12px' }}>
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(suit._id)} className="danger" title="حذف" style={{ fontSize: '18px', padding: '8px 12px' }}>
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
