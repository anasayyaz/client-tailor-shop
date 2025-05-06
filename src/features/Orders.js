import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [suitTypes, setSuitTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const [form, setForm] = useState({
    customerPhone: "",
    customerId: "",
    customerName: "",
    suitDetails: [],
    assignedEmployee: "",
    notes: "", // ✅ ADD THIS
  });

  const [editingId, setEditingId] = useState(null);

  const typingTimeout = useRef(null);

  const ORDER_API = "https://server-al-ansari.onrender.com/api/orders";
  const CUSTOMER_API = "https://server-al-ansari.onrender.com/api/customers";
  const SUIT_API = "https://server-al-ansari.onrender.com/api/suit-types";
  const EMP_API = "https://server-al-ansari.onrender.com/api/employees";

  useEffect(() => {
    fetchOrders();
    fetchSuitTypes();
    fetchEmployees();
  }, []);

  const fetchOrders = async () => {
    const res = await axios.get(ORDER_API);
    setOrders(res.data);
  };

  const fetchSuitTypes = async () => {
    const res = await axios.get(SUIT_API);
    setSuitTypes(res.data);
  };

  const fetchEmployees = async () => {
    const res = await axios.get(EMP_API);
    setEmployees(res.data);
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

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    if (value.length >= 1) {
      typingTimeout.current = setTimeout(async () => {
        setSearchLoading(true);
        try {
          const res = await axios.get(CUSTOMER_API);
          const allCustomers = res.data;
          const matches = allCustomers.filter((c) => c.phone.startsWith(value));
          setSearchResults(matches);
        } catch (err) {
          console.error(err);
          setSearchResults([]);
        }
        setSearchLoading(false);
      }, 400);
    } else {
      setSearchResults([]);
    }
  };

  const selectCustomer = (customer) => {
    setForm({
      ...form,
      customerPhone: customer.phone,
      customerId: customer._id,
      customerName: customer.name,
      suitDetails: customer.suits.map((suit) => ({
        suitType:
          typeof suit.suitType === "object" ? suit.suitType._id : suit.suitType,
        items: suit.items.map((item) => ({
          itemName: item.itemName,
          sizes: item.sizes.map((size) => ({
            name: size.name,
            value: size.value,
          })),
        })),
      })),
    });
    setSearchResults([]);
    setHighlightIndex(-1);
  };
  const printSlip = async (order) => {
    const res = await axios.get(
      `https://server-al-ansari.onrender.com/api/orders/${order._id}`
    );
    const data = res.data;

    const newWindow = window.open("", "_blank");

    const htmlContent = `
      <html>
        <head>
          <title>پرنٹ Order</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .header {
              display: flex;
              align-items: center;
              gap: 15px;
              margin-bottom: 15px;
            }
            .header img {
              height: 70px;
            }
            .shop-info h1 {
              margin: 0;
              font-size: 22px;
            }
            .section {
              margin-bottom: 15px;
            }
            .signature {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .signature div {
              border-top: 1px solid black;
              width: 40%;
              text-align: center;
              padding-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${window.location.origin}/logo.png" />
            <div class="shop-info">
              <h1>AL-ANSARI TAILORS</h1>
              <p><b>Owner:</b> Irfan Ansari</p>
              <p><b>Phone:</b> 0301-8019530</p>
              <p><b>Address:</b> Aman Plaza, Block H3, Phase 2, Johar Town, Lahore</p>
            </div>
          </div>
  
          <div class="section">
            <p><b>Customer:</b> ${data.customer?.name || ""}</p>
            <p><b>Phone:</b> ${data.customer?.phone || ""}</p>
            <p><b>Date:</b> ${new Date(data.orderDate).toLocaleDateString()}</p>
          </div>
  
          <div class="section">
            <h3>Order Details</h3>
            ${data.suitDetails
              .map(
                (suit) => `
              <div>
                <h4>${suit.suitType?.name || "Suit"}</h4>
                ${suit.items
                  .map(
                    (item) => `
                  <p><b>${item.itemName}</b>: ${item.sizes
                      .map((sz) => `${sz.name}: ${sz.value}`)
                      .join(", ")}</p>
                `
                  )
                  .join("")}
              </div>
            `
              )
              .join("")}
          </div>
  
          <div class="section">
            <p><b>Total Items:</b> ${data.suitDetails.reduce(
              (acc, s) => acc + s.items.length,
              0
            )}</p>
            ${
              data.assignedEmployee
                ? `<p><b>Tailor:</b> ${data.assignedEmployee.name}</p>`
                : ""
            }
          </div>
  
          <div class="signature">
            <div>Customer Signature</div>
            <div>Tailor / Stamp</div>
          </div>
  
          <div class="section" style="text-align:center; margin-top: 30px;">
            <p>Thank you for choosing Al-Ansari Tailors!</p>
          </div>
  
          <script>
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `;

    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  };

  const handleKeyDown = (e) => {
    if (searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(
        (prev) => (prev - 1 + searchResults.length) % searchResults.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < searchResults.length) {
        selectCustomer(searchResults[highlightIndex]);
      }
    }
  };

  const handleOtherChange = (e, suitIndex, itemIndex, sizeIndex) => {
    const { name, value } = e.target;
    if (name === "assignedEmployee") {
      setForm({ ...form, assignedEmployee: value });
    } else {
      const updatedSuitDetails = [...form.suitDetails];
      updatedSuitDetails[suitIndex].items[itemIndex].sizes[sizeIndex].value =
        value;
      setForm({ ...form, suitDetails: updatedSuitDetails });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      customer: form.customerId,
      suitDetails: form.suitDetails,
      assignedEmployee: form.assignedEmployee || undefined,
      notes: form.notes, // ✅ ADD THIS
    };

    if (editingId) {
      await axios.put(`${ORDER_API}/${editingId}`, payload);
      setEditingId(null);
    } else {
      await axios.post(ORDER_API, payload);
    }

    setForm({
      customerPhone: "",
      customerId: "",
      customerName: "",
      suitDetails: [],
      assignedEmployee: "",
    });
    fetchOrders();
  };

  const handleEdit = (order) => {
    setForm({
      customerPhone: "",
      customerId: order.customer?._id,
      customerName: order.customer?.name || "",
      suitDetails: order.suitDetails,
      assignedEmployee: order.assignedEmployee?._id || "",
    });
    setEditingId(order._id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`${ORDER_API}/${id}`);
    fetchOrders();
  };

  return (
    <div>
      <h2>Orders</h2>
      <div className="card">
        <form
          onSubmit={handleSubmit}
          style={{ padding: "10px", marginBottom: "20px" }}
        >
          <label>Customer Phone:</label>
          <input
            name="customerPhone"
            value={form.customerPhone}
            onChange={handlePhoneChange}
            onKeyDown={handleKeyDown}
            style={{ position: "relative" }}
          />
          {/* Spinner while loading */}
          {searchLoading && <div className="loader"></div>}

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div
              style={{
                border: "1px solid #ccc",
                background: "white",
                maxHeight: "150px",
                overflowY: "auto",
                marginTop: "5px",
                position: "absolute",
                width: "250px",
                zIndex: 1000,
              }}
            >
              {searchResults.map((cust, index) => (
                <div
                  key={cust._id}
                  onClick={() => selectCustomer(cust)}
                  style={{
                    padding: "5px 10px",
                    borderBottom: "1px solid #eee",
                    backgroundColor:
                      highlightIndex === index ? "#f0f0f0" : "white",
                    cursor: "pointer",
                  }}
                >
                  {cust.name} ({cust.phone})
                </div>
              ))}
            </div>
          )}
          {/* No customer found */}
          {!searchLoading &&
            form.customerPhone.length > 0 &&
            searchResults.length === 0 &&
            form.customerId === "" && (
              <div style={{ marginTop: "5px", color: "red" }}>
                No customers found
              </div>
            )}

          {form.customerName && (
            <div style={{ marginTop: "5px", color: "green" }}>
              {form.customerName}
            </div>
          )}
          <br />

          {/* Suit Details */}
          {form.suitDetails.map((suit, sIndex) => (
            <div key={sIndex} style={{ marginTop: "10px" }}>
              <b>
                Suit Type:{" "}
                {suitTypes.find((s) => s._id === suit.suitType)?.name ||
                  suit.suitType}
              </b>
              {suit.items.map((item, iIndex) => (
                <div key={iIndex} style={{ marginLeft: "15px" }}>
                  <b>{item.itemName}</b>
                  {item.sizes.map((sz, szIndex) => (
                    <div key={szIndex} style={{ marginLeft: "15px" }}>
                      {sz.name}:{" "}
                      <input
                        type="number"
                        value={sz.value}
                        onChange={(e) =>
                          handleOtherChange(e, sIndex, iIndex, szIndex)
                        }
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          <br />

          <label>Assign to Employee (optional):</label>
          <select
            name="assignedEmployee"
            value={form.assignedEmployee}
            onChange={(e) => handleOtherChange(e)}
          >
            <option value="">-- Select --</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name}
              </option>
            ))}
          </select>
          <br />
          <label>Notes:</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            style={{ width: "100%", padding: "5px" }}
          ></textarea>

          <br />
          <button type="submit">{editingId ? "Update" : "Place"} Order</button>
        </form>
      </div>

      {/* Table */}
      <div className="card">
        <h3>All Orders</h3>
        <table border="1" cellPadding="6" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Suit Details</th>
              <th>Employee</th>
              <th>Date</th>
              <th>Notes</th>
              <th>بٹن</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>{o.customer?.name}</td>
                <td>
                  {o.suitDetails.map((s, i) => (
                    <div key={i}>
                      <b>
                        {suitTypes.find((st) => st._id === s.suitType)?.name}
                      </b>
                      {s.items.map((it, j) => (
                        <div key={j}>
                          {it.itemName}:{" "}
                          {it.sizes
                            .map((sz) => `${sz.name}:${sz.value}`)
                            .join(", ")}
                        </div>
                      ))}
                    </div>
                  ))}
                </td>
                <td>{o.assignedEmployee?.name || "-"}</td>
                <td>{new Date(o.orderDate).toLocaleDateString()}</td>
                <td>{o.notes}</td>
                <td>
                  <button onClick={() => handleEdit(o)}>ایڈیٹ</button>{" "}
                  <button onClick={() => handleDelete(o._id)}>ڈیلیٹ</button>{" "}
                  <button onClick={() => printSlip(o)}>پرنٹ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Orders;
