import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function StockTransfer() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [transfers, setTransfers] = useState([]);

    const [form, setForm] = useState({
        product: "",
        branch: "",
        quantity: "",
        transfer_date: new Date().toISOString().split("T")[0],
        remarks: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [
                productsResponse,
                branchesResponse,
                transfersResponse,
            ] = await Promise.all([
                api.get("products/"),
                api.get("branches/"),
                api.get("stock-transfers/"),
            ]);

            const productsData = Array.isArray(productsResponse.data)
                ? productsResponse.data
                : productsResponse.data.results || [];

            const branchesData = Array.isArray(branchesResponse.data)
                ? branchesResponse.data
                : branchesResponse.data.results || [];

            const transfersData = Array.isArray(transfersResponse.data)
                ? transfersResponse.data
                : transfersResponse.data.results || [];

            setProducts(productsData);
            setBranches(branchesData);
            setTransfers(transfersData);

        } catch (error) {
            console.error(
                "Failed to load stock transfer data:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.product) {
            alert("Please select a product.");
            return;
        }

        if (!form.branch) {
            alert("Please select a destination branch.");
            return;
        }

        if (!form.quantity || Number(form.quantity) <= 0) {
            alert("Quantity must be greater than 0.");
            return;
        }

        try {
            setSaving(true);

            await api.post("stock-transfers/", {
                product: Number(form.product),
                branch: Number(form.branch),
                quantity: Number(form.quantity),
                transfer_date: form.transfer_date,
                remarks: form.remarks,
            });

            alert("Stock transferred successfully.");

            setForm({
                product: "",
                branch: "",
                quantity: "",
                transfer_date:
                    new Date().toISOString().split("T")[0],
                remarks: "",
            });

            loadData();

        } catch (error) {
            console.error(
                "Stock transfer failed:",
                error
            );

            alert(
                error.response?.data?.detail ||
                error.response?.data?.error ||
                JSON.stringify(error.response?.data) ||
                "Unable to transfer stock."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>

            {/* Header */}
            <div className="card shadow border-0 rounded-4 mb-4">
                <div className="card-body d-flex justify-content-between align-items-center">

                    <div>
                        <h2 className="fw-bold mb-1">
                            <i className="bi bi-arrow-left-right me-2"></i>
                            Stock Transfer
                        </h2>

                        <p className="text-muted mb-0">
                            Transfer products to a branch.
                        </p>
                    </div>

                    <button
                        className="btn btn-light"
                        onClick={() => navigate("/products")}
                    >
                        <i className="bi bi-box-seam me-2"></i>
                        Products
                    </button>

                </div>
            </div>

            {/* Transfer Form */}
            <div className="card shadow border-0 rounded-4 mb-4">

                <div className="card-body">

                    <h5 className="fw-bold mb-4">
                        New Stock Transfer
                    </h5>

                    <form onSubmit={handleSubmit}>

                        <div className="row g-4">

                            {/* Product */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Product
                                </label>

                                <select
                                    name="product"
                                    className="form-select"
                                    value={form.product}
                                    onChange={handleChange}
                                    required
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

                            {/* Branch */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Destination Branch
                                </label>

                                <select
                                    name="branch"
                                    className="form-select"
                                    value={form.branch}
                                    onChange={handleChange}
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

                            {/* Quantity */}
                            <div className="col-md-4">

                                <label className="form-label fw-semibold">
                                    Quantity
                                </label>

                                <input
                                    type="number"
                                    name="quantity"
                                    className="form-control"
                                    min="1"
                                    value={form.quantity}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            {/* Date */}
                            <div className="col-md-4">

                                <label className="form-label fw-semibold">
                                    Transfer Date
                                </label>

                                <input
                                    type="date"
                                    name="transfer_date"
                                    className="form-control"
                                    value={form.transfer_date}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            {/* Remarks */}
                            <div className="col-md-4">

                                <label className="form-label fw-semibold">
                                    Remarks
                                </label>

                                <input
                                    type="text"
                                    name="remarks"
                                    className="form-control"
                                    placeholder="Optional remarks"
                                    value={form.remarks}
                                    onChange={handleChange}
                                />

                            </div>

                        </div>

                        <div className="d-flex justify-content-end mt-4">

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving
                                    ? "Transferring..."
                                    : "Transfer Stock"}
                            </button>

                        </div>

                    </form>

                </div>
            </div>

            {/* Transfer History */}
            <div className="card shadow border-0 rounded-4">

                <div className="card-body">

                    <h5 className="fw-bold mb-4">
                        Transfer History
                    </h5>

                    <div className="table-responsive">

                        <table className="table align-middle">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Destination Branch</th>
                                    <th>Quantity</th>
                                    <th>Remarks</th>
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
                                ) : transfers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="text-center py-5 text-muted"
                                        >
                                            No stock transfers found.
                                        </td>
                                    </tr>
                                ) : (
                                    transfers.map((transfer) => (
                                        <tr key={transfer.id}>

                                            <td>
                                                {transfer.id}
                                            </td>

                                            <td>
                                                {transfer.transfer_date}
                                            </td>

                                            <td>
                                                <strong>
                                                    {transfer.product_name}
                                                </strong>
                                            </td>

                                            <td>
                                                {transfer.branch_name}
                                            </td>

                                            <td>
                                                {transfer.quantity}
                                            </td>

                                            <td>
                                                {transfer.remarks || "—"}
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