import { useEffect, useState } from "react";
import api from "../../services/api";

export default function SalesReport() {
    const today = new Date().toISOString().split("T")[0];

    const [sales, setSales] = useState([]);
    const [branches, setBranches] = useState([]);

    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);
    const [branch, setBranch] = useState("");

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [salesResponse, branchesResponse] =
                await Promise.all([
                    api.get("sales/"),
                    api.get("branches/"),
                ]);

            const salesData = Array.isArray(salesResponse.data)
                ? salesResponse.data
                : salesResponse.data.results || [];

            const branchesData = Array.isArray(branchesResponse.data)
                ? branchesResponse.data
                : branchesResponse.data.results || [];

            setSales(salesData);
            setBranches(branchesData);
        } catch (error) {
            console.error("Failed to load sales report:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter((sale) => {
        const dateMatch =
            (!fromDate || sale.sale_date >= fromDate) &&
            (!toDate || sale.sale_date <= toDate);

        const branchMatch =
            !branch ||
            String(sale.branch) === String(branch);

        return dateMatch && branchMatch;
    });

    const totalSales = filteredSales.length;

    const totalRevenue = filteredSales.reduce(
        (sum, sale) => sum + Number(sale.total || 0),
        0
    );

    const averageSale =
        totalSales > 0
            ? totalRevenue / totalSales
            : 0;

    return (
        <div>

            <div className="card shadow border-0 rounded-4 mb-4">
                <div className="card-body">
                    <h2 className="fw-bold mb-1">
                        <i className="bi bi-graph-up me-2"></i>
                        Sales Report
                    </h2>

                    <p className="text-muted mb-0">
                        Analyze sales and revenue.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="card shadow border-0 rounded-4 mb-4">
                <div className="card-body">

                    <div className="row g-3">

                        <div className="col-md-4">
                            <label className="form-label fw-semibold">
                                From Date
                            </label>

                            <input
                                type="date"
                                className="form-control"
                                value={fromDate}
                                onChange={(e) =>
                                    setFromDate(e.target.value)
                                }
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-semibold">
                                To Date
                            </label>

                            <input
                                type="date"
                                className="form-control"
                                value={toDate}
                                onChange={(e) =>
                                    setToDate(e.target.value)
                                }
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-semibold">
                                Branch
                            </label>

                            <select
                                className="form-select"
                                value={branch}
                                onChange={(e) =>
                                    setBranch(e.target.value)
                                }
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

                    </div>

                </div>
            </div>

            {/* KPI */}
            <div className="row g-4 mb-4">

                <div className="col-md-4">
                    <div className="card shadow border-0 rounded-4 h-100">
                        <div className="card-body">
                            <span className="text-muted">
                                Total Sales
                            </span>

                            <h2 className="fw-bold mt-2 mb-0">
                                {totalSales}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow border-0 rounded-4 h-100">
                        <div className="card-body">
                            <span className="text-muted">
                                Total Revenue
                            </span>

                            <h2 className="fw-bold mt-2 mb-0">
                                ₹ {totalRevenue.toFixed(2)}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow border-0 rounded-4 h-100">
                        <div className="card-body">
                            <span className="text-muted">
                                Average Sale
                            </span>

                            <h2 className="fw-bold mt-2 mb-0">
                                ₹ {averageSale.toFixed(2)}
                            </h2>
                        </div>
                    </div>
                </div>

            </div>

            {/* Breakdown */}
            <div className="card shadow border-0 rounded-4">

                <div className="card-body">

                    <h5 className="fw-bold mb-4">
                        Sales Breakdown
                    </h5>

                    <div className="table-responsive">

                        <table className="table align-middle">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Date</th>
                                    <th>Branch</th>
                                    <th>Customer</th>
                                    <th>Payment Mode</th>
                                    <th>Total</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="text-center py-5"
                                        >
                                            Loading...
                                        </td>
                                    </tr>
                                ) : filteredSales.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="text-center py-5 text-muted"
                                        >
                                            No sales found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale) => (
                                        <tr key={sale.id}>
                                            <td>
                                                #{sale.id}
                                            </td>

                                            <td>
                                                {sale.sale_date}
                                            </td>

                                            <td>
                                                {sale.branch_name || "—"}
                                            </td>

                                            <td>
                                                {sale.customer_name ||
                                                    "Walk-in Customer"}
                                            </td>

                                            <td>
                                                {sale.payment_mode}
                                            </td>

                                            <td className="fw-bold">
                                                ₹{" "}
                                                {Number(
                                                    sale.total || 0
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

        </div>
    );
}