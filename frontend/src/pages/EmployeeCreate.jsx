import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function EmployeeCreate() {

    const navigate = useNavigate();

    const [branches, setBranches] = useState([]);

    const [form, setForm] = useState({
        branch: "",
        name: "",
        mobile: "",
        designation: "",
        salary: "",
        joining_date: "",
        active: true,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = async () => {
        try {
            const response = await api.get("/branches/");

            setBranches(
                Array.isArray(response.data)
                    ? response.data
                    : response.data.results || []
            );
        } catch (err) {
            console.error(err);
            setError("Unable to load branches.");
        }
    };

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!form.branch) {
            setError("Please select a branch.");
            return;
        }

        if (!form.name.trim()) {
            setError("Employee name is required.");
            return;
        }

        if (!form.mobile.trim()) {
            setError("Mobile number is required.");
            return;
        }

        if (!/^\d+$/.test(form.mobile)) {
            setError("Mobile must contain only digits.");
            return;
        }

        if (!form.designation.trim()) {
            setError("Designation is required.");
            return;
        }

        if (Number(form.salary) < 0) {
            setError("Salary cannot be negative.");
            return;
        }

        try {

            setLoading(true);

            await api.post("/employees/", {
                branch: Number(form.branch),
                name: form.name.trim(),
                mobile: form.mobile.trim(),
                designation: form.designation.trim(),
                salary: Number(form.salary || 0),
                joining_date: form.joining_date || null,
                active: form.active,
            });

            navigate("/employees");

        } catch (err) {

            console.error(err);

            const data = err.response?.data;

            if (typeof data === "object") {
                setError(
                    Object.values(data)
                        .flat()
                        .join(" ")
                );
            } else {
                setError("Unable to create employee.");
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid py-4">

            <div className="mb-4">

                <Link
                    to="/employees"
                    className="text-decoration-none text-muted"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Employees
                </Link>

                <h2 className="fw-bold mt-2 mb-1">
                    Add Employee
                </h2>

                <p className="text-muted mb-0">
                    Add a new employee to a branch
                </p>

            </div>


            <div className="card border-0 shadow-sm rounded-4">

                <div className="card-body p-4">

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="row g-4">

                            {/* Branch */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
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


                            {/* Name */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Employee Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Employee name"
                                    required
                                />

                            </div>


                            {/* Mobile */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Mobile
                                </label>

                                <input
                                    type="text"
                                    name="mobile"
                                    value={form.mobile}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Mobile number"
                                    required
                                />

                            </div>


                            {/* Designation */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Designation
                                </label>

                                <input
                                    type="text"
                                    name="designation"
                                    value={form.designation}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Tailor"
                                    required
                                />

                            </div>


                            {/* Salary */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Salary
                                </label>

                                <div className="input-group">

                                    <span className="input-group-text">
                                        SAR
                                    </span>

                                    <input
                                        type="number"
                                        name="salary"
                                        value={form.salary}
                                        onChange={handleChange}
                                        className="form-control"
                                        min="0"
                                        step="0.01"
                                        required
                                    />

                                </div>

                            </div>


                            {/* Joining date */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Joining Date
                                </label>

                                <input
                                    type="date"
                                    name="joining_date"
                                    value={form.joining_date}
                                    onChange={handleChange}
                                    className="form-control"
                                />

                            </div>


                            {/* Active */}
                            <div className="col-12">

                                <div className="form-check">

                                    <input
                                        type="checkbox"
                                        name="active"
                                        checked={form.active}
                                        onChange={handleChange}
                                        className="form-check-input"
                                        id="active"
                                    />

                                    <label
                                        htmlFor="active"
                                        className="form-check-label"
                                    >
                                        Employee is active
                                    </label>

                                </div>

                            </div>


                            {/* Buttons */}
                            <div className="col-12">

                                <hr />

                                <div className="d-flex justify-content-end gap-2">

                                    <Link
                                        to="/employees"
                                        className="btn btn-light px-4"
                                    >
                                        Cancel
                                    </Link>

                                    <button
                                        type="submit"
                                        className="btn btn-dark px-4"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-lg me-2"></i>
                                                Save Employee
                                            </>
                                        )}
                                    </button>

                                </div>

                            </div>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default EmployeeCreate;