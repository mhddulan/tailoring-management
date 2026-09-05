import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function EmployeeEdit() {

    const { id } = useParams();
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

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {

        try {

            const [employeeResponse, branchResponse] =
                await Promise.all([
                    api.get(`/employees/${id}/`),
                    api.get("/branches/"),
                ]);

            const employee = employeeResponse.data;

            setForm({
                branch:
                    employee.branch ||
                    employee.branch_id ||
                    "",
                name: employee.name || "",
                mobile: employee.mobile || "",
                designation: employee.designation || "",
                salary: employee.salary || "",
                joining_date: employee.joining_date || "",
                active: employee.active ?? true,
            });

            setBranches(
                Array.isArray(branchResponse.data)
                    ? branchResponse.data
                    : branchResponse.data.results || []
            );

        } catch (err) {

            console.error(err);
            setError("Unable to load employee.");

        } finally {

            setLoading(false);

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

        if (!form.name.trim()) {
            setError("Employee name is required.");
            return;
        }

        if (!/^\d+$/.test(form.mobile)) {
            setError("Mobile must contain only digits.");
            return;
        }

        if (Number(form.salary) < 0) {
            setError("Salary cannot be negative.");
            return;
        }

        try {

            setSaving(true);

            await api.put(`/employees/${id}/`, {
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
                setError("Unable to update employee.");
            }

        } finally {

            setSaving(false);

        }
    };

    if (loading) {
        return (
            <div className="container-fluid py-5 text-center">
                <div className="spinner-border"></div>
                <p className="text-muted mt-2">
                    Loading employee...
                </p>
            </div>
        );
    }

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
                    Edit Employee
                </h2>

                <p className="text-muted mb-0">
                    Update employee information
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
                                    required
                                />

                            </div>


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
                                    required
                                />

                            </div>


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
                                    required
                                />

                            </div>


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
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-lg me-2"></i>
                                                Update Employee
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

export default EmployeeEdit;