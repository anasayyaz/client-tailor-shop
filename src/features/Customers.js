import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ValidatedInput from "../components/ValidatedInput";
import ConfirmModal from "../components/ConfirmModal";
import { validateForm, validationOptions } from "../utils/validation";
import { API_ENDPOINTS } from "../config/api";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [suitTypes, setSuitTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    serialNumber: "",
    suits: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

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
    } catch (err) {
      console.error("Error fetching suit types:", err);
      setSuitTypes([]);
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
            value: "",
          })),
        })),
      };

      const updatedSuits = [...form.suits];
      updatedSuits[suitIndex] = newSuit;
      setForm({ ...form, suits: updatedSuits });
    }
  };

  const handleSizeValueChange = (e, suitIndex, itemIndex, sizeIndex) => {
    const { value } = e.target;
    const updatedSuits = [...form.suits];
    updatedSuits[suitIndex].items[itemIndex].sizes[sizeIndex].value = value;
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
      if (editingId) {
        await axios.put(`${API_ENDPOINTS.CUSTOMERS}/${editingId}`, form);
        setEditingId(null);
      } else {
        await axios.post(API_ENDPOINTS.CUSTOMERS, form);
      }
      setForm({ name: "", phone: "", serialNumber: "", suits: [] });
      setFormErrors({});
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

  const handleEdit = (cust) => {
    setForm(cust);
    setEditingId(cust._id);
    setFormErrors({});
  };

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
      <h2 style={{ direction: 'rtl', textAlign: 'right' }}>گاہک کا انتظام</h2>

      <div className="card">
        <h3>{editingId ? "گاہک کی معلومات میں ترمیم" : "نیا گاہک شامل کریں"}</h3>
        
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
                      {item.sizes.map((size, sizeIndex) => (
                        <ValidatedInput
                          key={sizeIndex}
                          fieldType="sizeValue"
                          type="number"
                          value={size.value}
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
                          min="0"
                          max="999"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div className="action-buttons">
              <button type="submit" className="primary">
                {editingId ? "تبدیلیاں محفوظ کریں" : "گاہک شامل کریں"}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingId(null);
                    setForm({ name: "", phone: "", serialNumber: "", suits: [] });
                    setFormErrors({});
                  }}
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
        <h3>گاہکوں کی فہرست</h3>
        
        {loading && customers.length === 0 ? (
          <div className="text-center p-20">
            <p>لوڈ ہو رہا ہے...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center p-20">
            <p>کوئی گاہک نہیں ملا</p>
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
              {customers.map((c) => (
                <tr key={c._id}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td>{c.serialNumber || "-"}</td>
                  <td>{c.phone}</td>
                  <td>
                    {c.suits.map((s, i) => (
                      <div key={i} className="mb-20">
                        <div className="status-badge status-pending">
                          {suitTypes.find((st) => st._id === s.suitType)?.name}
                        </div>
                        {s.items.map((it, j) => (
                          <div key={j} style={{ marginTop: '8px', fontSize: '13px' }}>
                            <strong>{it.itemName}:</strong>{" "}
                            {it.sizes
                              .filter(sz => sz.value)
                              .map((sz) => `${sz.name}: ${sz.value}`)
                              .join(", ")}
                          </div>
                        ))}
                      </div>
                    ))}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleEdit(c)}
                        className="secondary"
                      >
                        ترمیم
                      </button>
                      <button 
                        onClick={() => handleDelete(c._id)}
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

export default Customers;
