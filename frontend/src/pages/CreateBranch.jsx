import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateBranch.css";
import api from "../services/api";
function CreateBranch() {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        name: "",
        address: "",
        phone: "",
        manager_name: "",
        username: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const [saving, setSaving] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
        const response = await api.post("branches/", {
            name: form.name.trim(),
            address: form.address.trim(),
            phone: form.phone.trim(),
            manager_name: form.manager_name.trim(),
            username: form.username.trim(),
            password: form.password,
        });

        console.log("Branch created:", response.data);

        setSuccess("Branch created successfully.");

        setTimeout(() => {
            navigate("/branches");
        }, 800);

    } catch (err) {
        console.error("Branch creation error:", err);

        if (err.response?.data?.error) {
            setError(err.response.data.error);
        } else if (err.response?.data) {
            setError(
                Object.values(err.response.data)
                    .flat()
                    .join(" ")
            );
        } else {
            setError(
                "Unable to create branch. Please try again."
            );
        }

    } finally {
        setSaving(false);
    }
};

    return (
        <div className="create-branch-page">

            {/* PAGE HEADER */}
            <div className="page-header">

                <div>
                    <h2 className="fw-bold mb-1">
                        <i className="bi bi-building-fill me-2"></i>
                        Create Branch
                    </h2>

                    <p className="text-muted mb-0">
                        Add a new branch and create its manager login.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-light border"
                    onClick={() => navigate("/branches")}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back
                </button>

            </div>


            {/* FORM CARD */}
            <div className="branch-form-card">

                {/* FORM HEADER */}
                <div className="branch-form-header">

                    <div className="branch-icon">
                        <i className="bi bi-building"></i>
                    </div>

                    <div>
                        <h4>Branch Information</h4>

                        <p>
                            Enter the branch details and manager login information.
                        </p>
                    </div>

                </div>


                <form onSubmit={handleSubmit}>
                    {error && (
    <div className="branch-error-alert">
        <i className="bi bi-exclamation-triangle-fill"></i>
        <span>{error}</span>
    </div>
)}

{success && (
    <div className="branch-success-alert">
        <i className="bi bi-check-circle-fill"></i>
        <span>{success}</span>
    </div>
)}

                    {/* BRANCH DETAILS */}
                    <div className="form-section">

                        <div className="section-title">
                            <i className="bi bi-info-circle-fill"></i>
                            <span>Branch Details</span>
                            <div className="section-line"></div>
                        </div>


                        {/* BRANCH NAME */}
                        <div className="form-group">

                            <label className="form-label">
                                Branch Name
                                <span className="required">*</span>
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Enter branch name"
                                required
                            />

                            <small className="form-help">
                                Enter the official name of the branch.
                            </small>

                        </div>


                        {/* ADDRESS */}
                        <div className="form-group">

                            <label className="form-label">
                                Branch Address
                                <span className="required">*</span>
                            </label>

                            <textarea
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                className="form-control"
                                rows="3"
                                placeholder="Enter complete branch address"
                                required
                            />

                            <small className="form-help">
                                Enter the complete branch location.
                            </small>

                        </div>


                        <div className="form-row">

                            {/* PHONE */}
                            <div className="form-group">

                                <label className="form-label">
                                    Branch Phone
                                    <span className="required">*</span>
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter branch phone number"
                                    required
                                />

                                <small className="form-help">
                                    Enter the contact number for this branch.
                                </small>

                            </div>


                            {/* MANAGER NAME */}
                            <div className="form-group">

                                <label className="form-label">
                                    Manager Name
                                    <span className="required">*</span>
                                </label>

                                <input
                                    type="text"
                                    name="manager_name"
                                    value={form.manager_name}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter branch manager name"
                                    required
                                />

                                <small className="form-help">
                                    Name of the person managing this branch.
                                </small>

                            </div>

                        </div>

                    </div>


                    {/* MANAGER LOGIN */}
                    <div className="form-section">

                        <div className="section-title">
                            <i className="bi bi-shield-lock-fill"></i>
                            <span>Manager Login Details</span>
                            <div className="section-line"></div>
                        </div>


                        <div className="manager-info-alert">
                            <i className="bi bi-info-circle-fill"></i>

                            <div>
                                <strong>Manager Account</strong>

                                <p>
                                    A Branch user account will be created
                                    automatically using these login details.
                                </p>
                            </div>
                        </div>


                        {/* USERNAME */}
                        <div className="form-group">

                            <label className="form-label">
                                Manager Username
                                <span className="required">*</span>
                            </label>

                            <div className="input-group">

                                <span className="input-group-text">
                                    <i className="bi bi-person-fill"></i>
                                </span>

                                <input
                                    type="text"
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter manager username"
                                    autoComplete="username"
                                    required
                                />

                            </div>

                        </div>


                        {/* PASSWORD */}
                        <div className="form-group">

                            <label className="form-label">
                                Manager Password
                                <span className="required">*</span>
                            </label>

                            <div className="input-group">

                                <span className="input-group-text">
                                    <i className="bi bi-key-fill"></i>
                                </span>

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter manager password"
                                    autoComplete="new-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    <i
                                        className={
                                            showPassword
                                                ? "bi bi-eye-slash-fill"
                                                : "bi bi-eye-fill"
                                        }
                                    ></i>
                                </button>

                            </div>

                        </div>

                    </div>


                    {/* FORM FOOTER */}
                    <div className="form-footer">

                        <div className="required-note">
                            <span className="required">*</span>
                            Required fields
                        </div>

                        <div className="form-actions">

                            <button
                                type="button"
                                className="btn btn-light border"
                                onClick={() =>
                                    navigate("/branches")
                                }
                            >
                                Cancel
                            </button>

                            <button
    type="submit"
    className="btn btn-primary save-branch-btn"
    disabled={saving}
>
    {saving ? (
        <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Saving...
        </>
    ) : (
        <>
            <i className="bi bi-check-circle-fill me-2"></i>
            Save Branch
        </>
    )}
</button>

                        </div>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default CreateBranch;