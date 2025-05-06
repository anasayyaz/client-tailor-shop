import React, { useEffect, useState } from "react";
import axios from "axios";

function SuitTypes() {
  const [suitTypes, setSuitTypes] = useState([]);
  const [form, setForm] = useState({
    name: "",
    items: [{ name: "", sizes: [{ name: "" }] }],
  });
  const [editingId, setEditingId] = useState(null);

  const API = "https://server-al-ansari.onrender.com/api/suit-types";

  const fetchSuitTypes = async () => {
    const res = await axios.get(API);
    setSuitTypes(res.data);
  };

  useEffect(() => {
    fetchSuitTypes();
  }, []);

  const handleFormChange = (e, itemIndex, sizeIndex) => {
    const { name, value } = e.target;
    const updatedForm = { ...form };

    if (name === "typeName") updatedForm.name = value;
    else if (name === "itemName") updatedForm.items[itemIndex].name = value;
    else if (name === "sizeName")
      updatedForm.items[itemIndex].sizes[sizeIndex].name = value;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API}/${editingId}`, form);
      setEditingId(null);
    } else {
      await axios.post(API, form);
    }
    setForm({
      name: "",
      items: [{ name: "", sizes: [{ name: "" }] }],
    });
    fetchSuitTypes();
  };

  const handleEdit = (st) => {
    setForm(st);
    setEditingId(st._id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/${id}`);
    fetchSuitTypes();
  };

  return (
    <div>
      <h2>سوٹ کی اقسام</h2>
      <div className="card">
        <form
          onSubmit={handleSubmit}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "20px",
          }}
        >
          <label>سوٹ کی قسم کا نام</label>
          <input
            name="typeName"
            value={form.name}
            onChange={handleFormChange}
          />
          <br />
          {form.items.map((item, i) => (
            <div key={i}>
              <label>نام {i + 1} آئٹم</label>
              <input
                name="itemName"
                value={item.name}
                onChange={(e) => handleFormChange(e, i)}
              />
              {item.sizes.map((size, j) => (
                <div key={j} style={{ marginLeft: "20px" }}>
                  <label>نام {j + 1} سائز</label>
                  <input
                    name="sizeName"
                    value={size.name}
                    onChange={(e) => handleFormChange(e, i, j)}
                  />
                </div>
              ))}
              <button type="button" onClick={() => addSize(i)}>
                سوٹ کی قسم شامل کریں
              </button>
            </div>
          ))}
          <button type="button" onClick={addItem}>
            آئٹم شامل کریں
          </button>
          <br />
          <button type="submit">محفوظ</button>
        </form>
      </div>

      <div className="card">
        <h3>موجودہ سوٹ کی اقسام</h3>
        <table border="1" cellPadding="6" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>نام</th>
              <th>آئٹمز اور سائز</th>
              <th>بٹن</th>
            </tr>
          </thead>
          <tbody>
            {suitTypes.map((suit) => (
              <tr key={suit._id}>
                <td>{suit.name}</td>
                <td>
                  {suit.items.map((item, i) => (
                    <div key={i} style={{ marginBottom: "5px" }}>
                      <b>{item.name}</b>
                      <ul style={{ marginLeft: "20px" }}>
                        {item.sizes.map((s, j) => (
                          <li key={j}>{s.name}</li> // ONLY show Size name!
                        ))}
                      </ul>
                    </div>
                  ))}
                </td>
                <td>
                  <button onClick={() => handleEdit(suit)}>ایڈیٹ</button>{" "}
                  <button onClick={() => handleDelete(suit._id)}>ڈیلیٹ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SuitTypes;
