import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function EmployeePerformance() {

    const { id } = useParams();

    // ========================================================
    // DATE
    // ========================================================

    const getLocalDate = () => {
        const date = new Date();

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const today = getLocalDate();

    // ========================================================
    // STATES
    // ========================================================

    const [employee, setEmployee] = useState(null);

    const [products, setProducts] = useState([]);

    const [productions, setProductions] = useState([]);

    const [alterations, setAlterations] = useState([]);

    const [rates, setRates] = useState({});

    const [rateIds, setRateIds] = useState({});

    const [fromDate, setFromDate] = useState(today);

    const [toDate, setToDate] = useState(today);

    const [totalPieces, setTotalPieces] = useState(0);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    // ========================================================
    // RESPONSE HELPER
    // ========================================================

    const getList = (response) => {

        if (Array.isArray(response.data)) {
            return response.data;
        }

        return response.data?.results || [];
    };

    // ========================================================
    // LOAD DATA
    // ========================================================

    const loadData = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                employeeResponse,
                productsResponse,
                productionResponse,
                ratesResponse,
                alterationResponse
            ] = await Promise.all([

                api.get(`/employees/${id}/`),

                api.get("/products/"),

                api.get(
                    `/production/?employee=${id}&from_date=${fromDate}&to_date=${toDate}`
                ),

                api.get(`/employee-rates/?employee=${id}`),

                api.get(
                    `/alterations/?assigned_employee=${id}&status=Delivery`
                )

            ]);

            // ------------------------------------------------
            // EMPLOYEE
            // ------------------------------------------------

            const employeeData = employeeResponse.data;

            // ------------------------------------------------
            // PRODUCTS
            // ------------------------------------------------

            const productData = getList(productsResponse);

            // ------------------------------------------------
            // PRODUCTION
            // ------------------------------------------------

            const productionData = getList(productionResponse);

            // ------------------------------------------------
            // EMPLOYEE RATES
            // ------------------------------------------------

            const rateData = getList(ratesResponse);

            const rateMap = {};

            const rateIdMap = {};

            rateData.forEach((rate) => {

                rateMap[rate.product] = rate.rate_per_piece;

                rateIdMap[rate.product] = rate.id;

            });

            // ------------------------------------------------
            // ALTERATIONS
            // ------------------------------------------------

            const allAlterations = getList(alterationResponse);

            // Filter using delivery date.
            // This ensures commission belongs to the
            // period in which the alteration was completed.

            const alterationData = allAlterations.filter((item) => {

                const assignedEmployeeId =
                    item.assigned_employee?.id ??
                    item.assigned_employee_id ??
                    item.assigned_employee;

                if (Number(assignedEmployeeId) !== Number(id)) {
                    return false;
                }

                if (item.status !== "Delivery") {
                    return false;
                }

                const completedDate =
                    item.delivery_date ||
                    item.delivered_at?.slice(0, 10);

                if (!completedDate) {
                    return false;
                }

                return (
                    completedDate >= fromDate &&
                    completedDate <= toDate
                );

            });

            // ------------------------------------------------
            // SET STATES
            // ------------------------------------------------

            setEmployee(employeeData);

            setProducts(productData);

            setProductions(productionData);

            setAlterations(alterationData);

            setRates(rateMap);

            setRateIds(rateIdMap);

            // ------------------------------------------------
            // TOTAL PIECES
            // ------------------------------------------------

            const pieces = productionData.reduce(
                (sum, item) =>
                    sum + Number(item.quantity || 0),
                0
            );

            setTotalPieces(pieces);

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.detail ||
                "Unable to load employee performance."
            );

        } finally {

            setLoading(false);

        }

    };

    // ========================================================
    // PRODUCTION CALCULATIONS
    // ========================================================

    const getProductId = (item) => {

        return Number(
            item.product?.id ??
            item.product_id ??
            item.product ??
            0
        );

    };

    const getProductQuantity = (productId) => {

        return productions.reduce((sum, item) => {

            return getProductId(item) === Number(productId)

                ? sum + Number(item.quantity || 0)

                : sum;

        }, 0);

    };

    // ========================================================
    // STITCHING SALARY
    // ========================================================

    const calculatedSalary = products.reduce(
        (sum, product) => {

            const quantity = getProductQuantity(product.id);

            const rate = Number(
                rates[product.id] ?? 0
            );

            return sum + quantity * rate;

        },
        0
    );

    // ========================================================
    // ALTERATION CALCULATIONS
    // ========================================================

    const totalAlterations = alterations.length;

    const totalAlterationValue = alterations.reduce(
        (sum, item) => {

            return sum + Number(item.total_amount || 0);

        },
        0
    );

    // --------------------------------------------------------
    // EMPLOYEE COMMISSION
    // --------------------------------------------------------

    const getAlterationCommission = (item) => {
        const storedCommission = Number(item.commission_amount ?? 0);

        // Older alterations may have been delivered before commission
        // calculation was added. Show the 40% amount for those records too.
        if (storedCommission > 0) {
            return storedCommission;
        }

        const totalAmount = Number(item.total_amount || 0);
        const rate = Number(item.commission_rate ?? 40);

        return Number((totalAmount * rate / 100).toFixed(2));
    };

    const alterationCommission = alterations.reduce(
        (sum, item) => sum + getAlterationCommission(item),
        0
    );

    // ========================================================
    // TOTAL EMPLOYEE EARNINGS
    // ========================================================

    const totalEmployeeEarnings =
        calculatedSalary + alterationCommission;

    // ========================================================
    // LOAD WHEN DATE CHANGES
    // ========================================================

    useEffect(() => {

        loadData();

    }, [id, fromDate, toDate]);

    // ========================================================
    // UPDATE PRODUCT RATE
    // ========================================================

    const updateRate = (productId, value) => {

        setRates((prev) => ({

            ...prev,

            [productId]: value

        }));

    };

    // ========================================================
    // SAVE PRODUCT RATES
    // ========================================================

    const saveRates = async (e) => {

        e.preventDefault();

        try {

            setSaving(true);

            setError("");

            for (const product of products) {

                const value = Number(
                    rates[product.id] || 0
                );

                const payload = {

                    employee: Number(id),

                    product: product.id,

                    rate_per_piece: value

                };

                const existingRateId = rateIds[product.id];

                if (existingRateId) {

                    await api.put(
                        `/employee-rates/${existingRateId}/`,
                        payload
                    );

                } else {

                    await api.post(
                        "/employee-rates/",
                        payload
                    );

                }

            }

            alert(
                `Rates updated successfully for ${employee.name}.`
            );

            await loadData();

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.detail ||
                "Unable to update rates."
            );

        } finally {

            setSaving(false);

        }

    };

    // ========================================================
    // DOWNLOAD PDF
    // ========================================================

    const downloadPdf = () => {

        const token = localStorage.getItem("token");

        const url =
            `${api.defaults.baseURL}employees/${id}/performance/pdf/?from_date=${fromDate}&to_date=${toDate}`;

        fetch(url, {

            headers: {

                Authorization: `Token ${token}`

            }

        })

            .then((response) => {

                if (!response.ok) {

                    throw new Error(
                        "Unable to download PDF."
                    );

                }

                return response.blob();

            })

            .then((blob) => {

                const downloadUrl =
                    window.URL.createObjectURL(blob);

                const link =
                    document.createElement("a");

                link.href = downloadUrl;

                link.download =
                    `${employee.name}_performance.pdf`;

                document.body.appendChild(link);

                link.click();

                link.remove();

                window.URL.revokeObjectURL(downloadUrl);

            })

            .catch((err) => {

                console.error(err);

                alert("PDF download failed.");

            });

    };

    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (

            <div className="container-fluid py-5 text-center">

                <div className="spinner-border"></div>

                <p className="text-muted mt-2">
                    Loading performance...
                </p>

            </div>

        );

    }

    // ========================================================
    // EMPLOYEE NOT FOUND
    // ========================================================

    if (!employee) {

        return (

            <div className="container-fluid py-5">

                <div className="alert alert-danger">
                    Employee not found.
                </div>

            </div>

        );

    }

    // ========================================================
    // MAIN UI
    // ========================================================

    return (

        <div className="container-fluid py-4">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="d-flex justify-content-between align-items-start mb-4">

                <div>

                    <Link
                        to="/employees"
                        className="text-decoration-none text-muted"
                    >

                        <i className="bi bi-arrow-left me-2"></i>

                        Employees

                    </Link>

                    <h2 className="fw-bold mt-2 mb-1">
                        Employee Performance
                    </h2>

                    <p className="text-muted mb-0">

                        {employee.name}

                        {" • "}

                        {employee.designation}

                        {" • "}

                        {employee.branch_name ||
                            employee.branch?.name ||
                            "-"}

                    </p>

                </div>

                <button
                    type="button"
                    onClick={downloadPdf}
                    className="btn btn-outline-dark"
                >

                    <i className="bi bi-file-earmark-pdf me-2"></i>

                    Download PDF

                </button>

            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="alert alert-danger">
                    {error}
                </div>

            )}

            {/* ==================================================
                DATE FILTER
            ================================================== */}

            <div className="card border-0 shadow-sm rounded-4 mb-4">

                <div className="card-body">

                    <div className="row g-3">

                        <div className="col-md-5">

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

                        <div className="col-md-5">

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

                        <div className="col-md-2 d-flex align-items-end">

                            <button
                                type="button"
                                onClick={() => {

                                    setFromDate(today);

                                    setToDate(today);

                                }}
                                className="btn btn-light w-100"
                            >

                                Today

                            </button>

                        </div>

                    </div>

                </div>

            </div>

            {/* ==================================================
                PERFORMANCE SUMMARY
            ================================================== */}

            <div className="row g-3 mb-4">

                {/* TOTAL PIECES */}

                <div className="col-md-3">

                    <div className="card border-0 shadow-sm rounded-4 h-100">

                        <div className="card-body">

                            <div className="text-muted">
                                Total Pieces
                            </div>

                            <h2 className="fw-bold mb-0">
                                {totalPieces}
                            </h2>

                            <small className="text-muted">
                                Stitching production
                            </small>

                        </div>

                    </div>

                </div>

                {/* STITCHING EARNINGS */}

                <div className="col-md-3">

                    <div className="card border-0 shadow-sm rounded-4 h-100">

                        <div className="card-body">

                            <div className="text-muted">
                                Stitching Earnings
                            </div>

                            <h2 className="fw-bold mb-0">
                                SAR {calculatedSalary.toFixed(2)}
                            </h2>

                            <small className="text-muted">
                                Production-based salary
                            </small>

                        </div>

                    </div>

                </div>

                {/* ALTERATION COMMISSION */}

                <div className="col-md-3">

                    <div className="card border-0 shadow-sm rounded-4 h-100">

                        <div className="card-body">

                            <div className="text-muted">
                                Alteration Commission (40%)
                            </div>

                            <h2 className="fw-bold text-success mb-0">
                                SAR {alterationCommission.toFixed(2)}
                            </h2>

                            <small className="text-muted">
                                {totalAlterations} completed alterations
                            </small>

                        </div>

                    </div>

                </div>

                {/* TOTAL EARNINGS */}

                <div className="col-md-3">

                    <div className="card border-0 shadow-sm rounded-4 h-100">

                        <div className="card-body">

                            <div className="text-muted">
                                Total Employee Earnings
                            </div>

                            <h2 className="fw-bold text-primary mb-0">
                                SAR {totalEmployeeEarnings.toFixed(2)}
                            </h2>

                            <small className="text-muted">
                                Stitching + Alteration
                            </small>

                        </div>

                    </div>

                </div>

            </div>

            {/* ==================================================
                ALTERATION PERFORMANCE
            ================================================== */}

            <div className="card border-0 shadow-sm rounded-4 mb-4">

                <div className="card-body p-0">

                    <div className="p-4">

                        <div className="d-flex justify-content-between align-items-center">

                            <div>

                                <h5 className="fw-bold mb-1">
                                    <i className="bi bi-scissors me-2"></i>
                                    Alteration Performance
                                </h5>

                                <p className="text-muted mb-0">
                                    Completed alterations assigned to this employee
                                </p>

                            </div>

                            <span className="badge bg-success-subtle text-success fs-6">
                                40% Commission
                            </span>

                        </div>

                    </div>

                    <div className="row px-4 pb-3 g-3">

                        <div className="col-md-6">

                            <div className="bg-light rounded-3 p-3">

                                <small className="text-muted">
                                    Total Alteration Value
                                </small>

                                <h4 className="fw-bold mb-0">
                                    SAR {totalAlterationValue.toFixed(2)}
                                </h4>

                            </div>

                        </div>

                        <div className="col-md-6">

                            <div className="bg-success-subtle rounded-3 p-3">

                                <small className="text-success">
                                    Employee Commission
                                </small>

                                <h4 className="fw-bold text-success mb-0">
                                    SAR {alterationCommission.toFixed(2)}
                                </h4>

                            </div>

                        </div>

                    </div>

                    <div className="table-responsive">

                        <table className="table table-hover align-middle mb-0">

                            <thead className="table-light">

                                <tr>

                                    <th className="px-4">
                                        #
                                    </th>

                                    <th>
                                        Delivery Date
                                    </th>

                                    <th>
                                        Customer
                                    </th>

                                    <th>
                                        Item
                                    </th>

                                    <th>
                                        Alteration Value
                                    </th>

                                    <th>
                                        Commission %
                                    </th>

                                    <th>
                                        Employee Commission
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {alterations.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="8"
                                            className="text-center py-5 text-muted"
                                        >

                                            <i className="bi bi-scissors fs-2 d-block mb-2"></i>

                                            No completed alterations found for this date range.

                                        </td>

                                    </tr>

                                ) : (

                                    alterations.map((item, index) => (

                                        <tr key={item.id}>

                                            <td className="px-4">
                                                {index + 1}
                                            </td>

                                            <td>
                                                {item.delivery_date || "-"}
                                            </td>

                                            <td>

                                                <div className="fw-semibold">
                                                    {item.customer_name}
                                                </div>

                                                <small className="text-muted">
                                                    {item.phone}
                                                </small>

                                            </td>

                                            <td>
                                                {item.product_name ||
                                                    item.item_name ||
                                                    "Other Item"}
                                            </td>

                                            <td className="fw-semibold">
                                                SAR {Number(
                                                    item.total_amount || 0
                                                ).toFixed(2)}
                                            </td>

                                            <td>
                                                {Number(
                                                    item.commission_rate ?? 40
                                                ).toFixed(2)}%
                                            </td>

                                            <td className="fw-bold text-success">
                                                SAR {getAlterationCommission(item).toFixed(2)}
                                            </td>

                                            <td>

                                                <span className="badge bg-success-subtle text-success">
                                                    {item.status}
                                                </span>

                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                            {alterations.length > 0 && (

                                <tfoot className="table-light">

                                    <tr>

                                        <th
                                            colSpan="4"
                                            className="px-4"
                                        >
                                            Total
                                        </th>

                                        <th>
                                            SAR {totalAlterationValue.toFixed(2)}
                                        </th>

                                        <th>
                                            40%
                                        </th>

                                        <th className="text-success">
                                            SAR {alterationCommission.toFixed(2)}
                                        </th>

                                        <th></th>

                                    </tr>

                                </tfoot>

                            )}

                        </table>

                    </div>

                </div>

            </div>

            {/* ==================================================
                STITCHING PRODUCTION
            ================================================== */}

            <div className="card border-0 shadow-sm rounded-4 mb-4">

                <div className="card-body p-0">

                    <div className="p-4">

                        <h5 className="fw-bold mb-1">
                            Production Details
                        </h5>

                        <p className="text-muted mb-0">
                            {fromDate} to {toDate}
                        </p>

                    </div>

                    <div className="table-responsive">

                        <table className="table table-hover align-middle mb-0">

                            <thead className="table-light">

                                <tr>

                                    <th className="px-4">
                                        Date
                                    </th>

                                    <th>
                                        Product
                                    </th>

                                    <th>
                                        Pieces
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

                                </tr>

                            </thead>

                            <tbody>

                                {productions.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="6"
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
                                                {item.product_name ||
                                                    item.product?.name ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {item.quantity}
                                            </td>

                                            <td>
                                                SAR {Number(
                                                    item.rate_per_piece || 0
                                                ).toFixed(2)}
                                            </td>

                                            <td className="fw-semibold">
                                                SAR {Number(
                                                    item.total_amount || 0
                                                ).toFixed(2)}
                                            </td>

                                            <td>
                                                {item.remarks || "-"}
                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

            {/* ==================================================
                PRODUCT RATES
            ================================================== */}

            <form onSubmit={saveRates}>

                <div className="card border-0 shadow-sm rounded-4">

                    <div className="card-body p-0">

                        <div className="p-4 d-flex justify-content-between align-items-center">

                            <div>

                                <h5 className="fw-bold mb-1">
                                    Product Rates
                                </h5>

                                <p className="text-muted mb-0">
                                    Set the employee's rate per piece
                                </p>

                            </div>

                            <button
                                type="submit"
                                className="btn btn-dark"
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
                                        Save Rates
                                    </>

                                )}

                            </button>

                        </div>

                        <div className="table-responsive">

                            <table className="table table-hover align-middle mb-0">

                                <thead className="table-light">

                                    <tr>

                                        <th className="px-4">
                                            Product
                                        </th>

                                        <th>
                                            Total Quantity
                                        </th>

                                        <th>
                                            Rate / Piece
                                        </th>

                                        <th>
                                            Total Amount
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {products.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan="4"
                                                className="text-center py-5 text-muted"
                                            >
                                                No active products found.
                                            </td>

                                        </tr>

                                    ) : (

                                        products.map((product) => (

                                            <tr key={product.id}>

                                                <td className="px-4 fw-semibold">
                                                    {product.name}
                                                </td>

                                                <td>
                                                    {getProductQuantity(product.id)}
                                                </td>

                                                <td style={{ maxWidth: "250px" }}>

                                                    <div className="input-group">

                                                        <span className="input-group-text">
                                                            SAR
                                                        </span>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={
                                                                rates[product.id] ?? ""
                                                            }
                                                            onChange={(e) =>
                                                                updateRate(
                                                                    product.id,
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="form-control"
                                                        />

                                                    </div>

                                                </td>

                                                <td className="fw-semibold">

                                                    SAR {(
                                                        getProductQuantity(product.id) *
                                                        Number(rates[product.id] ?? 0)
                                                    ).toFixed(2)}

                                                </td>

                                            </tr>

                                        ))

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            </form>

            {/* ==================================================
                FINAL SALARY SUMMARY
            ================================================== */}

            <div className="card border-0 shadow-sm rounded-4 mt-4">

                <div className="card-body p-4">

                    <h5 className="fw-bold mb-3">
                        Employee Earnings Summary
                    </h5>

                    <div className="d-flex justify-content-between mb-3">

                        <span className="text-muted">
                            Stitching Earnings
                        </span>

                        <strong>
                            SAR {calculatedSalary.toFixed(2)}
                        </strong>

                    </div>

                    <div className="d-flex justify-content-between mb-3">

                        <span className="text-muted">
                            Alteration Commission
                        </span>

                        <strong className="text-success">
                            SAR {alterationCommission.toFixed(2)}
                        </strong>

                    </div>

                    <hr />

                    <div className="d-flex justify-content-between align-items-center">

                        <h5 className="fw-bold mb-0">
                            Total Earnings
                        </h5>

                        <h3 className="fw-bold text-primary mb-0">
                            SAR {totalEmployeeEarnings.toFixed(2)}
                        </h3>

                    </div>

                    <small className="text-muted d-block mt-3">
                        This is the employee's calculated earnings for the selected date range.
                        Basic salary and other adjustments are not included here.
                    </small>

                </div>

            </div>

        </div>

    );

}

export default EmployeePerformance;