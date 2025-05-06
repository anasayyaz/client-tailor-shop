import React, { useEffect, useState } from "react";
import axios from "axios";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [suitTypes, setSuitTypes] = useState([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    serialNumber: "", // 👈 NEW
    suits: [],
  });

  const [editingId, setEditingId] = useState(null);

  const CUSTOMER_API = "http://localhost:5000/api/customers";
  const SUIT_API = "http://localhost:5000/api/suit-types";

  useEffect(() => {
    fetchCustomers();
    fetchSuitTypes();
  }, []);

  const fetchCustomers = async () => {
    const res = await axios.get(CUSTOMER_API);
    setCustomers(res.data);
  };

  const fetchSuitTypes = async () => {
    const res = await axios.get(SUIT_API);
    setSuitTypes(res.data);
  };

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${CUSTOMER_API}/${editingId}`, form);
      setEditingId(null);
    } else {
      await axios.post(CUSTOMER_API, form);
    }
    setForm({ name: "", phone: "", suits: [] });
    fetchCustomers();
  };

  const handleEdit = (cust) => {
    setForm(cust);
    setEditingId(cust._id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`${CUSTOMER_API}/${id}`);
    fetchCustomers();
  };

  return (
    <div>
      <h2>گاہک</h2>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <label>نام</label>
          <input name="name" value={form.name} onChange={handleBasicChange} />
          <br />
          <label>سیریل نمبر</label>
          <input
            name="serialNumber"
            value={form.serialNumber}
            onChange={handleBasicChange}
          />

          <br />

          <label>موبائل</label>
          <input name="phone" value={form.phone} onChange={handleBasicChange} />
          <br />
          <button type="button" onClick={addSuitType}>
            سوٹ کی قسم شامل کریں
          </button>

          {form.suits.map((suit, suitIndex) => (
            <div
              key={suitIndex}
              style={{
                marginTop: "20px",
                border: "1px dashed gray",
                padding: "10px",
              }}
            >
              <label>سوٹ کی قسم</label>
              <select
                onChange={(e) => handleSuitTypeChange(e, suitIndex)}
                value={suit.suitType}
              >
                <option value="">-- منتخب کریں --</option>
                {suitTypes.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {suit.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  <h4>{item.itemName}</h4>
                  {item.sizes.map((size, sizeIndex) => (
                    <div key={sizeIndex} style={{ marginLeft: "20px" }}>
                      <label>{size.name}:</label>
                      <input
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
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}

          <br />
          <button type="submit">محفوظ</button>
        </form>
      </div>

      <div className="card">
        <h3>گاہکوں کی فہرست</h3>
        <table>
          <thead>
            <tr>
              <th>نام</th>
              <th>سیریل نمبر</th>
              <th>موبائل</th>
              <th>سوٹ</th>
              <th>بٹن</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.serialNumber}</td>
                <td>{c.phone}</td>
                <td>
                  {c.suits.map((s, i) => (
                    <div key={i}>
                      <b>Suit:</b>{" "}
                      {suitTypes.find((st) => st._id === s.suitType)?.name}
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
                <td>
                  <button onClick={() => handleEdit(c)}>ایڈیٹ</button>
                  <button onClick={() => handleDelete(c._id)}>ڈیلیٹ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Customers;
