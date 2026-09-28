import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "/api";

export default function StockProcessing() {
  const [processing, setProcessing] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    branch: "",
    process_type: "STITCHING",
    input_product: "",
    input_quantity: "",
    output_product: "",
    output_quantity: "",
    employee: "",
    expected_date: "",
    remarks: "",
  });

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [processingRes, productsRes, employeesRes] =
        await Promise.all([
          axios.get(`${API}/stock-processing/`),
          axios.get(`${API}/products/`),
          axios.get(`${API}/employees/`),
        ]);

      setProcessing(processingRes.data.results || processingRes.data);
      setProducts(productsRes.data.results || productsRes.data);
      setEmployees(employeesRes.data.results || employeesRes.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Failed to load stock processing data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // CREATE PROCESSING
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      await axios.post(`${API}/stock-processing/`, {
        branch: form.branch || null,
        process_type: form.process_type,
        input_product: Number(form.input_product),
        input_quantity: Number(form.input_quantity),
        output_product: Number(form.output_product),
        output_quantity: form.output_quantity
          ? Number(form.output_quantity)
          : null,
        employee: form.employee ? Number(form.employee) : null,
        expected_date: form.expected_date || null,
        remarks: form.remarks,
      });

      alert("Processing created successfully.");

      setForm({
        branch: "",
        process_type: "STITCHING",
        input_product: "",
        input_quantity: "",
        output_product: "",
        output_quantity: "",
        employee: "",
        expected_date: "",
        remarks: "",
      });

      loadData();
    } catch (err) {
      console.error(err);

      const data = err.response?.data;

      setError(
        data?.detail ||
        JSON.stringify(data) ||
        "Failed to create processing."
      );
    }
  };

  // =========================================================
  // ISSUE STOCK
  // =========================================================

  const issueStock = async (item) => {
    const quantity = prompt(
      `Enter quantity to issue.\nRemaining: ${item.remaining_to_issue}`
    );

    if (!quantity) return;

    try {
      await axios.post(
        `${API}/stock-processing/${item.id}/issue/`,
        {
          quantity: Number(quantity),
        }
      );

      alert("Stock issued successfully.");

      loadData();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail ||
        "Failed to issue stock."
      );
    }
  };

  // =========================================================
  // RETURN / COMPLETE PROCESSING
  // =========================================================

  const returnStock = async (item) => {
    const pending = item.pending_quantity;

    if (pending <= 0) {
      alert("No pending quantity to return.");
      return;
    }

    const quantity = prompt(
      `Enter returned quantity.\nPending: ${pending}`
    );

    if (!quantity) return;

    try {
      await axios.post(
        `${API}/stock-processing/${item.id}/complete/`,
        {
          quantity: Number(quantity),
        }
      );

      alert("Processed stock returned successfully.");

      loadData();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail ||
        "Failed to return stock."
      );
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="container-fluid p-4">

      <h2 className="mb-4">
        Stock Processing
      </h2>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* =====================================================
          CREATE PROCESSING
      ===================================================== */}

      <div className="card mb-4">
        <div className="card-header">
          <strong>Create Stock Processing</strong>
        </div>

        <div className="card-body">

          <form onSubmit={handleSubmit}>

            <div className="row g-3">

              {/* Process Type */}

              <div className="col-md-3">
                <label className="form-label">
                  Process Type
                </label>

                <select
                  className="form-select"
                  name="process_type"
                  value={form.process_type}
                  onChange={handleChange}
                >
                  <option value="STITCHING">
                    Stitching
                  </option>

                  <option value="EMBROIDERY">
                    Embroidery
                  </option>

                  <option value="ALTERATION">
                    Alteration
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </div>

              {/* Input Product */}

              <div className="col-md-3">
                <label className="form-label">
                  Input Product
                </label>

                <select
                  className="form-select"
                  name="input_product"
                  value={form.input_product}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name || product.product_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Quantity */}

              <div className="col-md-2">
                <label className="form-label">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  className="form-control"
                  name="input_quantity"
                  value={form.input_quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Output Product */}

              <div className="col-md-3">
                <label className="form-label">
                  Output Product
                </label>

                <select
                  className="form-select"
                  name="output_product"
                  value={form.output_product}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name || product.product_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Output Quantity */}

              <div className="col-md-2">
                <label className="form-label">
                  Expected Output
                </label>

                <input
                  type="number"
                  min="0"
                  className="form-control"
                  name="output_quantity"
                  value={form.output_quantity}
                  onChange={handleChange}
                />
              </div>

              {/* Employee */}

              <div className="col-md-3">
                <label className="form-label">
                  Employee
                </label>

                <select
                  className="form-select"
                  name="employee"
                  value={form.employee}
                  onChange={handleChange}
                >
                  <option value="">
                    Select Employee
                  </option>

                  {employees.map((employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Date */}

              <div className="col-md-3">
                <label className="form-label">
                  Expected Date
                </label>

                <input
                  type="date"
                  className="form-control"
                  name="expected_date"
                  value={form.expected_date}
                  onChange={handleChange}
                />
              </div>

              {/* Remarks */}

              <div className="col-md-6">
                <label className="form-label">
                  Remarks
                </label>

                <input
                  type="text"
                  className="form-control"
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Optional remarks"
                />
              </div>

              {/* Submit */}

              <div className="col-12">

                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Create Processing
                </button>

              </div>

            </div>

          </form>

        </div>
      </div>

      {/* =====================================================
          PROCESSING LIST
      ===================================================== */}

      <div className="card">

        <div className="card-header">
          <strong>Processing List</strong>
        </div>

        <div className="card-body p-0">

          {loading ? (
            <div className="p-4">
              Loading...
            </div>
          ) : (

            <div className="table-responsive">

              <table className="table table-bordered table-hover mb-0">

                <thead>

                  <tr>
                    <th>#</th>
                    <th>Process</th>
                    <th>Input Product</th>
                    <th>Input Qty</th>
                    <th>Issued</th>
                    <th>Output Product</th>
                    <th>Returned</th>
                    <th>Employee</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {processing.length === 0 ? (

                    <tr>
                      <td
                        colSpan="10"
                        className="text-center p-4"
                      >
                        No processing records found.
                      </td>
                    </tr>

                  ) : (

                    processing.map((item, index) => (

                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {item.process_type_display ||
                            item.process_type}
                        </td>

                        <td>
                          {item.input_product_name}
                        </td>

                        <td>
                          {item.input_quantity}
                        </td>

                        <td>
                          {item.issued_quantity}
                        </td>

                        <td>
                          {item.output_product_name}
                        </td>

                        <td>
                          {item.returned_quantity}
                        </td>

                        <td>
                          {item.employee_name || "-"}
                        </td>

                        <td>
                          {item.status_display ||
                            item.status}
                        </td>

                        <td>

                          {!item.is_fully_issued && (
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => issueStock(item)}
                            >
                              Issue
                            </button>
                          )}

                          {item.issued_quantity >
                            item.returned_quantity && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() =>
                                returnStock(item)
                              }
                            >
                              Return
                            </button>
                          )}

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}