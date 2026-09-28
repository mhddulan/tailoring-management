import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StockProcessing() {

    const [processings, setProcessings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        process_type: "STITCHING",
        input_product: "",
        input_quantity: 1,
        output_product: "",
        employee: "",
        expected_date: "",
        remarks: "",
    });

    const [products, setProducts] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [saving, setSaving] = useState(false);


    // =====================================================
    // LOAD PROCESSING
    // =====================================================

    const loadProcessings = async () => {

        try {

            setLoading(true);

            const response = await api.get("stock-processing/");

            const data = Array.isArray(response.data)
                ? response.data
                : response.data.results || [];

            setProcessings(data);

        } catch (error) {

            console.error(
                "Failed to load stock processing:",
                error
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // LOAD PRODUCTS
    // =====================================================

    const loadProducts = async () => {

        try {

            const response = await api.get("products/");

            const data = Array.isArray(response.data)
                ? response.data
                : response.data.results || [];

            setProducts(data);

        } catch (error) {

            console.error(
                "Failed to load products:",
                error
            );
        }
    };


    // =====================================================
    // LOAD EMPLOYEES
    // =====================================================

    const loadEmployees = async () => {

        try {

            const response = await api.get("employees/");

            const data = Array.isArray(response.data)
                ? response.data
                : response.data.results || [];

            setEmployees(data);

        } catch (error) {

            console.error(
                "Failed to load employees:",
                error
            );
        }
    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadProcessings();
        loadProducts();
        loadEmployees();

    }, []);


    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    // =====================================================
    // CREATE PROCESSING
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!form.input_product) {

            alert("Please select input product.");
            return;
        }

        if (!form.output_product) {

            alert("Please select output product.");
            return;
        }

        if (!form.input_quantity || form.input_quantity <= 0) {

            alert("Please enter a valid quantity.");
            return;
        }

        try {

            setSaving(true);

            await api.post(
                "stock-processing/",
                {
                    process_type: form.process_type,
                    input_product: form.input_product,
                    input_quantity: Number(
                        form.input_quantity
                    ),
                    output_product: form.output_product,
                    employee: form.employee || null,
                    expected_date:
                        form.expected_date || null,
                    remarks: form.remarks,
                }
            );

            alert(
                "Processing entry created successfully."
            );

            setForm({
                process_type: "STITCHING",
                input_product: "",
                input_quantity: 1,
                output_product: "",
                employee: "",
                expected_date: "",
                remarks: "",
            });

            setShowForm(false);

            loadProcessings();

        } catch (error) {

            console.error(
                "Failed to create processing:",
                error
            );

            alert(
                error.response?.data?.detail ||
                "Failed to create processing."
            );

        } finally {

            setSaving(false);
        }
    };


    // =====================================================
    // ISSUE STOCK
    // =====================================================

    const issueStock = async (item) => {

        const quantity = prompt(
            `Enter quantity to issue.\nRemaining: ${item.remaining_to_issue}`
        );

        if (!quantity) {
            return;
        }

        try {

            await api.post(
                `stock-processing/${item.id}/issue/`,
                {
                    quantity: Number(quantity),
                }
            );

            alert("Stock issued successfully.");

            loadProcessings();

        } catch (error) {

            console.error(
                "Failed to issue stock:",
                error
            );

            alert(
                error.response?.data?.detail ||
                "Failed to issue stock."
            );
        }
    };


    // =====================================================
    // COMPLETE PROCESSING
    // =====================================================

    const completeProcessing = async (item) => {

        const quantity = prompt(
            `Enter completed quantity.\nPending: ${item.pending_quantity}`
        );

        if (!quantity) {
            return;
        }

        try {

            await api.post(
                `stock-processing/${item.id}/complete/`,
                {
                    quantity: Number(quantity),
                }
            );

            alert(
                "Completed quantity returned to branch stock."
            );

            loadProcessings();

        } catch (error) {

            console.error(
                "Failed to complete processing:",
                error
            );

            alert(
                error.response?.data?.detail ||
                "Failed to complete processing."
            );
        }
    };


    // =====================================================
    // STATUS BADGE
    // =====================================================

    const getStatusBadge = (status) => {

        switch (status) {

            case "COMPLETED":
                return "badge bg-success";

            case "IN_PROGRESS":
                return "badge bg-primary";

            case "CANCELLED":
                return "badge bg-danger";

            default:
                return "badge bg-warning text-dark";
        }
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div>

            {/* Header */}

            <div className="card shadow border-0 rounded-4 mb-4">

                <div className="card-body d-flex justify-content-between align-items-center">

                    <div>

                        <h2 className="fw-bold mb-1">

                            <i className="bi bi-arrow-repeat me-2"></i>

                            Stock Processing

                        </h2>

                        <p className="text-muted mb-0">

                            Manage stitching, embroidery,
                            alteration and other processing.

                        </p>

                    </div>


                    <button
                        className="btn btn-primary"
                        onClick={() =>
                            setShowForm(!showForm)
                        }
                    >

                        <i className="bi bi-plus-lg me-2"></i>

                        New Processing

                    </button>

                </div>

            </div>


            {/* CREATE FORM */}

            {showForm && (

                <div className="card shadow border-0 rounded-4 mb-4">

                    <div className="card-body">

                        <h5 className="fw-bold mb-4">

                            <i className="bi bi-plus-circle me-2"></i>

                            New Processing Entry

                        </h5>


                        <form onSubmit={handleSubmit}>

                            <div className="row g-3">


                                {/* Process */}

                                <div className="col-md-4">

                                    <label className="form-label">
                                        Process Type
                                    </label>

                                    <select
                                        name="process_type"
                                        className="form-select"
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

                                <div className="col-md-4">

                                    <label className="form-label">
                                        Input Product
                                    </label>

                                    <select
                                        name="input_product"
                                        className="form-select"
                                        value={form.input_product}
                                        onChange={handleChange}
                                    >

                                        <option value="">
                                            Select Product
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


                                {/* Quantity */}

                                <div className="col-md-4">

                                    <label className="form-label">
                                        Quantity
                                    </label>

                                    <input
                                        type="number"
                                        name="input_quantity"
                                        min="1"
                                        className="form-control"
                                        value={form.input_quantity}
                                        onChange={handleChange}
                                    />

                                </div>


                                {/* Output Product */}

                                <div className="col-md-4">

                                    <label className="form-label">
                                        Output Product
                                    </label>

                                    <select
                                        name="output_product"
                                        className="form-select"
                                        value={form.output_product}
                                        onChange={handleChange}
                                    >

                                        <option value="">
                                            Select Output Product
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


                                {/* Employee */}

                                <div className="col-md-4">

                                    <label className="form-label">
                                        Employee
                                    </label>

                                    <select
                                        name="employee"
                                        className="form-select"
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

                                <div className="col-md-4">

                                    <label className="form-label">
                                        Expected Completion
                                    </label>

                                    <input
                                        type="datetime-local"
                                        name="expected_date"
                                        className="form-control"
                                        value={form.expected_date}
                                        onChange={handleChange}
                                    />

                                </div>


                                {/* Remarks */}

                                <div className="col-12">

                                    <label className="form-label">
                                        Remarks
                                    </label>

                                    <textarea
                                        name="remarks"
                                        className="form-control"
                                        rows="3"
                                        placeholder="Optional remarks"
                                        value={form.remarks}
                                        onChange={handleChange}
                                    />

                                </div>


                                {/* Buttons */}

                                <div className="col-12 d-flex gap-2">

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={saving}
                                    >

                                        {saving
                                            ? "Saving..."
                                            : "Create Processing"
                                        }

                                    </button>


                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setShowForm(false)
                                        }
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* PROCESSING TABLE */}

            <div className="card shadow border-0 rounded-4">

                <div className="card-body">

                    <div className="table-responsive">

                        <table className="table align-middle">

                            <thead>

                                <tr>

                                    <th>Process</th>

                                    <th>Input Product</th>

                                    <th>Qty</th>

                                    <th>Output Product</th>

                                    <th>Employee</th>

                                    <th>Issued</th>

                                    <th>Completed</th>

                                    <th>Pending</th>

                                    <th>Status</th>

                                    <th>Actions</th>

                                </tr>

                            </thead>


                            <tbody>

                                {loading ? (

                                    <tr>

                                        <td
                                            colSpan="10"
                                            className="text-center py-5"
                                        >
                                            Loading processing...
                                        </td>

                                    </tr>

                                ) : processings.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="10"
                                            className="text-center py-5 text-muted"
                                        >
                                            No processing entries found.
                                        </td>

                                    </tr>

                                ) : (

                                    processings.map((item) => (

                                        <tr key={item.id}>

                                            <td>
                                                <strong>
                                                    {item.process_type_display ||
                                                        item.process_type}
                                                </strong>
                                            </td>

                                            <td>
                                                {item.input_product_name ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {item.input_quantity ?? 0}
                                            </td>

                                            <td>
                                                {item.output_product_name ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {item.employee_name ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {item.issued_quantity ?? 0}
                                            </td>

                                            <td>
                                                {item.returned_quantity ?? 0}
                                            </td>

                                            <td>
                                                {item.pending_quantity ?? 0}
                                            </td>

                                            <td>

                                                <span
                                                    className={getStatusBadge(
                                                        item.status
                                                    )}
                                                >
                                                    {item.status}
                                                </span>

                                            </td>

                                            <td>

                                                <div className="d-flex gap-1">

                                                    {item.remaining_to_issue > 0 && (

                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() =>
                                                                issueStock(item)
                                                            }
                                                        >
                                                            Issue
                                                        </button>

                                                    )}


                                                    {item.pending_quantity > 0 && (

                                                        <button
                                                            className="btn btn-sm btn-outline-success"
                                                            onClick={() =>
                                                                completeProcessing(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            Complete
                                                        </button>

                                                    )}

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