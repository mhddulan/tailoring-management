import React, { useEffect, useState } from "react";
import api from "../services/api";

const ProductionJob = () => {
    const [jobs, setJobs] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        customer: "",
        job_type: "",
        job_date: new Date().toISOString().split("T")[0],
        expected_delivery: "",
        quantity: "",
        total_amount: "",
        advance: "",
        status: "Pending",
        remarks: "",
    });

    useEffect(() => {
        loadJobs();
        loadCustomers();
    }, []);

    const loadJobs = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("production-jobs/");

            setJobs(
                Array.isArray(response.data)
                    ? response.data
                    : response.data.results || []
            );
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.detail ||
                "Unable to load production jobs."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadCustomers = async () => {
        try {
            const response = await api.get("customers/");

            setCustomers(
                Array.isArray(response.data)
                    ? response.data
                    : response.data.results || []
            );
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.detail ||
                "Unable to load customers."
            );
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const calculateBalance = () => {
        const total = Number(form.total_amount || 0);
        const advance = Number(form.advance || 0);

        return Math.max(total - advance, 0);
    };

    const resetForm = () => {
        setForm({
            customer: "",
            job_type: "",
            job_date: new Date().toISOString().split("T")[0],
            expected_delivery: "",
            quantity: "",
            total_amount: "",
            advance: "",
            status: "Pending",
            remarks: "",
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.customer) {
            setError("Please select a customer.");
            return;
        }

        if (!form.job_type.trim()) {
            setError("Please enter the job type.");
            return;
        }

        if (!form.quantity || Number(form.quantity) <= 0) {
            setError("Quantity must be greater than 0.");
            return;
        }

        if (!form.total_amount || Number(form.total_amount) < 0) {
            setError("Please enter a valid total amount.");
            return;
        }

        if (Number(form.advance || 0) > Number(form.total_amount || 0)) {
            setError("Advance cannot be greater than total amount.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                customer: Number(form.customer),
                job_type: form.job_type,
                job_date: form.job_date,
                expected_delivery: form.expected_delivery || null,
                quantity: Number(form.quantity),
                total_amount: form.total_amount || "0",
                advance: form.advance || "0",
                status: form.status,
                remarks: form.remarks,
            };

            await api.post("production-jobs/", payload);

            setSuccess("Production job created successfully.");

            resetForm();
            setShowForm(false);

            await loadJobs();
        } catch (err) {
            console.error(err);

            const data = err.response?.data;

            if (typeof data === "object") {
                const messages = Object.entries(data)
                    .map(([field, message]) => {
                        if (Array.isArray(message)) {
                            return `${field}: ${message.join(", ")}`;
                        }

                        return `${field}: ${message}`;
                    })
                    .join(" | ");

                setError(messages || "Unable to create production job.");
            } else {
                setError("Unable to create production job.");
            }
        } finally {
            setSaving(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Completed":
                return "bg-success";
            case "Delivered":
                return "bg-primary";
            case "Processing":
                return "bg-warning text-dark";
            case "Cancelled":
                return "bg-danger";
            default:
                return "bg-secondary";
        }
    };

    return (
        <div className="container-fluid py-4">

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Production Jobs</h2>
                    <p className="text-muted mb-0">
                        Manage client production and job orders
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                        setShowForm(!showForm);
                        setError("");
                        setSuccess("");
                    }}
                >
                    {showForm ? "Close Form" : "+ New Production Job"}
                </button>
            </div>

            {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {success}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setSuccess("")}
                    />
                </div>
            )}

            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError("")}
                    />
                </div>
            )}

            {showForm && (
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white">
                        <h5 className="mb-0">Create Production Job</h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">

                                <div className="col-md-6">
                                    <label className="form-label">Customer</label>
                                    <select
                                        name="customer"
                                        value={form.customer}
                                        onChange={handleChange}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">Select Customer</option>

                                        {customers.map((customer) => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name}
                                                {customer.mobile
                                                    ? ` - ${customer.mobile}`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Job Type</label>
                                    <input
                                        type="text"
                                        name="job_type"
                                        value={form.job_type}
                                        onChange={handleChange}
                                        className="form-control"
                                        placeholder="Example: Embroidery"
                                        required
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Job Date</label>
                                    <input
                                        type="date"
                                        name="job_date"
                                        value={form.job_date}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Expected Delivery</label>
                                    <input
                                        type="date"
                                        name="expected_delivery"
                                        value={form.expected_delivery}
                                        onChange={handleChange}
                                        className="form-control"
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={form.quantity}
                                        onChange={handleChange}
                                        className="form-control"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Total Amount</label>
                                    <input
                                        type="number"
                                        name="total_amount"
                                        value={form.total_amount}
                                        onChange={handleChange}
                                        className="form-control"
                                        min="0"
                                        step="0.01"
                                        placeholder="50000"
                                        required
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Advance</label>
                                    <input
                                        type="number"
                                        name="advance"
                                        value={form.advance}
                                        onChange={handleChange}
                                        className="form-control"
                                        min="0"
                                        step="0.01"
                                        placeholder="20000"
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Balance</label>
                                    <input
                                        type="text"
                                        value={calculateBalance().toFixed(2)}
                                        className="form-control bg-light"
                                        readOnly
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Status</label>
                                    <select
                                        name="status"
                                        value={form.status}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div className="col-md-8">
                                    <label className="form-label">Remarks</label>
                                    <textarea
                                        name="remarks"
                                        value={form.remarks}
                                        onChange={handleChange}
                                        className="form-control"
                                        rows="3"
                                        placeholder="Job details..."
                                    />
                                </div>
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={() => {
                                        resetForm();
                                        setShowForm(false);
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Create Job"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Production Job List</h5>

                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={loadJobs}
                    >
                        Refresh
                    </button>
                </div>

                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" />
                            <div className="mt-2 text-muted">
                                Loading production jobs...
                            </div>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center py-5">
                            <h6>No production jobs found</h6>
                            <p className="text-muted mb-0">
                                Create your first production job.
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Customer</th>
                                        <th>Job Type</th>
                                        <th>Qty</th>
                                        <th>Total</th>
                                        <th>Advance</th>
                                        <th>Balance</th>
                                        <th>Delivery</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {jobs.map((job) => (
                                        <tr key={job.id}>
                                            <td>#{job.id}</td>

                                            <td>
                                                <strong>
                                                    {job.customer_name || job.customer}
                                                </strong>

                                                {job.customer_mobile && (
                                                    <div className="small text-muted">
                                                        {job.customer_mobile}
                                                    </div>
                                                )}
                                            </td>

                                            <td>{job.job_type}</td>
                                            <td>{job.quantity}</td>

                                            <td>
                                                {Number(job.total_amount || 0).toFixed(2)}
                                            </td>

                                            <td>
                                                {Number(job.advance || 0).toFixed(2)}
                                            </td>

                                            <td>
                                                <strong>
                                                    {Number(job.balance || 0).toFixed(2)}
                                                </strong>
                                            </td>

                                            <td>
                                                {job.expected_delivery || "-"}
                                            </td>

                                            <td>
                                                <span className={`badge ${getStatusClass(job.status)}`}>
                                                    {job.status_display || job.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductionJob;
