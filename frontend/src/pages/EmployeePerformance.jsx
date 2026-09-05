import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function EmployeePerformance() {

    const { id } = useParams();

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const [employee, setEmployee] = useState(null);
    const [products, setProducts] = useState([]);
    const [productions, setProductions] = useState([]);

    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);

    const [rates, setRates] = useState({});

    const [totalPieces, setTotalPieces] = useState(0);
    const [totalSalary, setTotalSalary] = useState(0);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadData = async () => {

        try {

            setLoading(true);

            const [
                employeeResponse,
                productsResponse,
                productionResponse,
                ratesResponse,
            ] = await Promise.all([
                api.get(`/employees/${id}/`),
                api.get("/products/"),
                api.get(
                    `/production/?employee=${id}&from_date=${fromDate}&to_date=${toDate}`
                ),
                api.get(`/employee-rates/?employee=${id}`),
            ]);

            const employeeData =
                employeeResponse.data;

            const productData =
                Array.isArray(productsResponse.data)
                    ? productsResponse.data
                    : productsResponse.data.results || [];

            const productionData =
                Array.isArray(productionResponse.data)
                    ? productionResponse.data
                    : productionResponse.data.results || [];

            const rateData =
                Array.isArray(ratesResponse.data)
                    ? ratesResponse.data
                    : ratesResponse.data.results || [];

            const rateMap = {};

            rateData.forEach((rate) => {

                rateMap[rate.product] =
                    rate.rate_per_piece;

            });

            setEmployee(employeeData);
            setProducts(productData);
            setProductions(productionData);
            setRates(rateMap);

            let pieces = 0;
            let salary = 0;

            productionData.forEach((item) => {

                pieces += Number(
                    item.quantity || 0
                );

                salary += Number(
                    item.total_amount || 0
                );

            });

            setTotalPieces(pieces);
            setTotalSalary(salary);

        } catch (err) {

            console.error(err);
            setError(
                "Unable to load employee performance."
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        loadData();
    }, [id, fromDate, toDate]);

    const updateRate = (productId, value) => {

        setRates((prev) => ({
            ...prev,
            [productId]: value,
        }));

    };

    const saveRates = async (e) => {

        e.preventDefault();

        try {

            setSaving(true);
            setError("");

            for (const product of products) {

                const value = Number(
                    rates[product.id] || 0
                );

                await api.post(
                    "/employee-rates/",
                    {
                        employee: Number(id),
                        product: product.id,
                        rate_per_piece: value,
                    }
                ).catch(async (err) => {

                    if (
                        err.response?.status === 400
                    ) {

                        await api.put(
                            `/employee-rates/${product.id}/`,
                            {
                                employee: Number(id),
                                product: product.id,
                                rate_per_piece: value,
                            }
                        );

                    } else {

                        throw err;

                    }

                });

            }

            alert(
                `Rates updated successfully for ${employee.name}.`
            );

            loadData();

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

    const downloadPdf = () => {

        const token =
            localStorage.getItem("token");

        const url =
            `${api.defaults.baseURL}employees/${id}/performance/pdf/?from_date=${fromDate}&to_date=${toDate}`;

        fetch(url, {
            headers: {
                Authorization: `Token ${token}`,
            },
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

                window.URL.revokeObjectURL(
                    downloadUrl
                );

            })
            .catch((err) => {

                console.error(err);

                alert(
                    "PDF download failed."
                );

            });
    };

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

    if (!employee) {

        return (
            <div className="container-fluid py-5">

                <div className="alert alert-danger">
                    Employee not found.
                </div>

            </div>
        );

    }

    return (
        <div className="container-fluid py-4">

            {/* Header */}

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


            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}


            {/* Date filters */}

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
                                    setFromDate(
                                        e.target.value
                                    )
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
                                    setToDate(
                                        e.target.value
                                    )
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


            {/* Summary */}

            <div className="row g-4 mb-4">

                <div className="col-md-6">

                    <div className="card border-0 shadow-sm rounded-4">

                        <div className="card-body">

                            <div className="text-muted">
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

                            <div className="text-muted">
                                Total Salary Earned
                            </div>

                            <h2 className="fw-bold mb-0">
                                SAR {totalSalary.toFixed(2)}
                            </h2>

                        </div>

                    </div>

                </div>

            </div>


            {/* Production */}

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

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>


            {/* Employee Rates */}

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
                                            Rate / Piece
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {products.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan="2"
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
                                                                rates[
                                                                    product.id
                                                                ] ?? ""
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

                                            </tr>

                                        ))

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            </form>

        </div>
    );
}

export default EmployeePerformance;