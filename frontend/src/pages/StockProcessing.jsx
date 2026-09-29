import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function StockProcessing() {
    const [processing, setProcessing] = useState([]);
    const [products, setProducts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [branches, setBranches] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

            const [
                processingRes,
                productsRes,
                employeesRes,
                branchesRes,
            ] = await Promise.all([
                api.get("stock-processing/"),
                api.get("products/"),
                api.get("employees/"),
                api.get("branches/"),
            ]);

            const processingData =
                Array.isArray(processingRes.data)
                    ? processingRes.data
                    : processingRes.data.results || [];

            const productsData =
                Array.isArray(productsRes.data)
                    ? productsRes.data
                    : productsRes.data.results || [];

            const employeesData =
                Array.isArray(employeesRes.data)
                    ? employeesRes.data
                    : employeesRes.data.results || [];

            const branchesData =
                Array.isArray(branchesRes.data)
                    ? branchesRes.data
                    : branchesRes.data.results || [];

            setProcessing(processingData);
            setProducts(productsData);
            setEmployees(employeesData);
            setBranches(branchesData);

            // Automatically select branch if only one exists
            if (branchesData.length === 1) {
                setForm((prev) => ({
                    ...prev,
                    branch: String(branchesData[0].id),
                }));
            }

        } catch (err) {
            console.error("Stock Processing Load Error:", err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
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

        setError("");

        if (!form.input_product) {
            setError("Please select input product.");
            return;
        }

        if (!form.input_quantity || Number(form.input_quantity) <= 0) {
            setError("Input quantity must be greater than zero.");
            return;
        }

        if (!form.output_product) {
            setError("Please select output product.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                branch: form.branch
                    ? Number(form.branch)
                    : null,

                process_type: form.process_type,

                input_product: Number(
                    form.input_product
                ),

                input_quantity: Number(
                    form.input_quantity
                ),

                output_product: Number(
                    form.output_product
                ),

                output_quantity:
                    form.output_quantity
                        ? Number(form.output_quantity)
                        : null,

                employee:
                    form.employee
                        ? Number(form.employee)
                        : null,

                expected_date:
                    form.expected_date || null,

                remarks: form.remarks.trim(),
            };

            console.log(
                "STOCK PROCESSING PAYLOAD:",
                payload
            );

            await api.post(
                "stock-processing/",
                payload
            );

            alert(
                "Stock processing created successfully."
            );

            setForm({
                branch: form.branch,
                process_type: "STITCHING",
                input_product: "",
                input_quantity: "",
                output_product: "",
                output_quantity: "",
                employee: "",
                expected_date: "",
                remarks: "",
            });

            await loadData();

        } catch (err) {
            console.error(
                "Create Processing Error:",
                err
            );

            console.error(
                "Server Response:",
                err.response?.data
            );

            const data = err.response?.data;

            setError(
                data?.detail ||
                data?.error ||
                JSON.stringify(data) ||
                "Failed to create processing."
            );

        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // ISSUE STOCK
    // =========================================================

    const issueStock = async (item) => {
        const remaining =
            Number(item.remaining_to_issue || 0);

        if (remaining <= 0) {
            alert("No quantity remaining to issue.");
            return;
        }

        const quantity = window.prompt(
            `Enter quantity to issue.\nRemaining: ${remaining}`
        );

        if (!quantity) {
            return;
        }

        const qty = Number(quantity);

        if (!Number.isFinite(qty) || qty <= 0) {
            alert("Please enter a valid quantity.");
            return;
        }

        if (qty > remaining) {
            alert(
                `Cannot issue more than ${remaining}.`
            );
            return;
        }

        try {
            await api.post(
                `stock-processing/${item.id}/issue/`,
                {
                    quantity: qty,
                }
            );

            alert(
                "Stock issued successfully."
            );

            await loadData();

        } catch (err) {
            console.error(
                "Issue Stock Error:",
                err
            );

            alert(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Failed to issue stock."
            );
        }
    };

    // =========================================================
    // RETURN / COMPLETE PROCESSING
    // =========================================================

    const returnStock = async (item) => {
        const pending = Number(
            item.pending_quantity ||
            (
                Number(item.issued_quantity || 0) -
                Number(item.returned_quantity || 0)
            )
        );

        if (pending <= 0) {
            alert(
                "No pending quantity to return."
            );
            return;
        }

        const quantity = window.prompt(
            `Enter returned quantity.\nPending: ${pending}`
        );

        if (!quantity) {
            return;
        }

        const qty = Number(quantity);

        if (!Number.isFinite(qty) || qty <= 0) {
            alert("Please enter a valid quantity.");
            return;
        }

        if (qty > pending) {
            alert(
                `Cannot return more than ${pending}.`
            );
            return;
        }

        try {
            await api.post(
                `stock-processing/${item.id}/complete/`,
                {
                    quantity: qty,
                }
            );

            alert(
                "Processed stock returned successfully."
            );

            await loadData();

        } catch (err) {
            console.error(
                "Return Stock Error:",
                err
            );

            alert(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Failed to return stock."
            );
        }
    };

    // =========================================================
    // STATUS
    // =========================================================

    const getStatusClass = (status) => {
        switch (status) {
            case "Pending":
                return "bg-warning text-dark";

            case "Issued":
                return "bg-info text-dark";

            case "Processing":
                return "bg-primary";

            case "Completed":
                return "bg-success";

            default:
                return "bg-secondary";
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="container-fluid p-4">

                <div className="card shadow-sm border-0">

                    <div className="card-body text-center py-5">

                        <div
                            className="spinner-border text-primary mb-3"
                            role="status"
                        ></div>

                        <h5 className="fw-bold">
                            Loading Stock Processing
                        </h5>

                        <p className="text-muted mb-0">
                            Please wait...
                        </p>

                    </div>

                </div>

            </div>
        );
    }

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="container-fluid p-4">

            {/* PAGE HEADER */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="fw-bold mb-1">
                        <i className="bi bi-gear-wide-connected text-primary me-2"></i>
                        Stock Processing
                    </h2>

                    <p className="text-muted mb-0">
                        Issue stock to employees and return processed stock.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={loadData}
                >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                </button>

            </div>

            {/* ERROR */}

            {error && (
                <div
                    className="alert alert-danger alert-dismissible fade show"
                    role="alert"
                >
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>

                    {error}

                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError("")}
                    ></button>
                </div>
            )}

            {/* =====================================================
                CREATE PROCESSING
            ===================================================== */}

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-header bg-white py-3">

                    <h5 className="fw-bold mb-0">
                        <i className="bi bi-plus-circle text-primary me-2"></i>
                        Create Stock Processing
                    </h5>

                </div>

                <div className="card-body">

                    <form onSubmit={handleSubmit}>

                        <div className="row g-3">

                            {/* Branch */}

                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
                                    Branch
                                </label>

                                <select
                                    className="form-select"
                                    name="branch"
                                    value={form.branch}
                                    onChange={handleChange}
                                >

                                    <option value="">
                                        Select Branch
                                    </option>

                                    {branches.map(
                                        (branch) => (
                                            <option
                                                key={branch.id}
                                                value={branch.id}
                                            >
                                                {branch.name}
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            {/* Process Type */}

                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
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

                                <label className="form-label fw-semibold">
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

                                    {products.map(
                                        (product) => (
                                            <option
                                                key={product.id}
                                                value={product.id}
                                            >
                                                {product.name ||
                                                    product.product_name}
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            {/* Input Quantity */}

                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
                                    Input Quantity
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

                                <label className="form-label fw-semibold">
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

                                    {products.map(
                                        (product) => (
                                            <option
                                                key={product.id}
                                                value={product.id}
                                            >
                                                {product.name ||
                                                    product.product_name}
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            {/* Expected Output */}

                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
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

                                <label className="form-label fw-semibold">
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

                                    {employees.map(
                                        (employee) => (
                                            <option
                                                key={employee.id}
                                                value={employee.id}
                                            >
                                                {employee.name}
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            {/* Expected Date */}

                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
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

                                <label className="form-label fw-semibold">
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
                                    disabled={saving}
                                >

                                    {saving ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            ></span>

                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-plus-circle me-1"></i>
                                            Create Processing
                                        </>
                                    )}

                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>

            {/* =====================================================
                PROCESSING LIST
            ===================================================== */}

            <div className="card shadow-sm border-0">

                <div className="card-header bg-white py-3">

                    <div className="d-flex justify-content-between align-items-center">

                        <h5 className="fw-bold mb-0">
                            <i className="bi bi-list-check text-primary me-2"></i>
                            Processing List
                        </h5>

                        <span className="badge bg-primary">
                            {processing.length} Records
                        </span>

                    </div>

                </div>

                <div className="card-body p-0">

                    <div className="table-responsive">

                        <table className="table table-hover align-middle mb-0">

                            <thead className="table-light">

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
                                            className="text-center py-5"
                                        >

                                            <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>

                                            <span className="text-muted">
                                                No processing records found.
                                            </span>

                                        </td>

                                    </tr>

                                ) : (

                                    processing.map(
                                        (item, index) => (

                                            <tr key={item.id}>

                                                <td className="fw-semibold">
                                                    {index + 1}
                                                </td>

                                                <td>
                                                    {item.process_type_display ||
                                                        item.process_type ||
                                                        "-"}
                                                </td>

                                                <td>
                                                    {item.input_product_name ||
                                                        "-"}
                                                </td>

                                                <td>
                                                    {item.input_quantity ?? 0}
                                                </td>

                                                <td>
                                                    {item.issued_quantity ?? 0}
                                                </td>

                                                <td>
                                                    {item.output_product_name ||
                                                        "-"}
                                                </td>

                                                <td>
                                                    {item.returned_quantity ?? 0}
                                                </td>

                                                <td>
                                                    {item.employee_name ||
                                                        "-"}
                                                </td>

                                                <td>

                                                    <span
                                                        className={`badge ${getStatusClass(
                                                            item.status
                                                        )}`}
                                                    >
                                                        {item.status_display ||
                                                            item.status ||
                                                            "Pending"}
                                                    </span>

                                                </td>

                                                <td>

                                                    {!item.is_fully_issued && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-warning me-2"
                                                            onClick={() =>
                                                                issueStock(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-box-arrow-up me-1"></i>
                                                            Issue
                                                        </button>
                                                    )}

                                                    {Number(
                                                        item.issued_quantity ||
                                                        0
                                                    ) >
                                                        Number(
                                                            item.returned_quantity ||
                                                            0
                                                        ) && (

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-success"
                                                            onClick={() =>
                                                                returnStock(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-box-arrow-in-down me-1"></i>
                                                            Return
                                                        </button>

                                                    )}

                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>
    );
}