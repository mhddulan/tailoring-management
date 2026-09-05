import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function ProductionCreate() {

    const navigate = useNavigate();

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);

    const [employee, setEmployee] = useState("");
    const [productionDate, setProductionDate] = useState(today);

    const [rows, setRows] = useState([
        {
            product: "",
            quantity: 1,
            rate_per_piece: "",
            remarks: "",
        },
    ]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {

        try {

            const [
                employeeResponse,
                productResponse,
            ] = await Promise.all([
                api.get("/employees/"),
                api.get("/products/"),
            ]);

            setEmployees(
                Array.isArray(employeeResponse.data)
                    ? employeeResponse.data
                    : employeeResponse.data.results || []
            );

            setProducts(
                Array.isArray(productResponse.data)
                    ? productResponse.data
                    : productResponse.data.results || []
            );

        } catch (err) {

            console.error(err);
            setError("Unable to load employees or products.");

        } finally {

            setLoading(false);

        }
    };

    const updateRow = (index, field, value) => {

        setRows((prev) =>
            prev.map((row, i) => {

                if (i !== index) {
                    return row;
                }

                return {
                    ...row,
                    [field]: value,
                };
            })
        );
    };

    const addRow = () => {

        setRows((prev) => [
            ...prev,
            {
                product: "",
                quantity: 1,
                rate_per_piece: "",
                remarks: "",
            },
        ]);
    };

    const removeRow = (index) => {

        if (rows.length === 1) {
            return;
        }

        setRows((prev) =>
            prev.filter((_, i) => i !== index)
        );
    };

    const handleProductChange = async (
        index,
        productId
    ) => {

        updateRow(
            index,
            "product",
            productId
        );

        if (!productId || !employee) {
            return;
        }

        try {

            const response = await api.get(
                `/employee-rates/?employee=${employee}&product=${productId}`
            );

            const data =
                Array.isArray(response.data)
                    ? response.data
                    : response.data.results || [];

            if (data.length > 0) {

                updateRow(
                    index,
                    "rate_per_piece",
                    data[0].rate_per_piece
                );

            }

        } catch (err) {

            console.error(err);

        }
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!employee) {
            setError("Please select an employee.");
            return;
        }

        if (!productionDate) {
            setError("Please select a production date.");
            return;
        }

        const validRows = rows.filter(
            (row) =>
                row.product &&
                Number(row.quantity) > 0
        );

        if (validRows.length === 0) {
            setError(
                "Please add at least one production item."
            );
            return;
        }

        for (const row of validRows) {

            if (Number(row.quantity) < 1) {
                setError(
                    "Quantity must be at least 1."
                );
                return;
            }

            if (Number(row.rate_per_piece) < 0) {
                setError(
                    "Rate cannot be negative."
                );
                return;
            }
        }

        try {

            setSaving(true);

            for (const row of validRows) {

                await api.post("/production/", {
                    employee: Number(employee),
                    product: Number(row.product),
                    production_date: productionDate,
                    quantity: Number(row.quantity),
                    rate_per_piece: Number(
                        row.rate_per_piece || 0
                    ),
                    remarks: row.remarks || "",
                });

            }

            navigate("/production");

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

                setError(
                    "Unable to save production."
                );

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
                    Loading...
                </p>

            </div>
        );

    }

    return (
        <div className="container-fluid py-4">

            <div className="mb-4">

                <Link
                    to="/production"
                    className="text-decoration-none text-muted"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Production
                </Link>

                <h2 className="fw-bold mt-2 mb-1">
                    Add Employee Performance
                </h2>

                <p className="text-muted mb-0">
                    Record production for an employee
                </p>

            </div>


            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}


            <form onSubmit={handleSubmit}>

                {/* Employee Details */}

                <div className="card border-0 shadow-sm rounded-4 mb-4">

                    <div className="card-body p-4">

                        <div className="row g-4">

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Employee
                                </label>

                                <select
                                    value={employee}
                                    onChange={(e) =>
                                        setEmployee(e.target.value)
                                    }
                                    className="form-select"
                                    required
                                >

                                    <option value="">
                                        Select Employee
                                    </option>

                                    {employees.map((item) => (

                                        <option
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {item.name}
                                            {item.branch_name
                                                ? ` - ${item.branch_name}`
                                                : ""}
                                        </option>

                                    ))}

                                </select>

                            </div>


                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Production Date
                                </label>

                                <input
                                    type="date"
                                    value={productionDate}
                                    onChange={(e) =>
                                        setProductionDate(
                                            e.target.value
                                        )
                                    }
                                    className="form-control"
                                    required
                                />

                            </div>

                        </div>

                    </div>

                </div>


                {/* Production Items */}

                <div className="card border-0 shadow-sm rounded-4">

                    <div className="card-body p-4">

                        <div className="d-flex justify-content-between align-items-center mb-4">

                            <div>
                                <h5 className="fw-bold mb-1">
                                    Production Items
                                </h5>

                                <small className="text-muted">
                                    Add products stitched by this employee
                                </small>
                            </div>

                            <button
                                type="button"
                                onClick={addRow}
                                className="btn btn-outline-dark"
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                Add Item
                            </button>

                        </div>


                        {rows.map((row, index) => (

                            <div
                                key={index}
                                className="border rounded-4 p-3 mb-3"
                            >

                                <div className="row g-3 align-items-end">

                                    {/* Product */}

                                    <div className="col-md-4">

                                        <label className="form-label fw-semibold">
                                            Product
                                        </label>

                                        <select
                                            value={row.product}
                                            onChange={(e) =>
                                                handleProductChange(
                                                    index,
                                                    e.target.value
                                                )
                                            }
                                            className="form-select"
                                            required
                                        >

                                            <option value="">
                                                Select Product
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


                                    {/* Quantity */}

                                    <div className="col-md-2">

                                        <label className="form-label fw-semibold">
                                            Pieces
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            value={row.quantity}
                                            onChange={(e) =>
                                                updateRow(
                                                    index,
                                                    "quantity",
                                                    e.target.value
                                                )
                                            }
                                            className="form-control"
                                            required
                                        />

                                    </div>


                                    {/* Rate */}

                                    <div className="col-md-2">

                                        <label className="form-label fw-semibold">
                                            Rate / Piece
                                        </label>

                                        <div className="input-group">

                                            <span className="input-group-text">
                                                SAR
                                            </span>

                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={
                                                    row.rate_per_piece
                                                }
                                                onChange={(e) =>
                                                    updateRow(
                                                        index,
                                                        "rate_per_piece",
                                                        e.target.value
                                                    )
                                                }
                                                className="form-control"
                                                required
                                            />

                                        </div>

                                    </div>


                                    {/* Remarks */}

                                    <div className="col-md-3">

                                        <label className="form-label fw-semibold">
                                            Remarks
                                        </label>

                                        <input
                                            type="text"
                                            value={row.remarks}
                                            onChange={(e) =>
                                                updateRow(
                                                    index,
                                                    "remarks",
                                                    e.target.value
                                                )
                                            }
                                            className="form-control"
                                            placeholder="Optional remarks"
                                        />

                                    </div>


                                    {/* Delete */}

                                    <div className="col-md-1">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeRow(index)
                                            }
                                            className="btn btn-outline-danger w-100"
                                            disabled={
                                                rows.length === 1
                                            }
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>

                                    </div>

                                </div>


                                {/* Amount Preview */}

                                <div className="text-end mt-3">

                                    <span className="text-muted me-2">
                                        Amount:
                                    </span>

                                    <strong>
                                        SAR{" "}
                                        {(
                                            Number(
                                                row.quantity || 0
                                            ) *
                                            Number(
                                                row.rate_per_piece || 0
                                            )
                                        ).toFixed(2)}
                                    </strong>

                                </div>

                            </div>

                        ))}


                        <hr />

                        <div className="d-flex justify-content-end gap-2">

                            <Link
                                to="/production"
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
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-lg me-2"></i>
                                        Save Production
                                    </>
                                )}

                            </button>

                        </div>

                    </div>

                </div>

            </form>

        </div>
    );
}

export default ProductionCreate;