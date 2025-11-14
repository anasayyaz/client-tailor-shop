import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ValidatedInput from "../components/ValidatedInput";
import ConfirmModal from "../components/ConfirmModal";
import { validateForm, validateField, validationOptions } from "../utils/validation";
import { API_ENDPOINTS } from "../config/api";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", cnic: "" });
  const [formErrors, setFormErrors] = useState({});
  const [expenseForm, setExpenseForm] = useState({
    employeeId: "",
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [expenseFormErrors, setExpenseFormErrors] = useState({});
  const [selectedEmployeeForOrders, setSelectedEmployeeForOrders] = useState("");
  const [orderFilter, setOrderFilter] = useState({ startDate: "", endDate: "" });
  const [allOrders, setAllOrders] = useState([]);
  const [filter, setFilter] = useState({ startDate: "", endDate: "", search: "" });
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchEmployees();
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.ORDERS);
      setAllOrders(res.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setAllOrders([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_ENDPOINTS.EMPLOYEES);
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm({ ...expenseForm, [name]: value });
    
    // Clear error when user starts typing
    if (expenseFormErrors[name]) {
      setExpenseFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
  };

  const validateEmployeeForm = () => {
    const fieldsToValidate = [
      { name: 'name', type: 'employeeName' },
      { name: 'phone', type: 'phone' },
      { name: 'cnic', type: 'serialNumber' }
    ];

    const validation = validateForm(form, fieldsToValidate);
    setFormErrors(validation.errors);
    return validation.isValid;
  };

  const validateExpenseForm = () => {
    const errors = {};
    let isValid = true;

    // Validate employee selection
    if (!expenseForm.employeeId) {
      errors.employeeId = "براہ کرم ملازم منتخب کریں";
      isValid = false;
    }

    // Validate amount
    const amountValidation = validateField(expenseForm.amount, 'expenseAmount', validationOptions.expenseAmount);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.message;
      isValid = false;
    }

    // Validate description
    const descriptionValidation = validateField(expenseForm.description, 'expenseDescription', validationOptions.expenseDescription);
    if (!descriptionValidation.isValid) {
      errors.description = descriptionValidation.message;
      isValid = false;
    }

    setExpenseFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmployeeForm()) {
      return;
    }

    try {
      setLoading(true);
      const isEditing = !!editingId;
      if (editingId) {
        await axios.put(`${API_ENDPOINTS.EMPLOYEES}/${editingId}`, form);
        setEditingId(null);
      } else {
        await axios.post(API_ENDPOINTS.EMPLOYEES, form);
      }
      setForm({ name: "", phone: "", cnic: "" });
      setFormErrors({});
      await fetchEmployees();
      toast.success(isEditing ? "ملازم کی معلومات کامیابی سے اپ ڈیٹ ہو گئیں" : "ملازم کامیابی سے شامل ہو گیا");
    } catch (error) {
      console.error("Error saving employee:", error);
      const errorMessage = error.response?.data?.message || "ملازم کو محفوظ کرنے میں مسئلہ ہوا ہے۔ براہ کرم دوبارہ کوشش کریں۔";
      setFormErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (emp) => {
    setForm({ name: emp.name, phone: emp.phone, cnic: emp.cnic });
    setEditingId(emp._id);
    setFormErrors({});
  };

  const handleDelete = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_ENDPOINTS.EMPLOYEES}/${deleteModal.id}`);
      await fetchEmployees();
      toast.success("ملازم کامیابی سے حذف ہو گیا");
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("ملازم کو حذف کرنے میں مسئلہ ہوا ہے۔ براہ کرم دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    
    if (!validateExpenseForm()) {
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_ENDPOINTS.EMPLOYEES}/${expenseForm.employeeId}/expense`, {
        amount: Number(expenseForm.amount),
        description: expenseForm.description,
        date: expenseForm.date,
      });
      setExpenseForm({
        employeeId: "",
        amount: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
      });
      setExpenseFormErrors({});
      await fetchEmployees();
      toast.success("خرچ کامیابی سے شامل ہو گیا");
    } catch (error) {
      console.error("Error adding expense:", error);
      const errorMessage = error.response?.data?.message || "خرچ شامل کرنے میں مسئلہ ہوا ہے۔ براہ کرم دوبارہ کوشش کریں۔";
      setExpenseFormErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = (expenses) => {
    if (!filter.startDate || !filter.endDate) return expenses;
    const start = new Date(filter.startDate);
    const end = new Date(filter.endDate);
    return expenses.filter((ex) => {
      const exDate = new Date(ex.date);
      return exDate >= start && exDate <= end;
    });
  };

  const filterOrders = () => {
    if (!selectedEmployeeForOrders) return [];
    return allOrders.filter((order) => {
      if (!order.assignedEmployee || order.assignedEmployee._id !== selectedEmployeeForOrders)
        return false;
      const orderDateStr = new Date(order.orderDate).toISOString().slice(0, 10);
      const startDateStr = orderFilter.startDate;
      const endDateStr = orderFilter.endDate;
      return (
        (!startDateStr || orderDateStr >= startDateStr) &&
        (!endDateStr || orderDateStr <= endDateStr)
      );
    });
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      e.phone.includes(filter.search)
  );

  return (
    <div dir="rtl" style={{ direction: 'rtl', textAlign: 'right' }}>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="ملازم حذف کریں"
        message="کیا آپ واقعی اس ملازم کو حذف کرنا چاہتے ہیں؟"
        confirmText="حذف کریں"
        cancelText="منسوخ کریں"
      />
      <h2 style={{ direction: 'rtl', textAlign: 'right' }}>ملازمین کا انتظام</h2>

      <div className="card">
        <h3>{editingId ? "ملازم میں ترمیم کریں" : "نیا ملازم شامل کریں"}</h3>
        
        <form onSubmit={handleSubmit}>
          {formErrors.submit && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              {formErrors.submit}
            </div>
          )}
          <div className="form-row">
            <ValidatedInput
              fieldType="employeeName"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="ملازم کا نام درج کریں"
              label="نام"
              required
            />
            
            <ValidatedInput
              fieldType="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="موبائل نمبر درج کریں"
              label="موبائل"
              required
            />
            
            <ValidatedInput
              fieldType="serialNumber"
              name="cnic"
              value={form.cnic}
              onChange={handleChange}
              placeholder="شناختی کارڈ نمبر درج کریں"
              label="شناختی کارڈ نمبر"
            />
          </div>

          <div className="action-buttons">
            <button type="submit" className="primary">
              {editingId ? "تبدیلیاں محفوظ کریں" : "ملازم شامل کریں"}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", phone: "", cnic: "" });
                  setFormErrors({});
                }}
                className="secondary"
              >
                منسوخ کریں
              </button>
            )}
          </div>
        </form>

        <div className="form-section">
          <h3>خرچ شامل کریں</h3>
          
          <form onSubmit={addExpense}>
            {expenseFormErrors.submit && (
              <div className="error-message" style={{ marginBottom: '20px' }}>
                {expenseFormErrors.submit}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>ملازم منتخب کریں</label>
                <select 
                  name="employeeId" 
                  value={expenseForm.employeeId} 
                  onChange={handleExpenseChange}
                  className={expenseFormErrors.employeeId ? 'error' : ''}
                >
                  <option value="">-- منتخب کریں --</option>
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>{e.name}</option>
                  ))}
                </select>
                {expenseFormErrors.employeeId && (
                  <div className="error-message" style={{ 
                    fontSize: '12px', 
                    marginTop: '4px',
                    color: '#dc3545',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: '14px' }}>⚠️</span>
                    {expenseFormErrors.employeeId}
                  </div>
                )}
              </div>

              <ValidatedInput
                fieldType="expenseAmount"
                type="number"
                name="amount"
                value={expenseForm.amount}
                onChange={handleExpenseChange}
                placeholder="رقم درج کریں"
                label="رقم"
                required
              />

              <ValidatedInput
                fieldType="expenseDescription"
                name="description"
                value={expenseForm.description}
                onChange={handleExpenseChange}
                placeholder="خرچ کی تفصیل درج کریں"
                label="تفصیل"
                required
              />

              <div className="form-group">
                <label>تاریخ</label>
                <input 
                  type="date" 
                  name="date" 
                  value={expenseForm.date} 
                  onChange={handleExpenseChange}
                />
              </div>
            </div>

            <div className="action-buttons">
              <button type="submit" className="primary">
                خرچ شامل کریں
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <h3>ملازمین تلاش کریں</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>تلاش</label>
            <input
              type="text"
              placeholder="نام یا موبائل نمبر تلاش کریں..."
              name="search"
              value={filter.search}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="form-group">
            <label>شروع کی تاریخ</label>
            <input 
              type="date" 
              name="startDate" 
              value={filter.startDate} 
              onChange={handleFilterChange} 
            />
          </div>
          
          <div className="form-group">
            <label>اختتامی تاریخ</label>
            <input 
              type="date" 
              name="endDate" 
              value={filter.endDate} 
              onChange={handleFilterChange} 
            />
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="text-center p-20">
            <p>کوئی ملازم نہیں ملا</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>نام</th>
                <th>موبائل</th>
                <th>شناختی کارڈ</th>
                <th>کل خرچ</th>
                <th>تفصیلات</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const expenses = filterExpenses(emp.expenses || []);
                const totalExpense = expenses.reduce((acc, ex) => acc + ex.amount, 0);

                return (
                  <tr key={emp._id}>
                    <td>
                      <strong>{emp.name}</strong>
                    </td>
                    <td>{emp.phone}</td>
                    <td>{emp.cnic || "-"}</td>
                    <td>
                      <strong>روپے {totalExpense.toLocaleString()}</strong>
                    </td>
                    <td>
                      {expenses.map((ex, i) => (
                        <div key={i} className="mb-20">
                          <div className="status-badge status-pending">
                            روپے {ex.amount.toLocaleString()}
                          </div>
                          <div style={{ marginTop: '8px', fontSize: '13px' }}>
                            <strong>تفصیل:</strong> {ex.description}
                            <br />
                            <strong>تاریخ:</strong> {new Date(ex.date).toLocaleDateString('ur-PK')}
                          </div>
                        </div>
                      ))}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleEdit(emp)}
                          className="secondary"
                        >
                          ترمیم
                        </button>
                        <button 
                          onClick={() => handleDelete(emp._id)}
                          className="danger"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>ملازم آرڈر رپورٹ</h3>
        <label>ملازم منتخب کریں:</label>
        <select value={selectedEmployeeForOrders} onChange={(e) => setSelectedEmployeeForOrders(e.target.value)}>
          <option value="">-- ملازم منتخب کریں --</option>
          {employees.map((e) => (
            <option key={e._id} value={e._id}>{e.name}</option>
          ))}
        </select>
        <br />
        <label>شروع کی تاریخ:</label>
        <input type="date" value={orderFilter.startDate} onChange={(e) => setOrderFilter({ ...orderFilter, startDate: e.target.value })} />
        <label>اختتامی تاریخ:</label>
        <input type="date" value={orderFilter.endDate} onChange={(e) => setOrderFilter({ ...orderFilter, endDate: e.target.value })} />

        <table border="1" cellPadding="6" style={{ width: "100%", marginTop: "20px" }}>
          <thead>
            <tr>
              <th>گاہک</th>
              <th>سوٹ کی تفصیل</th>
              <th>تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {filterOrders().map((order) => (
              <tr key={order._id}>
                <td>{order.customer?.name}</td>
                <td>
                  {order.suitDetails.map((s, i) => (
                    <div key={i}>
                      <b>{s.suitType?.name}</b>
                      {s.items.map((it, j) => (
                        <div key={j}>
                          {it.itemName}: {it.sizes.map((sz) => `${sz.name}:${sz.value}`).join(", ")}
                        </div>
                      ))}
                    </div>
                  ))}
                </td>
                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Employees;