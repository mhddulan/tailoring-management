import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Production() {

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const [productions, setProductions] = useState([]);
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);

    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);
    const [branch, setBranch] = useState("");
    const [employee, setEmployee] = useState("");
    const [product, setProduct] = useState("");

    const [totalPieces, setTotalPieces] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);

    const [loading, setLoading] = useState(false);

    const loadData = async () => {

        try {

            setLoading(true);

            const params = new URLSearchParams();

            if (fromDate) {
                params.append("from_date", fromDate);
            }

            if (toDate) {
                params.append("to_date", toDate);
            }

            if (branch) {
                params.append("branch", branch);
            }

            if (employee) {
                params.append("employee", employee);
            }

            if (product) {
                params.append("product", product);
            }

            const [
                productionResponse,
                branchResponse,
                employeeResponse,
                productResponse,
            ] = await Promise.all([
                api.get(`/production/?${params.toString()}`),
                api.get("/branches/"),
                api.get("/employees/"),
                api.get("/products/"),
            ]);

            const productionData =
                Array.isArray(productionResponse.data)
                    ? productionResponse.data
                    : productionResponse.data.results || [];

            const branchData =
                Array.isArray(branchResponse.data)
                    ? branchResponse.data
                    : branchResponse.data.results || [];

            const employeeData =
                Array.isArray(employeeResponse.data)
                    ? employeeResponse.data
                    : employeeResponse.data.results || [];

            const productData =
                Array.isArray(productResponse.data)
                    ? productResponse.data
                    : productResponse.data.results || [];

            setProductions(productionData);
            setBranches(branchData);
            setEmployees(employeeData);
            setProducts(productData);

            let pieces = 0;
            let amount = 0;

            productionData.forEach((item) => {
                pieces += Number(item.quantity || 0);
                amount += Number(item.total_amount || 0);
            });

            setTotalPieces(pieces);
            setTotalAmount(amount);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        loadData();
    }, [fromDate, toDate, branch, employee, product]);

    const deleteProduction = async (id) => {

        if (!window.confirm(
            "Are you sure you want to delete this production record?"
        )) {
            return;
        }

        try {

            await api.delete(`/production/${id}/`);

            loadData();

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.detail ||
                "Unable to delete production."
            );
        }
    };

    return (
        <div className="container-fluid py-4">

            {/* Header */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">
                        <i className="bi bi-bar-chart-fill me-2"></i>
                        Employee Production
                    </h2>

                    <p className="text-muted mb-0">
                        Track daily employee production and earnings
                    </p>

                </div>

                <Link
                    to="/production/create"
                    className="btn btn-dark rounded-3 px-4"
                >
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Production
                </Link>

            </div>


            {/* Filters */}

            <div className="card border-0 shadow-sm rounded-4 mb-4">

                <div className="card-body">

                    <div className="row g-3">

                        <div className="col-md-2">

                            <label className="form-label fw-semibold">
                                From Date
                            </label>

                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) =>
                                    setFromDate(e.target.value)
                                }
                                className="form-control"
                            />

                        </div>


                        <div className="col-md-2">

                            <label className="form-label fw-semibold">
                                To Date
                            </label>

                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) =>
                                    setToDate(e.target.value)
                                }
                                className="form-control"
                            />

                        </div>


                        <div className="col-md-2">

                            <label className="form-label fw-semibold">
                                Branch
                            </label>

                            <select
                                value={branch}
                                onChange={(e) =>
                                    setBranch(e.target.value)
                                }
                                className="form-select"
                            >

                                <option value="">
                                    All Branches
                                </option>

                                {branches.map((item) => (
                                    <option
                                        key={item.id}
                                        value={item.id}
                                    >
                                        {item.name}
                                    </option>
                                ))}

                            </select>

                        </div>


                        <div className="col-md-3">

                            <label className="form-label fw-semibold">
                                Employee
                            </label>

                            <select
                                value={employee}
                                onChange={(e) =>
                                    setEmployee(e.target.value)
                                }
                                className="form-select"
                            >

                                <option value="">
                                    All Employees
                                </option>

                                {employees.map((item) => (
                                    <option
                                        key={item.id}
                                        value={item.id}
                                    >
                                        {item.name}
                                    </option>
                                ))}

                            </select>

                        </div>


                        <div className="col-md-3">

                            <label className="form-label fw-semibold">
                                Product
                            </label>

                            <select
                                value={product}
                                onChange={(e) =>
                                    setProduct(e.target.value)
                                }
                                className="form-select"
                            >

                                <option value="">
                                    All Products
                                </option>

                                {products.map((item) => (
                                    <option
                                        key={item.id}
                                        value={item.id}
                                    >
                                        {item.name}
                                    </option>
                                ))}

                            </select>

                        </div>

                    </div>

                </div>

            </div>


            {/* Summary */}

            <div className="row g-4 mb-4">

                <div className="col-md-6">

                    <div className="card border-0 shadow-sm rounded-4">

                        <div className="card-body">

                            <div className="text-muted mb-1">
                                Total Pieces
                            </div>

                            <h2 className="fw-bold mb-0">
                                {totalPieces}
                            </h2>

                        </div>

                    </div>

                </div>


                <div className="col-md-6">

                    <div className="card border-0 shadow-sm rounded-4">

                        <div className="card-body">

                            <div className="text-muted mb-1">
                                Total Production Amount
                            </div>

                            <h2 className="fw-bold mb-0">
                                SAR {totalAmount.toFixed(2)}
                            </h2>

                        </div>

                    </div>

                </div>

            </div>


            {/* Table */}

            <div className="card border-0 shadow-sm rounded-4">

                <div className="card-body p-0">

                    <div className="table-responsive">

                        <table className="table table-hover align-middle mb-0">

                            <thead className="table-light">

                                <tr>

                                    <th className="px-4">
                                        Date
                                    </th>

                                    <th>
                                        Employee
                                    </th>

                                    <th>
                                        Branch
                                    </th>

                                    <th>
                                        Product
                                    </th>

                                    <th>
                                        Quantity
                                    </th>

                                    <th>
                                        Rate / Piece
                                    </th>

                                    <th>
                                        Amount
                                    </th>

                                    <th>
                                        Remarks
                                    </th>

                                    <th>
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
                                                Loading production...
                                            </div>

                                        </td>

                                    </tr>

                                ) : productions.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="9"
                                            className="text-center py-5 text-muted"
                                        >
                                            No production records found.
                                        </td>

                                    </tr>

                                ) : (

                                    productions.map((item) => (

                                        <tr key={item.id}>

                                            <td className="px-4">
                                                {item.production_date}
                                            </td>

                                            <td className="fw-semibold">
                                                {item.employee_name ||
                                                    item.employee?.name ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {item.branch_name ||
                                                    item.branch?.name ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {item.product_name ||
                                                    item.product?.name ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {item.quantity}
                                            </td>

                                            <td>
                                                SAR{" "}
                                                {Number(
                                                    item.rate_per_piece || 0
                                                ).toFixed(2)}
                                            </td>

                                            <td className="fw-semibold">
                                                SAR{" "}
                                                {Number(
                                                    item.total_amount || 0
                                                ).toFixed(2)}
                                            </td>

                                            <td>
                                                {item.remarks || "-"}
                                            </td>

                                            <td>

                                                <div className="btn-group">

                                                    <Link
                                                        to={`/production/${item.id}/edit`}
                                                        className="btn btn-sm btn-outline-primary"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </Link>

                                                    <button
                                                        onClick={() =>
                                                            deleteProduction(
                                                                item.id
                                                            )
                                                        }
                                                        className="btn btn-sm btn-outline-danger"
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

export default Production;