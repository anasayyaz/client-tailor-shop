import React, { useEffect, useState } from "react";
import axios from "axios";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", cnic: "" });
  const [expenseForm, setExpenseForm] = useState({
    employeeId: "",
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [selectedEmployeeForOrders, setSelectedEmployeeForOrders] = useState("");
  const [orderFilter, setOrderFilter] = useState({ startDate: "", endDate: "" });
  const [allOrders, setAllOrders] = useState([]);
  const [filter, setFilter] = useState({ startDate: "", endDate: "", search: "" });
  const [editingId, setEditingId] = useState(null);

  const API = "http://localhost:5000/api/employees";

  useEffect(() => {
    fetchEmployees();
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const res = await axios.get("http://localhost:5000/api/orders");
    setAllOrders(res.data);
  };

  const fetchEmployees = async () => {
    const res = await axios.get(API);
    setEmployees(res.data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm({ ...expenseForm, [name]: value });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API}/${editingId}`, form);
      setEditingId(null);
    } else {
      await axios.post(API, form);
    }
    setForm({ name: "", phone: "", cnic: "" });
    fetchEmployees();
  };

  const handleEdit = (emp) => {
    setForm({ name: emp.name, phone: emp.phone, cnic: emp.cnic });
    setEditingId(emp._id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/${id}`);
    fetchEmployees();
  };

  const addExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.employeeId) return alert("براہ کرم ملازم منتخب کریں");
    await axios.post(`${API}/${expenseForm.employeeId}/expense`, {
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
    fetchEmployees();
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
    <div dir="rtl" style={{ textAlign: "right" }}>
      <h2>ملازمین</h2>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "20px" }}>
          <h3>{editingId ? "ملازم میں ترمیم کریں" : "نیا ملازم شامل کریں"}</h3>
          <label>نام:</label>
          <input name="name" value={form.name} onChange={handleChange} />
          <label>موبائل:</label>
          <input name="phone" value={form.phone} onChange={handleChange} />
          <label>شناختی کارڈ نمبر:</label>
          <input name="cnic" value={form.cnic} onChange={handleChange} />
          <button type="submit">{editingId ? "اپ ڈیٹ کریں" : "شامل کریں"}</button>
        </form>

        <h3>خرچ شامل کریں</h3>
        <form onSubmit={addExpense} style={{ border: "1px solid #aaa", padding: "10px", marginBottom: "20px" }}>
          <label>ملازم منتخب کریں:</label>
          <select name="employeeId" value={expenseForm.employeeId} onChange={handleExpenseChange}>
            <option value="">-- منتخب کریں --</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>{e.name}</option>
            ))}
          </select>

          <label>رقم:</label>
          <input type="number" name="amount" value={expenseForm.amount} onChange={handleExpenseChange} />

          <label>تفصیل:</label>
          <input name="description" value={expenseForm.description} onChange={handleExpenseChange} />

          <label>تاریخ:</label>
          <input type="date" name="date" value={expenseForm.date} onChange={handleExpenseChange} />

          <button type="submit">محفوظ کریں</button>
        </form>
      </div>

      <div className="card">
        <h3>ملازمین تلاش کریں</h3>
        <input
          type="text"
          placeholder="نام یا موبائل نمبر تلاش کریں..."
          name="search"
          value={filter.search}
          onChange={handleFilterChange}
          style={{ marginBottom: "10px", width: "250px", padding: "5px" }}
        />
        <br />
        <label>شروع کی تاریخ:</label>
        <input type="date" name="startDate" value={filter.startDate} onChange={handleFilterChange} />
        <label>اختتامی تاریخ:</label>
        <input type="date" name="endDate" value={filter.endDate} onChange={handleFilterChange} />
        <br />
        <table border="1" cellPadding="6" style={{ width: "100%", marginTop: "20px" }}>
          <thead>
            <tr>
              <th>نام</th>
              <th>موبائل</th>
              <th>شناختی کارڈ</th>
              <th>کل خرچ</th>
              <th>تفصیلات</th>
              <th>عمل</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => {
              const expenses = filterExpenses(emp.expenses || []);
              const totalExpense = expenses.reduce((acc, ex) => acc + ex.amount, 0);

              return (
                <tr key={emp._id}>
                  <td>{emp.name}</td>
                  <td>{emp.phone}</td>
                  <td>{emp.cnic}</td>
                  <td>روپے {totalExpense}</td>
                  <td>
                    {expenses.map((ex, i) => (
                      <div key={i}>
                        روپے {ex.amount} — {ex.description} ({new Date(ex.date).toLocaleDateString()})
                      </div>
                    ))}
                  </td>
                  <td>
                    <button onClick={() => handleEdit(emp)}>ایڈیٹ</button>
                    <button onClick={() => handleDelete(emp._id)}>ڈیلیٹ</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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