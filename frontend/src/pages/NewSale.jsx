import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function NewSale() {
    const navigate = useNavigate();

    const [branches, setBranches] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    const [form, setForm] = useState({
        branch: "",
        customer: "",
        sale_date: new Date().toISOString().split("T")[0],
        payment_mode: "Cash",
    });

    const [items, setItems] = useState([
        {
            branch_product: "",
            quantity: 1,
            rate: 0,
        },
    ]);

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // =========================
    // LOAD DATA
    // =========================
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [
                branchesResponse,
                customersResponse,
                productsResponse,
            ] = await Promise.all([
                api.get("branches/"),
                api.get("customers/"),
                api.get("branch-products/"),
            ]);

            const branchesData = Array.isArray(branchesResponse.data)
                ? branchesResponse.data
                : branchesResponse.data.results || [];

            const customersData = Array.isArray(customersResponse.data)
                ? customersResponse.data
                : customersResponse.data.results || [];

            const productsData = Array.isArray(productsResponse.data)
                ? productsResponse.data
                : productsResponse.data.results || [];

            setBranches(branchesData);
            setCustomers(customersData);
            setProducts(productsData);

            // If only one branch is available, select it automatically
            if (branchesData.length === 1) {
                setForm((prev) => ({
                    ...prev,
                    branch: String(branchesData[0].id),
                }));
            }
        } catch (error) {
            console.error("Failed to load sale data:", error);

            alert(
                error.response?.data?.detail ||
                "Unable to load sale information."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // FORM CHANGE
    // =========================
    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        // When branch changes, clear selected products
        if (name === "branch") {
            setItems((prev) =>
                prev.map((item) => ({
                    ...item,
                    branch_product: "",
                    rate: 0,
                }))
            );
        }
    };

    // =========================
    // ADD ITEM
    // =========================
    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                branch_product: "",
                quantity: 1,
                rate: 0,
            },
        ]);
    };

    // =========================
    // REMOVE ITEM
    // =========================
    const removeItem = (index) => {
        if (items.length === 1) {
            alert("At least one product is required.");
            return;
        }

        setItems((prev) =>
            prev.filter((_, itemIndex) => itemIndex !== index)
        );
    };

    // =========================
    // ITEM CHANGE
    // =========================
    const handleItemChange = (index, field, value) => {
        const updatedItems = [...items];

        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value,
        };

        // Automatically load selling price
        // when product is selected
        if (field === "branch_product") {
            const selectedProduct = products.find(
                (product) =>
                    String(product.id) === String(value)
            );

            if (selectedProduct) {
                updatedItems[index].rate =
                    selectedProduct.selling_price || 0;
            }
        }

        setItems(updatedItems);
    };

    // =========================
    // SUBTOTAL
    // =========================
    const getSubtotal = (item) => {
        const quantity = Number(item.quantity || 0);
        const rate = Number(item.rate || 0);

        return quantity * rate;
    };

    // =========================
    // GRAND TOTAL
    // =========================
    const total = items.reduce(
        (sum, item) => sum + getSubtotal(item),
        0
    );

    // =========================
    // AVAILABLE PRODUCTS
    // =========================
    const availableProducts = products.filter((product) => {
        if (!form.branch) {
            return true;
        }

        return (
            String(product.branch) ===
            String(form.branch)
        );
    });

    // =========================
    // SUBMIT SALE
    // =========================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.branch) {
            alert("Please select a branch.");
            return;
        }

        if (!form.sale_date) {
            alert("Please select sale date.");
            return;
        }

        if (!form.payment_mode) {
            alert("Please select payment mode.");
            return;
        }

        if (items.length === 0) {
            alert("Please add at least one product.");
            return;
        }

        for (const item of items) {
            if (!item.branch_product) {
                alert("Please select a product for every item.");
                return;
            }

            if (Number(item.quantity) <= 0) {
                alert("Quantity must be greater than zero.");
                return;
            }

            if (Number(item.rate) < 0) {
                alert("Rate cannot be negative.");
                return;
            }
        }

        try {
            setSaving(true);

            const payload = {
                branch: Number(form.branch),

                customer: form.customer
                    ? Number(form.customer)
                    : null,

                sale_date: form.sale_date,

                payment_mode: form.payment_mode,

                items: items.map((item) => ({
                    branch_product: Number(
                        item.branch_product
                    ),
                    quantity: Number(item.quantity),
                    rate: Number(item.rate),
                })),
            };

            console.log("SALE PAYLOAD:", payload);

            await api.post("sales/", payload);

            alert("Sale completed successfully.");

            navigate("/sales");
        } catch (error) {
            console.error(
                "Sale creation failed:",
                error
            );

            console.error(
                "Server response:",
                error.response?.data
            );

            alert(
                error.response?.data?.detail ||
                error.response?.data?.error ||
                JSON.stringify(
                    error.response?.data
                ) ||
                "Unable to complete sale."
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================
    // LOADING
    // =========================
    if (loading) {
        return (
            <div className="container-fluid">
                <div className="card shadow-sm border-0 rounded-4">
                    <div className="card-body text-center py-5">
                        <div
                            className="spinner-border text-primary mb-3"
                            role="status"
                        ></div>

                        <h5 className="fw-bold">
                            Loading Sale POS...
                        </h5>

                        <p className="text-muted mb-0">
                            Loading branches, customers and products.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">

            {/* =========================================
                PAGE HEADER
            ========================================= */}
            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="fw-bold mb-1">
                        <i className="bi bi-cart-plus-fill text-primary me-2"></i>
                        Ready-Made Product Sale
                    </h2>

                    <p className="text-muted mb-0">
                        Point of sale billing for ready-made apparel items.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/sales")}
                >
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Sales
                </button>

            </div>

            <form onSubmit={handleSubmit}>

                {/* =========================================
                    SALE INFORMATION
                ========================================= */}
                <div className="card shadow-sm border-0 rounded-4 mb-4">

                    <div className="card-body p-4">

                        <h5 className="fw-bold mb-4 border-bottom pb-3">
                            <i className="bi bi-receipt text-primary me-2"></i>
                            Sale Information
                        </h5>

                        <div className="row g-4">

                            {/* Branch */}
                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
                                    Branch
                                </label>

                                <select
                                    name="branch"
                                    className="form-select"
                                    value={form.branch}
                                    onChange={handleFormChange}
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

                            {/* Customer */}
                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
                                    Customer
                                </label>

                                <select
                                    name="customer"
                                    className="form-select"
                                    value={form.customer}
                                    onChange={handleFormChange}
                                >

                                    <option value="">
                                        Walk-in Customer
                                    </option>

                                    {customers.map((customer) => (
                                        <option
                                            key={customer.id}
                                            value={customer.id}
                                        >
                                            {customer.name}
                                            {customer.mobile
                                                ? ` — ${customer.mobile}`
                                                : ""}
                                        </option>
                                    ))}

                                </select>

                            </div>

                            {/* Sale Date */}
                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
                                    Sale Date
                                </label>

                                <input
                                    type="date"
                                    name="sale_date"
                                    className="form-control"
                                    value={form.sale_date}
                                    onChange={handleFormChange}
                                    required
                                />

                            </div>

                            {/* Payment Mode */}
                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
                                    Payment Mode
                                </label>

                                <select
                                    name="payment_mode"
                                    className="form-select"
                                    value={form.payment_mode}
                                    onChange={handleFormChange}
                                    required
                                >

                                    <option value="Cash">
                                        Cash
                                    </option>

                                    <option value="Bank">
                                        Bank
                                    </option>

                                    <option value="Online">
                                        Online
                                    </option>

                                    <option value="Cheque">
                                        Cheque
                                    </option>

                                    <option value="POS">
                                        POS
                                    </option>

                                </select>

                            </div>

                        </div>

                    </div>

                </div>

                {/* =========================================
                    PRODUCTS
                ========================================= */}
                <div className="card shadow-sm border-0 rounded-4 mb-4">

                    <div className="card-body p-4">

                        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">

                            <div>
                                <h5 className="fw-bold mb-1">
                                    <i className="bi bi-box-seam text-primary me-2"></i>
                                    Products & Pricing
                                </h5>

                                <small className="text-muted">
                                    Add ready-made products to the sale.
                                </small>
                            </div>

                            <span className="badge bg-primary-subtle text-primary px-3 py-2">
                                Itemized Cart
                            </span>

                        </div>

                        {/* Product Rows */}

                        {items.map((item, index) => (

                            <div
                                key={index}
                                className="bg-light border rounded-3 p-3 mb-3"
                            >

                                <div className="row g-3 align-items-end">

                                    {/* Product */}
                                    <div className="col-md-5">

                                        <label className="form-label fw-semibold">
                                            Product
                                        </label>

                                        <select
                                            className="form-select"
                                            value={item.branch_product}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "branch_product",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        >

                                            <option value="">
                                                Select Product
                                            </option>

                                            {availableProducts.map(
                                                (product) => (
                                                    <option
                                                        key={product.id}
                                                        value={product.id}
                                                        disabled={
                                                            Number(
                                                                product.stock || 0
                                                            ) <= 0
                                                        }
                                                    >
                                                        {product.product_name ||
                                                            `Product #${product.id}`}
                                                        {" — Stock: "}
                                                        {product.stock ?? 0}
                                                        {" — "}
                                                        ₹{" "}
                                                        {Number(
                                                            product.selling_price || 0
                                                        ).toFixed(2)}
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>

                                    {/* Quantity */}
                                    <div className="col-md-2">

                                        <label className="form-label fw-semibold">
                                            Quantity
                                        </label>

                                        <input
                                            type="number"
                                            className="form-control"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "quantity",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>

                                    {/* Rate */}
                                    <div className="col-md-2">

                                        <label className="form-label fw-semibold">
                                            Rate
                                            <small className="text-muted ms-1">
                                                (Editable)
                                            </small>
                                        </label>

                                        <input
                                            type="number"
                                            className="form-control"
                                            step="0.01"
                                            min="0"
                                            value={item.rate}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "rate",
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>

                                    {/* Subtotal */}
                                    <div className="col-md-2">

                                        <label className="form-label fw-semibold">
                                            Subtotal
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control fw-bold bg-white"
                                            value={getSubtotal(item).toFixed(2)}
                                            readOnly
                                        />

                                    </div>

                                    {/* Delete */}
                                    <div className="col-md-1">

                                        <button
                                            type="button"
                                            className="btn btn-outline-danger w-100"
                                            onClick={() =>
                                                removeItem(index)
                                            }
                                            title="Remove Item"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>

                                    </div>

                                </div>

                            </div>

                        ))}

                        {/* Add Product */}

                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={addItem}
                        >
                            <i className="bi bi-plus-lg me-1"></i>
                            Add Product
                        </button>

                    </div>

                </div>

                {/* =========================================
                    GRAND TOTAL
                ========================================= */}
                <div className="card shadow-sm border-0 rounded-4 mb-4">

                    <div className="card-body p-4">

                        <div className="d-flex justify-content-between align-items-center">

                            <div>

                                <span className="text-muted fw-semibold d-block">
                                    BILL GRAND TOTAL
                                </span>

                                <h2 className="fw-bold text-success mb-0">
                                    ₹ {total.toFixed(2)}
                                </h2>

                            </div>

                            <div
                                className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center"
                                style={{
                                    width: "55px",
                                    height: "55px",
                                    fontSize: "1.5rem",
                                }}
                            >
                                <i className="bi bi-cart-check-fill"></i>
                            </div>

                        </div>

                    </div>

                </div>

                {/* =========================================
                    ACTION BUTTONS
                ========================================= */}
                <div className="d-flex justify-content-end gap-2 mb-5">

                    <button
                        type="button"
                        className="btn btn-secondary px-4"
                        onClick={() => navigate("/sales")}
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="btn btn-success px-5"
                        disabled={saving}
                    >

                        {saving ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                ></span>
                                Processing...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-circle-fill me-1"></i>
                                Complete & Save Sale
                            </>
                        )}

                    </button>

                </div>

            </form>

        </div>
    );
}