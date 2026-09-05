import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./CustomerCreate.css";

function CustomerEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        mobile: "",
        address: "",
        branch: "",
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [customerResponse, branchResponse] =
                await Promise.all([
                    api.get(`customers/${id}/`),
                    api.get("branches/"),
                ]);

            const customer = customerResponse.data;
            const branchData = branchResponse.data;

            setForm({
                name: customer.name || "",
                mobile: customer.mobile || "",
                address: customer.address || "",
                branch: customer.branch || "",
            });

            if (Array.isArray(branchData)) {
                setBranches(branchData);
            } else if (Array.isArray(branchData.results)) {
                setBranches(branchData.results);
            }

        } catch (err) {
            console.error("Customer edit loading error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load customer details."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            setError("Customer name is required.");
            return;
        }

        if (!form.branch) {
            setError("Please select a branch.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            await api.put(`customers/${id}/`, {
                name: form.name.trim(),
                mobile: form.mobile.trim(),
                address: form.address.trim(),
                branch: Number(form.branch),
            });

            navigate(`/customers/${id}`);

        } catch (err) {
            console.error("Customer update error:", err);

            const data = err.response?.data;

            if (data && typeof data === "object") {
                const messages = Object.entries(data)
                    .map(([field, value]) => {
                        const message = Array.isArray(value)
                            ? value.join(", ")
                            : String(value);

                        return `${field}: ${message}`;
                    })
                    .join(" | ");

                setError(
                    messages || "Unable to update customer."
                );
            } else {
                setError("Unable to update customer.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="customer-create-page">

                <div className="customer-edit-loading">

                    <div
                        className="spinner-border text-primary"
                        role="status"
                    ></div>

                    <p>
                        Loading customer...
                    </p>

                </div>

            </div>
        );
    }

    return (
        <div className="customer-create-page">

            {/* HEADER */}

            <div className="page-header-block">

                <div>

                    <h2 className="page-header-title">
                        Edit Customer
                    </h2>

                    <p className="page-header-sub">
                        Update customer information and profile details.
                    </p>

                </div>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                        navigate(`/customers/${id}`)
                    }
                >
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Customer
                </button>

            </div>


            {/* ERROR */}

            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}


            <form onSubmit={handleSubmit}>

                <div className="customer-form-card">

                    <div className="customer-form-card-header">
                        <i className="bi bi-person-vcard-fill"></i>
                        Customer Information
                    </div>

                    <div className="customer-form-card-body">

                        <div className="row g-3">

                            {/* NAME */}

                            <div className="col-md-6">

                                <label className="customer-form-label">
                                    Customer Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter customer name"
                                    required
                                />

                            </div>


                            {/* MOBILE */}

                            <div className="col-md-6">

                                <label className="customer-form-label">
                                    Mobile Number
                                </label>

                                <input
                                    type="text"
                                    name="mobile"
                                    value={form.mobile}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter mobile number"
                                />

                            </div>


                            {/* ADDRESS */}

                            <div className="col-md-6">

                                <label className="customer-form-label">
                                    Address
                                </label>

                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    className="form-control"
                                    rows="3"
                                    placeholder="Enter customer address"
                                />

                            </div>


                            {/* BRANCH */}

                            <div className="col-md-6">

                                <label className="customer-form-label">
                                    Branch
                                </label>

                                <select
                                    name="branch"
                                    value={form.branch}
                                    onChange={handleChange}
                                    className="form-select"
                                    required
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

                        </div>

                    </div>

                </div>


                {/* CUSTOMER ID */}

                <div className="customer-form-card">

                    <div className="customer-form-card-header">
                        <i className="bi bi-info-circle"></i>
                        Customer Information
                    </div>

                    <div className="customer-form-card-body">

                        <div className="text-muted">
                            Customer ID:
                            <strong className="ms-1">
                                #{id}
                            </strong>
                        </div>

                    </div>

                </div>


                {/* ACTIONS */}

                <div className="customer-form-actions">

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                            navigate(`/customers/${id}`)
                        }
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                    >

                        {saving ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                ></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-circle me-1"></i>
                                Save Changes
                            </>
                        )}

                    </button>

                </div>

            </form>

        </div>
    );
}

export default CustomerEdit;