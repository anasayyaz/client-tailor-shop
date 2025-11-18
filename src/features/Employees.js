import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import ValidatedInput from "../components/ValidatedInput";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import { validateForm, validateField, validationOptions } from "../utils/validation";
import { API_ENDPOINTS, api } from "../config/api";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", cnic: "" });
  const [formErrors, setFormErrors] = useState({});
  const [expenseForm, setExpenseForm] = useState({
    employeeId: "",
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [expenseFormErrors, setExpenseFormErrors] = useState({});
  const [filter, setFilter] = useState({ startDate: "", endDate: "", search: "", employeeId: "all" });
  const [filterErrors, setFilterErrors] = useState({});
  const [expenseReportEmployees, setExpenseReportEmployees] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formModal, setFormModal] = useState({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [employeeReportModal, setEmployeeReportModal] = useState({ isOpen: false, employee: null });
  const [quickExpenseModal, setQuickExpenseModal] = useState({ isOpen: false, employeeId: null, employeeName: "" });
  const [expenseReportModal, setExpenseReportModal] = useState({ isOpen: false });
  
  // Pagination states
  const [employeesPage, setEmployeesPage] = useState(1);
  const [employeesPerPage, setEmployeesPerPage] = useState(10);
  const [expenseReportPage, setExpenseReportPage] = useState(1);
  const [expenseReportPerPage, setExpenseReportPerPage] = useState(10);
  const [employeeExpensesPage, setEmployeeExpensesPage] = useState(1);
  const [employeeExpensesPerPage, setEmployeeExpensesPerPage] = useState(10);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.EMPLOYEES);
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredEmployees = useCallback(async () => {
    // Don't fetch if there are date validation errors
    if (filterErrors.dateRange) {
      return;
    }
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      if (filter.employeeId && filter.employeeId !== 'all') {
        params.append('employeeId', filter.employeeId);
      }
      
      const queryString = params.toString();
      const url = queryString 
        ? `${API_ENDPOINTS.EMPLOYEES}?${queryString}`
        : API_ENDPOINTS.EMPLOYEES;
      
      const res = await api.get(url);
      setExpenseReportEmployees(res.data || []);
    } catch (err) {
      console.error("Error fetching filtered employees:", err);
      setExpenseReportEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [filter.startDate, filter.endDate, filter.employeeId, filterErrors.dateRange]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch filtered employees when expense report modal is open and filters change
  useEffect(() => {
    if (expenseReportModal.isOpen) {
      fetchFilteredEmployees();
    } else {
      // Clear filtered employees when modal closes
      setExpenseReportEmployees([]);
    }
  }, [expenseReportModal.isOpen, fetchFilteredEmployees, filterErrors.dateRange]);

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
    const newFilter = { ...filter, [name]: value };
    setFilter(newFilter);
    
    // Validate dates
    const errors = {};
    if (newFilter.startDate && newFilter.endDate) {
      const startDate = new Date(newFilter.startDate);
      const endDate = new Date(newFilter.endDate);
      
      if (startDate > endDate) {
        errors.dateRange = "شروع کی تاریخ اختتامی تاریخ سے بعد نہیں ہو سکتی";
      }
    }
    
    setFilterErrors(errors);
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
        await api.put(`${API_ENDPOINTS.EMPLOYEES}/${editingId}`, form);
        setEditingId(null);
      } else {
        await api.post(API_ENDPOINTS.EMPLOYEES, form);
      }
      setForm({ name: "", phone: "", cnic: "" });
      setFormErrors({});
      setFormModal({ isOpen: false });
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
    setFormModal({ isOpen: true });
  };

  const openAddModal = () => {
    setForm({ name: "", phone: "", cnic: "" });
    setEditingId(null);
    setFormErrors({});
    setFormModal({ isOpen: true });
  };

  const closeFormModal = () => {
    setFormModal({ isOpen: false });
    setForm({ name: "", phone: "", cnic: "" });
    setEditingId(null);
    setFormErrors({});
  };

  const handleDelete = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    
    try {
      setLoading(true);
      await api.delete(`${API_ENDPOINTS.EMPLOYEES}/${deleteModal.id}`);
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
      await api.post(`${API_ENDPOINTS.EMPLOYEES}/${expenseForm.employeeId}/expense`, {
        amount: Number(expenseForm.amount),
        description: expenseForm.description,
        date: expenseForm.date,
      });
      const wasQuickExpense = quickExpenseModal.isOpen;
      setExpenseForm({
        employeeId: "",
        amount: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
      });
      setExpenseFormErrors({});
      await fetchEmployees();
      toast.success("خرچ کامیابی سے شامل ہو گیا");
      if (wasQuickExpense) {
        setQuickExpenseModal({ isOpen: false, employeeId: null, employeeName: "" });
      }
      // Don't close expense report modal automatically - user might want to add more expenses
    } catch (error) {
      console.error("Error adding expense:", error);
      const errorMessage = error.response?.data?.message || "خرچ شامل کرنے میں مسئلہ ہوا ہے۔ براہ کرم دوبارہ کوشش کریں۔";
      setExpenseFormErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openQuickExpense = (emp) => {
    setQuickExpenseModal({ isOpen: true, employeeId: emp._id, employeeName: emp.name });
    setExpenseForm({
      employeeId: emp._id,
      amount: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setExpenseFormErrors({});
  };

  const openEmployeeReport = async (emp) => {
    // Refresh employee data to get latest expenses
    try {
      const res = await api.get(API_ENDPOINTS.EMPLOYEES);
      const updatedEmployee = res.data.find(e => e._id === emp._id);
      if (updatedEmployee) {
        setEmployeeReportModal({ isOpen: true, employee: updatedEmployee });
      } else {
        setEmployeeReportModal({ isOpen: true, employee: emp });
      }
      setEmployeeExpensesPage(1); // Reset to first page when opening modal
    } catch (err) {
      console.error("Error fetching employee data:", err);
      setEmployeeReportModal({ isOpen: true, employee: emp });
      setEmployeeExpensesPage(1);
    }
  };

  const closeEmployeeReport = () => {
    setEmployeeReportModal({ isOpen: false, employee: null });
  };

  const closeQuickExpense = () => {
    setQuickExpenseModal({ isOpen: false, employeeId: null, employeeName: "" });
    setExpenseForm({
      employeeId: "",
      amount: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setExpenseFormErrors({});
  };

  const filterExpenses = (expenses) => {
    // This function is still used for the main employees list table
    if (!filter.startDate || !filter.endDate) return expenses;
    const start = new Date(filter.startDate);
    const end = new Date(filter.endDate);
    return expenses.filter((ex) => {
      const exDate = new Date(ex.date);
      return exDate >= start && exDate <= end;
    });
  };


  const filteredEmployees = employees.filter(
    (e) =>
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.phone?.includes(searchTerm) ||
      e.cnic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination for employees table
  const employeesStartIndex = (employeesPage - 1) * employeesPerPage;
  const employeesEndIndex = employeesStartIndex + employeesPerPage;
  const paginatedEmployees = filteredEmployees.slice(employeesStartIndex, employeesEndIndex);
  const totalEmployeesPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  // Pagination for expense report modal
  const expenseReportStartIndex = (expenseReportPage - 1) * expenseReportPerPage;
  const expenseReportEndIndex = expenseReportStartIndex + expenseReportPerPage;
  const paginatedExpenseReportEmployees = expenseReportEmployees.slice(expenseReportStartIndex, expenseReportEndIndex);
  const totalExpenseReportPages = Math.ceil(expenseReportEmployees.length / expenseReportPerPage);

  // Pagination for employee expenses in employee report modal
  const employeeExpenses = employeeReportModal.employee?.expenses || [];
  const employeeExpensesStartIndex = (employeeExpensesPage - 1) * employeeExpensesPerPage;
  const employeeExpensesEndIndex = employeeExpensesStartIndex + employeeExpensesPerPage;
  const paginatedEmployeeExpenses = employeeExpenses.slice(employeeExpensesStartIndex, employeeExpensesEndIndex);
  const totalEmployeeExpensesPages = Math.ceil(employeeExpenses.length / employeeExpensesPerPage);

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

      {/* Quick Expense Modal */}
      {quickExpenseModal.isOpen && (
        <div className="modal-overlay" onClick={closeQuickExpense}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>خرچ شامل کریں - {quickExpenseModal.employeeName}</h3>
              <button className="modal-close" onClick={closeQuickExpense}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={addExpense}>
                {expenseFormErrors.submit && (
                  <div className="error-message" style={{ marginBottom: '20px' }}>
                    {expenseFormErrors.submit}
                  </div>
                )}
                <div className="form-row">
                  <ValidatedInput
                    fieldType="expenseAmount"
                    type="text"
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
                  <button 
                    type="button" 
                    onClick={closeQuickExpense}
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

      {/* Employee Report Modal */}
      {employeeReportModal.isOpen && employeeReportModal.employee && (
        <div className="modal-overlay" onClick={closeEmployeeReport}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ملازم رپورٹ - {employeeReportModal.employee.name}</h3>
              <button className="modal-close" onClick={closeEmployeeReport}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '30px' }}>
                <h4>ملازم کی معلومات</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>نام</label>
                    <input type="text" value={employeeReportModal.employee.name} disabled style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label>موبائل</label>
                    <input type="text" value={employeeReportModal.employee.phone} disabled style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group">
                    <label>شناختی کارڈ</label>
                    <input type="text" value={employeeReportModal.employee.cnic || "-"} disabled style={{ background: '#f5f5f5' }} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4>خرچ کی تفصیلات</h4>
                  <button 
                    onClick={() => {
                      closeEmployeeReport();
                      openQuickExpense(employeeReportModal.employee);
                    }}
                    className="success"
                  >
                    + نیا خرچ شامل کریں
                  </button>
                </div>
                
                {employeeExpenses.length > 0 ? (
                  <>
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>تاریخ</th>
                            <th>رقم</th>
                            <th>تفصیل</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedEmployeeExpenses.map((ex, i) => (
                            <tr key={i}>
                              <td>{new Date(ex.date).toLocaleDateString('ur-PK')}</td>
                              <td><strong>روپے {(ex.amount || 0).toLocaleString()}</strong></td>
                              <td>{ex.description}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="2"><strong>کل خرچ:</strong></td>
                            <td><strong>روپے {employeeExpenses.reduce((acc, ex) => acc + (ex.amount || 0), 0).toLocaleString()}</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    {employeeExpenses.length > employeeExpensesPerPage && (
                      <Pagination
                        currentPage={employeeExpensesPage}
                        totalPages={totalEmployeeExpensesPages}
                        onPageChange={setEmployeeExpensesPage}
                        itemsPerPage={employeeExpensesPerPage}
                        totalItems={employeeExpenses.length}
                        onItemsPerPageChange={(value) => {
                          setEmployeeExpensesPerPage(value);
                          setEmployeeExpensesPage(1);
                        }}
                      />
                    )}
                  </>
                ) : (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>کوئی خرچ نہیں ملا</p>
                )}
              </div>

              <div className="action-buttons">
                <button 
                  onClick={() => {
                    closeEmployeeReport();
                    openQuickExpense(employeeReportModal.employee);
                  }}
                  className="primary"
                >
                  خرچ شامل کریں
                </button>
                <button 
                  onClick={closeEmployeeReport}
                  className="secondary"
                >
                  بند کریں
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Form Modal */}
      {formModal.isOpen && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "ملازم میں ترمیم کریں" : "نیا ملازم شامل کریں"}</h3>
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

      <h2 style={{ direction: 'rtl', textAlign: 'right' }}>ملازمین کا انتظام</h2>

      {/* Search and Add Button */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="نام، موبائل یا شناختی کارڈ نمبر سے تلاش کریں..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setEmployeesPage(1); // Reset to first page on search
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
            onClick={() => {
              setFilter({ startDate: "", endDate: "", search: "", employeeId: "all" });
              setFilterErrors({});
              setExpenseReportPage(1);
              setExpenseReportModal({ isOpen: true });
            }}
            className="success"
            style={{ whiteSpace: 'nowrap' }}
          >
            📊 خرچ کی تفصیلی رپورٹ
          </button>
          <button 
            onClick={openAddModal}
            className="primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            + نیا ملازم شامل کریں
          </button>
        </div>
      </div>

      {/* Employees List */}
      <div className="card">
        <h3>ملازمین کی فہرست</h3>
        
        {loading && employees.length === 0 ? (
          <div className="text-center p-20">
            <p>لوڈ ہو رہا ہے...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center p-20">
            <p>{searchTerm ? "تلاش کے نتائج نہیں ملے" : "کوئی ملازم نہیں ملا"}</p>
          </div>
        ) : (
          <div className="table-wrapper" dir="rtl">
            <table dir="rtl">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>موبائل</th>
                  <th>شناختی کارڈ</th>
                  <th>کل خرچ</th>
                  <th>خرچ کی تعداد</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map((emp) => {
                  const expenses = filterExpenses(emp.expenses || []);
                  const totalExpense = expenses.reduce((acc, ex) => acc + (ex.amount || 0), 0);
                  const expenseCount = expenses.length;

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
                        <span className="status-badge status-pending">
                          {expenseCount} خرچ
                        </span>
                        {expenseCount > 0 && (
                          <button
                            onClick={() => openEmployeeReport(emp)}
                            className="secondary"
                            style={{ 
                              marginTop: '8px', 
                              fontSize: '12px', 
                              padding: '4px 8px',
                              display: 'block',
                              width: '100%'
                            }}
                            title="تفصیلات دیکھیں"
                          >
                            تفصیلات دیکھیں
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => openQuickExpense(emp)}
                            className="success"
                            title="خرچ شامل کریں"
                            style={{ fontSize: '18px', padding: '8px 12px' }}
                          >
                            💰
                          </button>
                          <button 
                            onClick={() => openEmployeeReport(emp)}
                            className="primary"
                            title="رپورٹ دیکھیں"
                            style={{ fontSize: '18px', padding: '8px 12px' }}
                          >
                            📊
                          </button>
                          <button 
                            onClick={() => handleEdit(emp)}
                            className="secondary"
                            title="ترمیم"
                            style={{ fontSize: '18px', padding: '8px 12px' }}
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(emp._id)}
                            className="danger"
                            title="حذف"
                            style={{ fontSize: '18px', padding: '8px 12px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {filteredEmployees.length > 0 && (
          <Pagination
            currentPage={employeesPage}
            totalPages={totalEmployeesPages}
            onPageChange={setEmployeesPage}
            itemsPerPage={employeesPerPage}
            totalItems={filteredEmployees.length}
            onItemsPerPageChange={(value) => {
              setEmployeesPerPage(value);
              setEmployeesPage(1);
            }}
          />
        )}
      </div>

      {/* Expense Report Modal */}
      {expenseReportModal.isOpen && (
        <div className="modal-overlay" onClick={() => setExpenseReportModal({ isOpen: false })}>
          <div className="modal-content" style={{ maxWidth: '1000px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>خرچ کی تفصیلی رپورٹ</h3>
              <button className="modal-close" onClick={() => setExpenseReportModal({ isOpen: false })}>×</button>
            </div>
            <div className="modal-body">
              {/* Filters for Expenses */}
              <div style={{ marginBottom: '30px' }}>
                <h4>فلٹر</h4>
                {filterErrors.dateRange && (
                  <div className="error-message" style={{ 
                    marginBottom: '15px', 
                    padding: '10px', 
                    background: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '4px',
                    color: '#c33'
                  }}>
                    ⚠️ {filterErrors.dateRange}
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label>ملازم</label>
                    <select 
                      name="employeeId" 
                      value={filter.employeeId} 
                      onChange={handleFilterChange}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '14px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="all">تمام ملازمین</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>شروع کی تاریخ</label>
                    <input 
                      type="date" 
                      name="startDate" 
                      value={filter.startDate} 
                      onChange={handleFilterChange}
                      max={filter.endDate || undefined}
                      style={{
                        borderColor: filterErrors.dateRange ? '#fcc' : undefined
                      }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>اختتامی تاریخ</label>
                    <input 
                      type="date" 
                      name="endDate" 
                      value={filter.endDate} 
                      onChange={handleFilterChange}
                      min={filter.startDate || undefined}
                      style={{
                        borderColor: filterErrors.dateRange ? '#fcc' : undefined
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Expense Report Table */}
              <div>
                <h4>{filter.employeeId === 'all' ? 'تمام ملازمین کے خرچ' : 'ملازم کے خرچ'}</h4>
                {loading && expenseReportEmployees.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>لوڈ ہو رہا ہے...</p>
                ) : expenseReportEmployees.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>کوئی ملازم یا خرچ نہیں ملا</p>
                ) : (
                  <div className="table-wrapper" dir="rtl">
                    <table dir="rtl">
                      <thead>
                        <tr>
                          <th>ملازم کا نام</th>
                          <th>موبائل</th>
                          <th>خرچ کی تفصیلات</th>
                          <th>کل خرچ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedExpenseReportEmployees.map((emp) => {
                          const expenses = emp.expenses || [];
                          const totalExpense = expenses.reduce((acc, ex) => acc + (ex.amount || 0), 0);
                          
                          return (
                            <tr key={emp._id}>
                              <td><strong>{emp.name}</strong></td>
                              <td>{emp.phone}</td>
                              <td>
                                {expenses.length > 0 ? (
                                  <div>
                                    {expenses.map((ex, i) => (
                                      <div key={i} style={{ marginBottom: '10px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                          <strong>روپے {(ex.amount || 0).toLocaleString()}</strong>
                                          <span style={{ fontSize: '12px', color: '#666' }}>
                                            {new Date(ex.date).toLocaleDateString('ur-PK')}
                                          </span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#555' }}>
                                          {ex.description}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ color: '#999' }}>کوئی خرچ نہیں</span>
                                )}
                              </td>
                              <td>
                                <strong style={{ color: '#800000', fontSize: '16px' }}>
                                  روپے {totalExpense.toLocaleString()}
                                </strong>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                          <td colSpan="3" style={{ textAlign: 'right' }}>کل خرچ:</td>
                          <td style={{ color: '#800000', fontSize: '18px' }}>
                            روپے {expenseReportEmployees.reduce((total, emp) => {
                              const expenses = emp.expenses || [];
                              return total + expenses.reduce((acc, ex) => acc + (ex.amount || 0), 0);
                            }, 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
                
                {expenseReportEmployees.length > expenseReportPerPage && (
                  <Pagination
                    currentPage={expenseReportPage}
                    totalPages={totalExpenseReportPages}
                    onPageChange={setExpenseReportPage}
                    itemsPerPage={expenseReportPerPage}
                    totalItems={expenseReportEmployees.length}
                    onItemsPerPageChange={(value) => {
                      setExpenseReportPerPage(value);
                      setExpenseReportPage(1);
                    }}
                  />
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => {
                  setExpenseReportModal({ isOpen: false });
                  setExpenseReportPage(1);
                }}
                className="secondary"
              >
                بند کریں
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Employees;