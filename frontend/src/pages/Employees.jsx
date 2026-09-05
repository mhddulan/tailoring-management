import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Employees() {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadEmployees = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                `/employees/?search=${encodeURIComponent(search)}`
            );

            setEmployees(
                Array.isArray(response.data)
                    ? response.data
                    : response.data.results || []
            );

            setError("");
        } catch (err) {
            console.error(err);
            setError("Unable to load employees.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        loadEmployees();
    };

    const deleteEmployee = async (id) => {
        if (!window.confirm("Are you sure you want to delete this employee?")) {
            return;
        }

        try {
            await api.delete(`/employees/${id}/`);
            loadEmployees();
        } catch (err) {
            console.error(err);
            alert(
                err.response?.data?.detail ||
                "Unable to delete employee."
            );
        }
    };

    return (
        <div className="container-fluid py-4">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="fw-bold mb-1">
                        <i className="bi bi-people-fill me-2"></i>
                        Employee Management
                    </h2>

                    <p className="text-muted mb-0">
                        Manage employees and their branch assignments
                    </p>
                </div>

                <Link
                    to="/employees/create"
                    className="btn btn-dark rounded-3 px-4"
                >
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Employee
                </Link>

            </div>


            {/* Search */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">

                <div className="card-body">

                    <form
                        onSubmit={handleSearch}
                        className="row g-3"
                    >

                        <div className="col-md-10">

                            <div className="input-group">

                                <span className="input-group-text bg-white">
                                    <i className="bi bi-search"></i>
                                </span>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search employee, mobile, designation or branch..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                />

                            </div>

                        </div>

                        <div className="col-md-2">

                            <button
                                type="submit"
                                className="btn btn-dark w-100"
                            >
                                Search
                            </button>

                        </div>

                    </form>

                </div>

            </div>


            {/* Error */}
            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}


            {/* Employee Table */}
            <div className="card border-0 shadow-sm rounded-4">

                <div className="card-body p-0">

                    <div className="table-responsive">

                        <table className="table table-hover align-middle mb-0">

                            <thead className="table-light">

                                <tr>
                                    <th className="px-4">#</th>
                                    <th>Employee</th>
                                    <th>Mobile</th>
                                    <th>Designation</th>
                                    <th>Branch</th>
                                    <th>Salary</th>
                                    <th>Joining Date</th>
                                    <th>Status</th>
                                    <th className="text-end px-4">
                                        Actions
                                    </th>
                                </tr>

                            </thead>

                            <tbody>

                                {loading ? (

                                    <tr>
                                        <td
                                            colSpan="9"
                                            className="text-center py-5"
                                        >
                                            <div className="spinner-border"></div>
                                            <div className="mt-2 text-muted">
                                                Loading employees...
                                            </div>
                                        </td>
                                    </tr>

                                ) : employees.length === 0 ? (

                                    <tr>
                                        <td
                                            colSpan="9"
                                            className="text-center py-5 text-muted"
                                        >
                                            <i className="bi bi-people fs-1 d-block mb-2"></i>
                                            No employees found.
                                        </td>
                                    </tr>

                                ) : (

                                    employees.map((employee, index) => (

                                        <tr key={employee.id}>

                                            <td className="px-4">
                                                {index + 1}
                                            </td>

                                            <td>
                                                <div className="fw-semibold">
                                                    {employee.name}
                                                </div>

                                                <small className="text-muted">
                                                    Employee #{employee.id}
                                                </small>
                                            </td>

                                            <td>
                                                {employee.mobile || "-"}
                                            </td>

                                            <td>
                                                {employee.designation || "-"}
                                            </td>

                                            <td>
                                                {employee.branch_name ||
                                                    employee.branch?.name ||
                                                    "-"}
                                            </td>

                                            <td>
                                                SAR{" "}
                                                {Number(
                                                    employee.salary || 0
                                                ).toFixed(2)}
                                            </td>

                                            <td>
                                                {employee.joining_date || "-"}
                                            </td>

                                            <td>

                                                {employee.active ? (
                                                    <span className="badge bg-success-subtle text-success">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-secondary-subtle text-secondary">
                                                        Inactive
                                                    </span>
                                                )}

                                            </td>

                                            <td className="text-end px-4">

                                                <div className="btn-group">

                                                    <Link
                                                        to={`/employees/${employee.id}/performance`}
                                                        className="btn btn-sm btn-outline-success"
                                                        title="Performance"
                                                    >
                                                        <i className="bi bi-graph-up"></i>
                                                    </Link>

                                                    <Link
                                                        to={`/employees/${employee.id}/edit`}
                                                        className="btn btn-sm btn-outline-primary"
                                                        title="Edit"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </Link>

                                                    <button
                                                        onClick={() =>
                                                            deleteEmployee(
                                                                employee.id
                                                            )
                                                        }
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Delete"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Employees;