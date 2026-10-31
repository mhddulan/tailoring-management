import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function SaleCreate() {
    const navigate = useNavigate();

    const [branches, setBranches] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [branchProducts, setBranchProducts] = useState([]);

    const [form, setForm] = useState({
        branch: "",
        customer: "",
        sale_date: new Date().toISOString().split("T")[0],
        payment_mode: "Cash",
    });

    const [items, setItems] = useState([
        {
            product: "",
            quantity: 1,
            rate: 0,
        },
    ]);

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    /* ==============================
       LOAD DATA
    ============================== */

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
                branchProductsResponse,
            ] = await Promise.all([
                api.get("branches/"),
                api.get("customers/"),
                api.get("products/"),
                api.get("branch-products/"),
            ]);

            const branchesData = Array.isArray(
                branchesResponse.data
            )
                ? branchesResponse.data
                : branchesResponse.data.results || [];

            const customersData = Array.isArray(
                customersResponse.data
            )
                ? customersResponse.data
                : customersResponse.data.results || [];

            const productsData = Array.isArray(
                productsResponse.data
            )
                ? productsResponse.data
                : productsResponse.data.results || [];

            const branchProductsData = Array.isArray(
                branchProductsResponse.data
            )
                ? branchProductsResponse.data
                : branchProductsResponse.data.results || [];

            console.log("Branches:", branchesData);
            console.log("Customers:", customersData);
            console.log("Central Products:", productsData);
            console.log("Branch Product Details:", branchProductsData);

            setBranches(branchesData);
            setCustomers(customersData);
            setProducts(productsData);
            setBranchProducts(branchProductsData);

            // Automatically select the logged-in branch user's assigned branch.
            // Admin users can continue selecting a branch manually.
            const loggedInUser = JSON.parse(
                localStorage.getItem("user") || "{}"
            );

            if (loggedInUser.role === "Branch") {
                const assignedBranchId =
                    loggedInUser.branch_id ??
                    loggedInUser.branch?.id ??
                    loggedInUser.branch;

                if (assignedBranchId) {
                    const assignedBranchExists = branchesData.some(
                        (branch) =>
                            String(branch.id) === String(assignedBranchId)
                    );

                    if (assignedBranchExists) {
                        setForm((previous) => ({
                            ...previous,
                            branch: String(assignedBranchId),
                        }));
                    } else {
                        console.warn(
                            "Assigned branch was not found in branches API:",
                            assignedBranchId
                        );
                    }
                } else {
                    console.warn(
                        "No branch_id found for the logged-in branch user."
                    );
                }
            }

        } catch (error) {
            console.error(
                "Failed to load sale data:",
                error
            );

            alert(
                error.response?.data?.detail ||
                "Unable to load sales data."
            );
        } finally {
            setLoading(false);
        }
    };

    /* ==============================
       HELPERS
    ============================== */

    const getBranchName = (branch) => {
        if (!branch) {
            return "Unnamed Branch";
        }

        return (
            branch.name ||
            branch.branch_name ||
            branch.branch?.name ||
            "Unnamed Branch"
        );
    };

    const getProductName = (product) => {
        if (!product) {
            return "Unnamed Product";
        }

        return (
            product.product_name ||
            product.name ||
            product.product?.name ||
            "Unnamed Product"
        );
    };

    const getBranchProduct = (productId, branchId = form.branch) => {
        return branchProducts.find((item) =>
            String(item.product) === String(productId) &&
            String(item.branch) === String(branchId)
        );
    };

    const getProductRate = (product) => {
        if (!product) return 0;
        const branchProduct = getBranchProduct(product.id);
        return Number(
            branchProduct?.selling_price ??
            product.selling_price ??
            product.price ??
            0
        );
    };

    const getProductStock = (product) => {
        if (!product) return 0;
        return Number(getBranchProduct(product.id)?.stock ?? 0);
    };

    /* ==============================
       FORM CHANGE
    ============================== */

    const handleFormChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        /* Reset selected products when the sale branch changes. */
        if (name === "branch") {
            setItems((previous) =>
                previous.map((item) => ({
                    ...item,
                    product: "",
                    rate: 0,
                }))
            );
        }
    };

    /* ==============================
       CART
    ============================== */

    const addItem = () => {
        setItems((previous) => [
            ...previous,
            {
                product: "",
                quantity: 1,
                rate: 0,
            },
        ]);
    };

    const removeItem = (index) => {
        if (items.length === 1) {
            return;
        }

        setItems((previous) =>
            previous.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )
        );
    };

    const handleItemChange = (
        index,
        field,
        value
    ) => {
        const updatedItems = [...items];

        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value,
        };

        /*
         * Automatically get selling price
         * when product is selected.
         */
        if (field === "product") {

            const product = products.find(
                (item) => String(item.id) === String(value)
            );

            if (product) {
                updatedItems[index].rate =
                    getProductRate(product);
            }
        }

        setItems(updatedItems);
    };

    /* ==============================
       SUBTOTAL
    ============================== */

    const getSubtotal = (item) => {
        const quantity = Number(
            item.quantity || 0
        );

        const rate = Number(
            item.rate || 0
        );

        return quantity * rate;
    };

    const total = items.reduce(
        (sum, item) =>
            sum + getSubtotal(item),
        0
    );

    /* ==============================
       SUBMIT SALE
    ============================== */

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
            alert(
                "Please add at least one product."
            );
            return;
        }

        for (const item of items) {

            if (!item.product) {
                alert(
                    "Please select a product for every item."
                );
                return;
            }

            if (
                !item.quantity ||
                Number(item.quantity) <= 0
            ) {
                alert(
                    "Quantity must be greater than zero."
                );
                return;
            }

            if (
                item.rate === "" ||
                Number(item.rate) < 0
            ) {
                alert(
                    "Invalid product rate."
                );
                return;
            }

            // Stock is informational only. Sales are allowed even when
            // available stock is zero or lower than the sale quantity.
        }

        try {
            setSaving(true);

            const payload = {
                branch: Number(form.branch),

                customer: form.customer
                    ? Number(form.customer)
                    : null,

                sale_date: form.sale_date,

                payment_mode:
                    form.payment_mode,

                items: items.map((item) => ({
                    product:
                        Number(item.product),

                    quantity:
                        Number(
                            item.quantity
                        ),

                    rate:
                        Number(
                            item.rate
                        ),
                })),
            };

            console.log(
                "Creating sale:",
                payload
            );

            await api.post(
                "sales/",
                payload
            );

            alert(
                "Sale completed successfully."
            );

            navigate("/sales");

        } catch (error) {

            console.log("SALE ERROR RESPONSE:", error.response?.data
            );

            const errorMessage =
                error.response?.data?.error ||
                error.response?.data?.detail ||
                error.response?.data?.message ||
                JSON.stringify(
                    error.response?.data
                ) ||
                "Unable to complete sale.";

            alert(errorMessage);

        } finally {
            setSaving(false);
        }
    };

    /* Central products are available to every selected branch. */
    const availableProducts = products.filter(
        (product) => product.active !== false
    );

    /* ==============================
       LOADING
    ============================== */

    if (loading) {
        return (
            <div className="card shadow border-0 rounded-4">

                <div className="card-body text-center py-5">

                    <div
                        className="spinner-border mb-3"
                        role="status"
                    ></div>

                    <div>
                        Loading sales data...
                    </div>

                </div>

            </div>
        );
    }

    /* ==============================
       PAGE
    ============================== */

    return (
        <div>

            {/* ==========================
                HEADER
            ========================== */}

            <div className="card shadow border-0 rounded-4 mb-4">

                <div className="card-body d-flex justify-content-between align-items-center">

                    <div>

                        <h2 className="fw-bold mb-1">

                            <i className="bi bi-cart-plus me-2"></i>

                            New Sale

                        </h2>

                        <p className="text-muted mb-0">

                            Create a product sale. Stock availability will not block the sale.

                        </p>

                    </div>

                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={() =>
                            navigate("/sales")
                        }
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Sales
                    </button>

                </div>

            </div>

            <form onSubmit={handleSubmit}>

                {/* ==========================
                    SALE INFORMATION
                ========================== */}

                <div className="card shadow border-0 rounded-4 mb-4">

                    <div className="card-body">

                        <h5 className="fw-bold mb-4">

                            <i className="bi bi-info-circle me-2"></i>

                            Sale Information

                        </h5>

                        <div className="row g-4">

                            {/* Branch */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">

                                    Branch

                                </label>

                                <select
                                    name="branch"
                                    className="form-select"
                                    value={
                                        form.branch
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    required
                                >

                                    <option value="">
                                        Select Branch
                                    </option>

                                    {branches.map(
                                        (branch) => (

                                            <option
                                                key={
                                                    branch.id
                                                }
                                                value={
                                                    branch.id
                                                }
                                            >
                                                {getBranchName(
                                                    branch
                                                )}
                                            </option>

                                        )
                                    )}

                                </select>

                                {branches.length ===
                                    0 && (
                                    <small className="text-danger">
                                        No branches available.
                                    </small>
                                )}

                            </div>

                            {/* Customer */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">

                                    Customer

                                </label>

                                <select
                                    name="customer"
                                    className="form-select"
                                    value={
                                        form.customer
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                >

                                    <option value="">
                                        Walk-in Customer
                                    </option>

                                    {customers.map(
                                        (customer) => (

                                            <option
                                                key={
                                                    customer.id
                                                }
                                                value={
                                                    customer.id
                                                }
                                            >
                                                {customer.name}
                                                {customer.mobile
                                                    ? ` — ${customer.mobile}`
                                                    : ""}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                            {/* Date */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">

                                    Sale Date

                                </label>

                                <input
                                    type="date"
                                    name="sale_date"
                                    className="form-control"
                                    value={
                                        form.sale_date
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    required
                                />

                            </div>

                            {/* Payment Mode */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">

                                    Payment Mode

                                </label>

                                <select
                                    name="payment_mode"
                                    className="form-select"
                                    value={
                                        form.payment_mode
                                    }
                                    onChange={
                                        handleFormChange
                                    }
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

                {/* ==========================
                    ITEMIZED CART
                ========================== */}

                <div className="card shadow border-0 rounded-4 mb-4">

                    <div className="card-body">

                        <div className="d-flex justify-content-between align-items-center mb-4">

                            <h5 className="fw-bold mb-0">

                                <i className="bi bi-cart3 me-2"></i>

                                Itemized Cart

                            </h5>

                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={addItem}
                            >

                                <i className="bi bi-plus-lg me-2"></i>

                                Add Item

                            </button>

                        </div>

                        {!form.branch && (
                            <div className="alert alert-info">

                                <i className="bi bi-info-circle me-2"></i>

                                Select a branch to create a sale. All active central products will be available; stock is shown for the selected branch.

                            </div>
                        )}

                        {form.branch && availableProducts.length === 0 && (
                            <div className="alert alert-warning">
                                No active products found in the central Products list.
                            </div>
                        )}

                        <div className="table-responsive">

                            <table className="table align-middle">

                                <thead>

                                    <tr>

                                        <th>
                                            Product
                                        </th>

                                        <th
                                            style={{
                                                width: "130px",
                                            }}
                                        >
                                            Quantity
                                        </th>

                                        <th
                                            style={{
                                                width: "160px",
                                            }}
                                        >
                                            Rate
                                        </th>

                                        <th
                                            style={{
                                                width: "160px",
                                            }}
                                        >
                                            Subtotal
                                        </th>

                                        <th
                                            style={{
                                                width: "70px",
                                            }}
                                        ></th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {items.map(
                                        (
                                            item,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    index
                                                }
                                            >

                                                {/* PRODUCT */}

                                                <td>

                                                    <select
                                                        className="form-select"
                                                        value={
                                                            item.product
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleItemChange(
                                                                index,
                                                                "product",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        required
                                                        disabled={
                                                            !form.branch
                                                        }
                                                    >

                                                        <option value="">
                                                            Select Product
                                                        </option>

                                                        {availableProducts.map(
                                                            (
                                                                product
                                                            ) => (

                                                                <option
                                                                    key={
                                                                        product.id
                                                                    }
                                                                    value={
                                                                        product.id
                                                                    }
                                                                >

                                                                    {getProductName(
                                                                        product
                                                                    )}

                                                                    {" — Branch Stock: "}

                                                                    {getProductStock(product)}

                                                                    {" — SAR"}

                                                                    {Number(
                                                                        getProductRate(
                                                                            product
                                                                        )
                                                                    ).toFixed(
                                                                        2
                                                                    )}

                                                                </option>

                                                            )
                                                        )}

                                                    </select>

                                                </td>

                                                {/* QUANTITY */}

                                                <td>

                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        min="1"
                                                        value={
                                                            item.quantity
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleItemChange(
                                                                index,
                                                                "quantity",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        required
                                                    />

                                                </td>

                                                {/* RATE */}

                                                <td>

                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        step="0.01"
                                                        min="0"
                                                        value={
                                                            item.rate
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleItemChange(
                                                                index,
                                                                "rate",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        required
                                                    />

                                                </td>

                                                {/* SUBTOTAL */}

                                                <td className="fw-bold">

                                                    SAR{" "}

                                                    {getSubtotal(
                                                        item
                                                    ).toFixed(
                                                        2
                                                    )}

                                                </td>

                                                {/* DELETE */}

                                                <td>

                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() =>
                                                            removeItem(
                                                                index
                                                            )
                                                        }
                                                        disabled={
                                                            items.length ===
                                                            1
                                                        }
                                                    >

                                                        <i className="bi bi-trash"></i>

                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

                {/* ==========================
                    TOTAL
                ========================== */}

                <div className="card shadow border-0 rounded-4">

                    <div className="card-body">

                        <div className="d-flex justify-content-between align-items-center">

                            <div>

                                <span className="text-muted">

                                    Grand Total

                                </span>

                                <h2 className="fw-bold mb-0">

                                    SAR{" "}

                                    {total.toFixed(
                                        2
                                    )}

                                </h2>

                            </div>

                            <div className="d-flex gap-2">

                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={() =>
                                        navigate(
                                            "/sales"
                                        )
                                    }
                                >

                                    Cancel

                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={
                                        saving ||
                                        !form.branch
                                    }
                                >

                                    {saving ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                            ></span>

                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg me-2"></i>

                                            Complete Sale
                                        </>
                                    )}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            </form>

        </div>
    );
}