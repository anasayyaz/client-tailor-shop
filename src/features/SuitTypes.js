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
  const [form, setForm] = useState({
    name: "",
    items: [{ name: "", sizes: [{ name: "" }] }],
  });
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
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
    const { name, value } = e.target;
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
    }

    setForm(updatedForm);
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { name: "", sizes: [{ name: "" }] }],
    });
  };

  const addSize = (itemIndex) => {
    const newItems = [...form.items];
    newItems[itemIndex].sizes.push({ name: "" });
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
      if (editingId) {
        await axios.put(`${API_ENDPOINTS.SUIT_TYPES}/${editingId}`, form);
        setEditingId(null);
      } else {
        await axios.post(API_ENDPOINTS.SUIT_TYPES, form);
      }
      setForm({
        name: "",
        items: [{ name: "", sizes: [{ name: "" }] }],
      });
      setFormErrors({});
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
    setForm(st);
    setEditingId(st._id);
    setFormErrors({});
  };

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

  const resetForm = () => {
    setForm({
      name: "",
      items: [{ name: "", sizes: [{ name: "" }] }],
    });
    setEditingId(null);
    setFormErrors({});
  };

  return (
    <div dir="rtl" style={{ direction: 'rtl', textAlign: 'right' }}>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="سوٹ کی قسم حذف کریں"
        message="کیا آپ واقعی اس سوٹ کی قسم کو حذف کرنا چاہتے ہیں؟"
        confirmText="حذف کریں"
        cancelText="منسوخ کریں"
      />
      <h2 style={{ direction: 'rtl', textAlign: 'right' }}>سوٹ کی اقسام کا انتظام</h2>
      
      <div className="card">
        <h3>{editingId ? "سوٹ کی قسم میں ترمیم" : "نیا سوٹ کی قسم شامل کریں"}</h3>
        
        <form onSubmit={handleSubmit}>
          {formErrors.submit && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              {formErrors.submit}
            </div>
          )}
          <ValidatedInput
            fieldType="suitTypeName"
            name="typeName"
            value={form.name}
            onChange={handleFormChange}
            placeholder="سوٹ کی قسم کا نام درج کریں"
            label="سوٹ کی قسم کا نام"
            required
          />

          <div className="form-section">
            <div className="flex gap-10 mb-20">
              <button type="button" onClick={addItem} className="primary">
                + آئٹم شامل کریں
              </button>
            </div>

            {form.items.map((item, i) => (
              <div key={i} className="suit-type-card">
                <div className="flex gap-10 mb-20">
                  <ValidatedInput
                    fieldType="itemName"
                    name="itemName"
                    value={item.name}
                    onChange={(e) => handleFormChange(e, i)}
                    placeholder="آئٹم کا نام درج کریں"
                    label={`آئٹم ${i + 1} کا نام`}
                    required
                    style={{ flex: 1 }}
                  />
                  
                  <button 
                    type="button" 
                    onClick={() => removeItem(i)}
                    className="danger"
                    style={{ alignSelf: 'end', marginTop: '25px' }}
                    disabled={form.items.length === 1}
                  >
                    آئٹم حذف کریں
                  </button>
                </div>

                <div className="form-section">
                  <div className="flex gap-10 mb-20">
                    <button 
                      type="button" 
                      onClick={() => addSize(i)} 
                      className="secondary"
                    >
                      + سائز شامل کریں
                    </button>
                  </div>

                  <div className="form-row">
                    {item.sizes.map((size, j) => (
                      <div key={j} className="form-group">
                        <ValidatedInput
                          fieldType="sizeName"
                          name="sizeName"
                          value={size.name}
                          onChange={(e) => handleFormChange(e, i, j)}
                          placeholder="سائز کا نام درج کریں"
                          label={`سائز ${j + 1}`}
                          required
                          style={{ flex: 1 }}
                        />
                        <button 
                          type="button" 
                          onClick={() => removeSize(i, j)}
                          className="danger"
                          disabled={item.sizes.length === 1}
                          style={{ padding: '12px 16px', marginTop: '25px' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="action-buttons">
              <button type="submit" className="primary">
                {editingId ? "تبدیلیاں محفوظ کریں" : "سوٹ کی قسم شامل کریں"}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="secondary"
                >
                  منسوخ کریں
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>موجودہ سوٹ کی اقسام</h3>
        
        {loading && suitTypes.length === 0 ? (
          <div className="text-center p-20">
            <p>لوڈ ہو رہا ہے...</p>
          </div>
        ) : suitTypes.length === 0 ? (
          <div className="text-center p-20">
            <p>کوئی سوٹ کی قسم نہیں ملی</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>نام</th>
                <th>آئٹمز اور سائز</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {suitTypes.map((suit) => (
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
                          {item.sizes.map((s, j) => (
                            <span key={j} className="status-badge status-completed" style={{ marginLeft: '5px' }}>
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleEdit(suit)}
                        className="secondary"
                      >
                        ترمیم
                      </button>
                      <button 
                        onClick={() => handleDelete(suit._id)}
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
        )}
      </div>
    </div>
  );
}

export default SuitTypes;
