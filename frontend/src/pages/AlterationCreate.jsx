import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const initialForm = {
  branch: "",
  customer: "",
  customer_name: "",
  phone: "",

  alteration_date: new Date().toISOString().split("T")[0],

  expected_delivery_date: "",
  expected_delivery_time: "",

  product: "",
  item_name: "",

  custom_size: "",
  notes: "",

  assigned_employee: "",

  total_amount: "",
  advance_amount: "",
  advance_payment_mode: "Cash",

  status: "Pending",
};

export default function AlterationCreate() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        branchesRes,
        customersRes,
        employeesRes,
        productsRes,
      ] = await Promise.all([
        api.get("branches/"),
        api.get("customers/"),
        api.get("employees/"),
        api.get("products/"),
      ]);

      setBranches(getResults(branchesRes.data));
      setCustomers(getResults(customersRes.data));
      setEmployees(getResults(employeesRes.data));
      setProducts(getResults(productsRes.data));
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Failed to load alteration data."
      );
    } finally {
      setLoading(false);
    }
  };

  const getResults = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  // --------------------------------------------------
  // INPUT CHANGE
  // --------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // CUSTOMER CHANGE
  // --------------------------------------------------
  const handleCustomerChange = (e) => {
    const customerId = e.target.value;

    const customer = customers.find(
      (item) => String(item.id) === String(customerId)
    );

    if (!customer) {
      setForm((prev) => ({
        ...prev,
        customer: "",
        customer_name: "",
        phone: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,

      customer: customer.id,

      customer_name: customer.name || "",

      phone: customer.mobile || "",

      branch: customer.branch || prev.branch,

      assigned_employee: "",
    }));
  };

  // --------------------------------------------------
  // PRODUCT CHANGE
  // --------------------------------------------------
  const handleProductChange = (e) => {
    const productId = e.target.value;

    setForm((prev) => ({
      ...prev,
      product: productId,
      item_name: productId ? "" : prev.item_name,
    }));
  };

  // --------------------------------------------------
  // BRANCH CHANGE
  // --------------------------------------------------
  const handleBranchChange = (e) => {
    const branchId = e.target.value;

    setForm((prev) => ({
      ...prev,

      branch: branchId,

      customer: "",
      customer_name: "",
      phone: "",

      assigned_employee: "",
    }));
  };

  // --------------------------------------------------
  // FILTER CUSTOMERS BY BRANCH
  // --------------------------------------------------
  const availableCustomers = useMemo(() => {
    if (!form.branch) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        String(customer.branch) === String(form.branch)
    );
  }, [customers, form.branch]);

  // --------------------------------------------------
  // FILTER EMPLOYEES BY BRANCH
  // --------------------------------------------------
  const availableEmployees = useMemo(() => {
    if (!form.branch) {
      return employees;
    }

    return employees.filter(
      (employee) =>
        String(employee.branch) === String(form.branch)
    );
  }, [employees, form.branch]);

  // --------------------------------------------------
  // BALANCE
  // --------------------------------------------------
  const totalAmount = Number(form.total_amount || 0);

  const advanceAmount = Number(form.advance_amount || 0);

  const balanceAmount = Math.max(
    totalAmount - advanceAmount,
    0
  );

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Customer validation
    if (!form.customer) {
      setError("Please select a customer.");
      return;
    }

    // Item validation
    if (!form.product && !form.item_name.trim()) {
      setError("Please select a product or enter an Other Item.");
      return;
    }

    // Total validation
    if (totalAmount <= 0) {
      setError("Total amount must be greater than 0.");
      return;
    }

    // Advance validation
    if (advanceAmount < 0) {
      setError("Advance amount cannot be negative.");
      return;
    }

    if (advanceAmount > totalAmount) {
      setError("Advance cannot be greater than total amount.");
      return;
    }

    // Expected delivery validation
    if (!form.expected_delivery_date) {
      setError("Please select expected delivery date.");
      return;
    }

    if (!form.expected_delivery_time) {
      setError("Please select expected delivery time.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        branch: form.branch || null,

        customer_name: form.customer_name,
        phone: form.phone,

        alteration_date: form.alteration_date,

        expected_delivery_date:
          form.expected_delivery_date,

        expected_delivery_time:
          form.expected_delivery_time,

        product: form.product
          ? Number(form.product)
          : null,

        item_name: form.product
          ? ""
          : form.item_name.trim(),

        custom_size: form.custom_size,

        notes: form.notes,

        assigned_employee: form.assigned_employee
          ? Number(form.assigned_employee)
          : null,

        total_amount: totalAmount,

        advance_amount: advanceAmount,

        advance_payment_mode:
          form.advance_payment_mode,

        // Always create as Pending.
        // Delivery will happen through Deliver action.
        status: "Pending",
      };

      await api.post("alterations/", payload);

      navigate("/alterations");
    } catch (err) {
      console.error(err);

      const data = err.response?.data;

      if (typeof data === "object") {
        const messages = Object.entries(data)
          .map(([key, value]) => {
            const message = Array.isArray(value)
              ? value.join(", ")
              : value;

            return `${key}: ${message}`;
          })
          .join("\n");

        setError(messages || "Failed to create alteration.");
      } else {
        setError("Failed to create alteration.");
      }
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          Loading...
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="container-fluid py-4">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">
            Create Alteration
          </h3>

          <p className="text-muted mb-0">
            Create a new alteration job
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate("/alterations")}
        >
          ← Back
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className="alert alert-danger"
          style={{ whiteSpace: "pre-line" }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* CUSTOMER DETAILS */}
        <div className="card shadow-sm mb-4">

          <div className="card-header">
            <h5 className="mb-0">
              Customer Details
            </h5>
          </div>

          <div className="card-body">

            <div className="row g-3">

              {/* BRANCH */}
              <div className="col-md-4">
                <label className="form-label">
                  Branch
                </label>

                <select
                  name="branch"
                  value={form.branch}
                  onChange={handleBranchChange}
                  className="form-select"
                >
                  <option value="">
                    Select Branch
                  </option>

                  {branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CUSTOMER */}
              <div className="col-md-4">
                <label className="form-label">
                  Customer <span className="text-danger">*</span>
                </label>

                <select
                  name="customer"
                  value={form.customer}
                  onChange={handleCustomerChange}
                  className="form-select"
                  required
                >
                  <option value="">
                    Select Customer
                  </option>

                  {availableCustomers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name} -{" "}
                      {customer.mobile}
                    </option>
                  ))}
                </select>
              </div>

              {/* CUSTOMER NAME */}
              <div className="col-md-4">
                <label className="form-label">
                  Customer Name
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={form.customer_name}
                  readOnly
                  placeholder="Customer name"
                />
              </div>

              {/* PHONE */}
              <div className="col-md-4">
                <label className="form-label">
                  Phone
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={form.phone}
                  readOnly
                  placeholder="Phone"
                />
              </div>

            </div>

          </div>
        </div>

        {/* ALTERATION DETAILS */}
        <div className="card shadow-sm mb-4">

          <div className="card-header">
            <h5 className="mb-0">
              Alteration Details
            </h5>
          </div>

          <div className="card-body">

            <div className="row g-3">

              {/* ALTERATION DATE */}
              <div className="col-md-4">
                <label className="form-label">
                  Alteration Date
                </label>

                <input
                  type="date"
                  name="alteration_date"
                  value={form.alteration_date}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              {/* EXPECTED DELIVERY DATE */}
              <div className="col-md-4">
                <label className="form-label">
                  Expected Delivery Date{" "}
                  <span className="text-danger">*</span>
                </label>

                <input
                  type="date"
                  name="expected_delivery_date"
                  value={form.expected_delivery_date}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              {/* EXPECTED DELIVERY TIME */}
              <div className="col-md-4">
                <label className="form-label">
                  Expected Delivery Time{" "}
                  <span className="text-danger">*</span>
                </label>

                <input
                  type="time"
                  name="expected_delivery_time"
                  value={form.expected_delivery_time}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              {/* PRODUCT */}
              <div className="col-md-6">
                <label className="form-label">
                  Product
                </label>

                <select
                  name="product"
                  value={form.product}
                  onChange={handleProductChange}
                  className="form-select"
                >
                  <option value="">
                    Other Item
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* OTHER ITEM */}
              <div className="col-md-6">
                <label className="form-label">
                  Other Item
                </label>

                <input
                  type="text"
                  name="item_name"
                  value={form.item_name}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      item_name: e.target.value,
                      product: "",
                    }));
                  }}
                  className="form-control"
                  placeholder="Example: Shirt, Pant"
                  disabled={Boolean(form.product)}
                />
              </div>

              {/* CUSTOM SIZE */}
              <div className="col-md-6">
                <label className="form-label">
                  Custom Size
                </label>

                <textarea
                  name="custom_size"
                  value={form.custom_size}
                  onChange={handleChange}
                  className="form-control"
                  rows="3"
                  placeholder="Enter alteration size/details"
                />
              </div>

              {/* NOTES */}
              <div className="col-md-6">
                <label className="form-label">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="form-control"
                  rows="3"
                  placeholder="Additional notes"
                />
              </div>

              {/* EMPLOYEE */}
              <div className="col-md-6">
                <label className="form-label">
                  Assigned Employee
                </label>

                <select
                  name="assigned_employee"
                  value={form.assigned_employee}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">
                    Select Employee
                  </option>

                  {availableEmployees.map((employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

          </div>
        </div>

        {/* PAYMENT DETAILS */}
        <div className="card shadow-sm mb-4">

          <div className="card-header">
            <h5 className="mb-0">
              Payment Details
            </h5>
          </div>

          <div className="card-body">

            <div className="row g-3">

              {/* TOTAL */}
              <div className="col-md-4">
                <label className="form-label">
                  Total Amount{" "}
                  <span className="text-danger">*</span>
                </label>

                <input
                  type="number"
                  name="total_amount"
                  value={form.total_amount}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* ADVANCE */}
              <div className="col-md-4">
                <label className="form-label">
                  Advance Amount
                </label>

                <input
                  type="number"
                  name="advance_amount"
                  value={form.advance_amount}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              {/* PAYMENT MODE */}
              <div className="col-md-4">
                <label className="form-label">
                  Advance Payment Mode
                </label>

                <select
                  name="advance_payment_mode"
                  value={form.advance_payment_mode}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="Online">Online</option>
                  <option value="Cheque">Cheque</option>
                  <option value="POS">POS</option>
                </select>
              </div>

            </div>

            {/* BALANCE */}
            <div className="mt-4 p-3 border rounded bg-light">

              <div className="row">

                <div className="col-md-4">
                  <small className="text-muted">
                    Total
                  </small>

                  <h5>
                    ₹ {totalAmount.toFixed(2)}
                  </h5>
                </div>

                <div className="col-md-4">
                  <small className="text-muted">
                    Advance
                  </small>

                  <h5>
                    ₹ {advanceAmount.toFixed(2)}
                  </h5>
                </div>

                <div className="col-md-4">
                  <small className="text-muted">
                    Balance
                  </small>

                  <h5 className="text-danger">
                    ₹ {balanceAmount.toFixed(2)}
                  </h5>
                </div>

              </div>

            </div>

          </div>
        </div>

        {/* STATUS */}
        <div className="card shadow-sm mb-4">

          <div className="card-header">
            <h5 className="mb-0">
              Status
            </h5>
          </div>

          <div className="card-body">

            <select
              name="status"
              value="Pending"
              className="form-select"
              disabled
            >
              <option value="Pending">
                Pending
              </option>
            </select>

            <small className="text-muted">
              New alterations are created as Pending.
              Delivery status will be updated when the
              alteration is delivered.
            </small>

          </div>
        </div>

        {/* BUTTONS */}
        <div className="d-flex justify-content-end gap-2">

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/alterations")}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Alteration"}
          </button>

        </div>

      </form>
    </div>
  );
}