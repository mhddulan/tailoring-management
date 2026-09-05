import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StockReport() {
    const [stock, setStock] = useState([]);
    const [branches, setBranches] = useState([]);

    const [search, setSearch] = useState("");
    const [branch, setBranch] = useState("");

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [stockResponse, branchesResponse] =
                await Promise.all([
                    api.get("branch-products/"),
                    api.get("branches/"),
                ]);

            const stockData = Array.isArray(stockResponse.data)
                ? stockResponse.data
                : stockResponse.data.results || [];

            const branchesData = Array.isArray(branchesResponse.data)
                ? branchesResponse.data
                : branchesResponse.data.results || [];

            setStock(stockData);
            setBranches(branchesData);
        } catch (error) {
            console.error("Failed to load stock report:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStock = stock.filter((item) => {

        const searchText = search.toLowerCase();

        const searchMatch =
            !searchText ||
            item.product_name?.toLowerCase().includes(searchText) ||
            item.barcode?.toLowerCase().includes(searchText) ||
            item.category_name?.toLowerCase().includes(searchText);

        const branchMatch =
            !branch ||
            String(item.branch) === String(branch);

        return searchMatch && branchMatch;
    });

    const totalUnits = filteredStock.reduce(
        (sum, item) => sum + Number(item.stock || 0),
        0
    );

    const totalValue = filteredStock.reduce(
        (sum, item) =>
            sum +
            Number(item.stock || 0) *
            Number(item.selling_price || 0),
        0
    );

    const getStockLevel = (quantity) => {
        if (quantity <= 5) {
            return {
                text: "Low",
                className: "badge bg-danger",
            };
        }

        if (quantity <= 20) {
            return {
                text: "Medium",
                className: "badge bg-warning text-dark",
            };
        }

        return {
            text: "Available",
            className: "badge bg-success",
        };
    };

    return (
        <div>

            <div className="card shadow border-0 rounded-4 mb-4">
                <div className="card-body">

                    <h2 className="fw-bold mb-1">
                        <i className="bi bi-bar-chart-line me-2"></i>
                        Stock Report
                    </h2>

                    <p className="text-muted mb-0">
                        View stock levels and inventory valuation.
                    </p>

                </div>
            </div>

            {/* KPI */}
            <div className="row g-4 mb-4">

                <div className="col-md-6">

                    <div className="card shadow border-0 rounded-4 h-100">

                        <div className="card-body">

                            <span className="text-muted">
                                Total Units
                            </span>

                            <h2 className="fw-bold mt-2 mb-0">
                                {totalUnits}
                            </h2>

                        </div>

                    </div>

                </div>

                <div className="col-md-6">

                    <div className="card shadow border-0 rounded-4 h-100">

                        <div className="card-body">

                            <span className="text-muted">
                                Total Valuation
                            </span>

                            <h2 className="fw-bold mt-2 mb-0">
                                ₹ {totalValue.toFixed(2)}
                            </h2>

                        </div>

                    </div>

                </div>

            </div>

            {/* Filters */}
            <div className="card shadow border-0 rounded-4 mb-4">

                <div className="card-body">

                    <div className="row g-3">

                        <div className="col-md-8">

                            <label className="form-label fw-semibold">
                                Search
                            </label>

                            <div className="input-group">

                                <span className="input-group-text bg-white">
                                    <i className="bi bi-search"></i>
                                </span>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search product, barcode or category..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                />

                            </div>

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

            {/* Table */}
            <div className="card shadow border-0 rounded-4">

                <div className="card-body">

                    <div className="table-responsive">

                        <table className="table align-middle">

                            <thead>

                                <tr>
                                    <th>Product</th>
                                    <th>Barcode</th>
                                    <th>Category</th>
                                    <th>Stock</th>
                                    <th>Unit Price</th>
                                    <th>Total Value</th>
                                    <th>Stock Level</th>
                                </tr>

                            </thead>

                            <tbody>

                                {loading ? (

                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="text-center py-5"
                                        >
                                            Loading...
                                        </td>
                                    </tr>

                                ) : filteredStock.length === 0 ? (

                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="text-center py-5 text-muted"
                                        >
                                            No stock found.
                                        </td>
                                    </tr>

                                ) : (

                                    filteredStock.map((item) => {

                                        const quantity =
                                            Number(
                                                item.stock || 0
                                            );

                                        const price =
                                            Number(
                                                item.selling_price || 0
                                            );

                                        const value =
                                            quantity * price;

                                        const level =
                                            getStockLevel(
                                                quantity
                                            );

                                        return (
                                            <tr
                                                key={
                                                    item.id
                                                }
                                            >

                                                <td className="fw-semibold">
                                                    {item.product_name ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    {item.barcode ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    {item.category_name ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    {quantity}
                                                </td>

                                                <td>
                                                    ₹{" "}
                                                    {price.toFixed(
                                                        2
                                                    )}
                                                </td>

                                                <td className="fw-semibold">
                                                    ₹{" "}
                                                    {value.toFixed(
                                                        2
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            level.className
                                                        }
                                                    >
                                                        {
                                                            level.text
                                                        }
                                                    </span>
                                                </td>

                                            </tr>
                                        );
                                    })

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>
    );
}