import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./OrderCreate.css";

function OrderEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    const [customer, setCustomer] = useState("");
    const [orderDate, setOrderDate] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [status, setStatus] = useState("Pending");
    const [paymentMode, setPaymentMode] = useState("Cash");

    const [items, setItems] = useState([]);

    const [pageLoading, setPageLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, [id]);

    // =========================================================
    // LOAD ORDER + CUSTOMERS + PRODUCTS
    // =========================================================

    const loadData = async () => {
        try {
            setPageLoading(true);
            setError("");

            const [
                orderResponse,
                customerResponse,
                productResponse,
            ] = await Promise.all([
                api.get(`orders/${id}/`),
                api.get("customers/"),
                api.get("products/"),
            ]);

            const order = orderResponse.data;

            const customerData =
                customerResponse.data;

            const productData =
                productResponse.data;

            setCustomers(
                Array.isArray(customerData)
                    ? customerData
                    : customerData.results || []
            );

            setProducts(
                Array.isArray(productData)
                    ? productData
                    : productData.results || []
            );

            setCustomer(
                order.customer || ""
            );

            setOrderDate(
                order.order_date || ""
            );

            setDeliveryDate(
                order.delivery_date || ""
            );

            setStatus(
                order.status || "Pending"
            );

            setPaymentMode(
                order.advance_payment_mode || "Cash"
            );

            const orderItems =
                Array.isArray(order.items)
                    ? order.items
                    : [];

            if (orderItems.length > 0) {
                setItems(
                    orderItems.map((item) => ({
                        id: item.id,
                        product: item.product || "",
                        quantity: Number(
                            item.quantity || 1
                        ),
                        rate: Number(
                            item.rate || 0
                        ),
                        amount:
                            Number(
                                item.quantity || 0
                            ) *
                            Number(
                                item.rate || 0
                            ),
                    }))
                );
            } else {
                setItems([
                    {
                        product: "",
                        quantity: 1,
                        rate: 0,
                        amount: 0,
                    },
                ]);
            }

        } catch (err) {
            console.error(
                "Unable to load order:",
                err
            );

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to load order."
            );
        } finally {
            setPageLoading(false);
        }
    };

    // =========================================================
    // PRODUCT PRICE
    // =========================================================

    const loadProductPrice = async (
        productId,
        customerId,
        index
    ) => {
        if (!productId) {
            updateItem(index, {
                product: "",
                rate: 0,
            });
            return;
        }

        if (!customerId) {
            setError(
                "Please select a customer first."
            );
            return;
        }

        try {
            setError("");

            const response = await api.get(
                `orders/order-price/?product_id=${productId}&customer_id=${customerId}`
            );

            const price = Number(
                response.data?.price || 0
            );

            updateItem(index, {
                product: productId,
                rate: price,
            });

        } catch (err) {
            console.error(
                "Unable to load product price:",
                err
            );

            updateItem(index, {
                product: productId,
                rate: 0,
            });

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to load product price."
            );
        }
    };

    // =========================================================
    // UPDATE ITEM
    // =========================================================

    const updateItem = (
        index,
        changes
    ) => {
        setItems((current) =>
            current.map((item, i) => {
                if (i !== index) {
                    return item;
                }

                const updated = {
                    ...item,
                    ...changes,
                };

                updated.amount =
                    Number(
                        updated.quantity || 0
                    ) *
                    Number(
                        updated.rate || 0
                    );

                return updated;
            })
        );
    };

    // =========================================================
    // ADD ITEM
    // =========================================================

    const addItem = () => {
        setItems((current) => [
            ...current,
            {
                id: null,
                product: "",
                quantity: 1,
                rate: 0,
                amount: 0,
            },
        ]);
    };

    // =========================================================
    // REMOVE ITEM
    // =========================================================

    const removeItem = (index) => {
        if (items.length === 1) {
            return;
        }

        setItems((current) =>
            current.filter(
                (_, i) => i !== index
            )
        );
    };

    // =========================================================
    // TOTAL
    // =========================================================

    const total = items.reduce(
        (sum, item) =>
            sum +
            Number(item.amount || 0),
        0
    );

    // =========================================================
    // SAVE
    // =========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!customer) {
            setError(
                "Please select a customer."
            );
            return;
        }

        const validItems =
            items.filter(
                (item) => item.product
            );

        if (validItems.length === 0) {
            setError(
                "Please add at least one product."
            );
            return;
        }

        if (
            validItems.some(
                (item) =>
                    Number(item.quantity) <= 0
            )
        ) {
            setError(
                "Quantity must be greater than zero."
            );
            return;
        }

        if (
            validItems.some(
                (item) =>
                    Number(item.rate) < 0
            )
        ) {
            setError(
                "Rate cannot be negative."
            );
            return;
        }

        try {
            setLoading(true);

            // -------------------------------------------------
            // UPDATE ORDER
            // -------------------------------------------------

            await api.patch(
                `orders/${id}/`,
                {
                    customer:
                        Number(customer),

                    order_date:
                        orderDate,

                    delivery_date:
                        deliveryDate,

                    advance_payment_mode:
                        paymentMode,

                    status,
                }
            );

            // -------------------------------------------------
            // EXISTING + NEW ITEMS
            // -------------------------------------------------

            const existingItems =
                validItems.filter(
                    (item) => item.id
                );

            const newItems =
                validItems.filter(
                    (item) => !item.id
                );

            // -------------------------------------------------
            // UPDATE EXISTING ITEMS
            // -------------------------------------------------

            for (
                const item
                of existingItems
            ) {
                await api.put(
                    `order-items/${item.id}/`,
                    {
                        order:
                            Number(id),

                        product:
                            Number(
                                item.product
                            ),

                        quantity:
                            Number(
                                item.quantity
                            ),

                        rate:
                            Number(
                                item.rate
                            ),

                        amount:
                            Number(
                                item.amount
                            ),
                    }
                );
            }

            // -------------------------------------------------
            // CREATE NEW ITEMS
            // -------------------------------------------------

            for (
                const item
                of newItems
            ) {
                await api.post(
                    "order-items/",
                    {
                        order:
                            Number(id),

                        product:
                            Number(
                                item.product
                            ),

                        quantity:
                            Number(
                                item.quantity
                            ),

                        rate:
                            Number(
                                item.rate
                            ),

                        amount:
                            Number(
                                item.amount
                            ),
                    }
                );
            }

            // -------------------------------------------------
            // FIND CURRENT ITEMS
            // -------------------------------------------------

            const currentItemsResponse =
                await api.get(
                    `order-items/?order=${id}`
                );

            const currentItems =
                Array.isArray(
                    currentItemsResponse.data
                )
                    ? currentItemsResponse.data
                    : currentItemsResponse.data.results || [];

            const keepIds =
                validItems
                    .filter(
                        (item) => item.id
                    )
                    .map(
                        (item) =>
                            Number(item.id)
                    );

            // -------------------------------------------------
            // DELETE REMOVED ITEMS
            // -------------------------------------------------

            for (
                const item
                of currentItems
            ) {
                if (
                    !keepIds.includes(
                        Number(item.id)
                    ) &&
                    !newItems.some(
                        (newItem) =>
                            Number(
                                newItem.product
                            ) ===
                            Number(
                                item.product
                            )
                    )
                ) {
                    await api.delete(
                        `order-items/${item.id}/`
                    );
                }
            }

            navigate(
                `/orders/${id}`
            );

        } catch (err) {
            console.error(
                "Order update failed:",
                err
            );

            const data =
                err.response?.data;

            setError(
                data?.detail ||
                data?.error ||
                data?.message ||
                data?.customer?.[0] ||
                data?.items?.[0] ||
                "Unable to update order."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (pageLoading) {
        return (
            <div className="order-create-loading">

                <div
                    className="spinner-border"
                    role="status"
                ></div>

                <p>
                    Loading order...
                </p>

            </div>
        );
    }

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="order-create-page">

            {/* HEADER */}

            <div className="order-create-header">

                <div>

                    <div className="page-breadcrumb">

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/orders"
                                )
                            }
                        >
                            Orders
                        </button>

                        <i className="bi bi-chevron-right"></i>

                        <span>
                            Edit Order
                        </span>

                    </div>

                    <h1>
                        Edit Order #{id}
                    </h1>

                    <p>
                        Update order details
                        and order items.
                    </p>

                </div>

                <button
                    type="button"
                    className="btn btn-light"
                    onClick={() =>
                        navigate(
                            `/orders/${id}`
                        )
                    }
                >
                    <i className="bi bi-arrow-left me-2"></i>

                    Back to Order
                </button>

            </div>

            {/* ERROR */}

            {error && (
                <div className="alert alert-danger">

                    <i className="bi bi-exclamation-triangle me-2"></i>

                    {error}

                </div>
            )}

            <form
                onSubmit={handleSubmit}
            >

                {/* =================================================
                    ORDER INFORMATION
                ================================================= */}

                <div className="order-form-card">

                    <div className="order-form-card-header">

                        <div className="form-section-icon">

                            <i className="bi bi-receipt"></i>

                        </div>

                        <div>

                            <h3>
                                Order Information
                            </h3>

                            <p>
                                Update basic order details
                            </p>

                        </div>

                    </div>

                    <div className="row g-3">

                        {/* CUSTOMER */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Customer
                            </label>

                            <select
                                className="form-select"
                                value={customer}
                                onChange={(e) => {

                                    const value =
                                        e.target.value;

                                    setCustomer(
                                        value
                                    );

                                    setItems(
                                        (current) =>
                                            current.map(
                                                (item) => ({
                                                    ...item,
                                                    rate: 0,
                                                    amount: 0,
                                                })
                                            )
                                    );

                                }}
                                required
                            >

                                <option value="">
                                    Select Customer
                                </option>

                                {customers.map(
                                    (item) => (

                                        <option
                                            key={
                                                item.id
                                            }
                                            value={
                                                item.id
                                            }
                                        >

                                            {item.name}

                                            {item.mobile
                                                ? ` - ${item.mobile}`
                                                : ""}

                                        </option>

                                    )
                                )}

                            </select>

                        </div>

                        {/* ORDER DATE */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Order Date
                            </label>

                            <input
                                type="date"
                                className="form-control"
                                value={orderDate}
                                onChange={(e) =>
                                    setOrderDate(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>

                        {/* DELIVERY DATE */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Delivery Date
                            </label>

                            <input
                                type="date"
                                className="form-control"
                                value={
                                    deliveryDate
                                }
                                onChange={(e) =>
                                    setDeliveryDate(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>

                        {/* PAYMENT MODE */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Advance Payment Mode
                            </label>

                            <select
                                className="form-select"
                                value={
                                    paymentMode
                                }
                                onChange={(e) =>
                                    setPaymentMode(
                                        e.target.value
                                    )
                                }
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

                        {/* STATUS */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Status
                            </label>

                            <select
                                className="form-select"
                                value={status}
                                onChange={(e) =>
                                    setStatus(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="Pending">
                                    Pending
                                </option>

                                <option value="Cutting">
                                    Cutting
                                </option>

                                <option value="Stitching">
                                    Stitching
                                </option>

                                <option value="Ready">
                                    Ready
                                </option>

                                <option value="Delivery">
                                    Delivery
                                </option>

                                <option value="Delivered">
                                    Delivered
                                </option>

                            </select>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    ORDER ITEMS
                ================================================= */}

                <div className="order-form-card">

                    <div className="section-header">

                        <div>

                            <h3>
                                Order Items
                            </h3>

                            <p>
                                Update products in this order
                            </p>

                        </div>

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={
                                addItem
                            }
                        >

                            <i className="bi bi-plus-lg me-2"></i>

                            Add Item

                        </button>

                    </div>

                    <div className="table-responsive">

                        <table className="order-create-table">

                            <thead>

                                <tr>

                                    <th>
                                        Product
                                    </th>

                                    <th width="140">
                                        Quantity
                                    </th>

                                    <th width="180">
                                        Rate
                                    </th>

                                    <th width="180">
                                        Amount
                                    </th>

                                    <th width="60"></th>

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
                                                item.id ||
                                                `new-${index}`
                                            }
                                        >

                                            <td>

                                                <select
                                                    className="form-select"
                                                    value={
                                                        item.product
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        loadProductPrice(
                                                            e.target.value,
                                                            customer,
                                                            index
                                                        )
                                                    }
                                                    required
                                                >

                                                    <option value="">
                                                        Select Product
                                                    </option>

                                                    {products.map(
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

                                                                {
                                                                    product.name
                                                                }

                                                            </option>

                                                        )
                                                    )}

                                                </select>

                                            </td>

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
                                                        updateItem(
                                                            index,
                                                            {
                                                                quantity:
                                                                    Number(
                                                                        e
                                                                            .target
                                                                            .value
                                                                    ),
                                                            }
                                                        )
                                                    }
                                                    required
                                                />

                                            </td>

                                            <td>

                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        item.rate
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        updateItem(
                                                            index,
                                                            {
                                                                rate:
                                                                    Number(
                                                                        e
                                                                            .target
                                                                            .value
                                                                    ),
                                                            }
                                                        )
                                                    }
                                                    required
                                                />

                                            </td>

                                            <td>

                                                <input
                                                    type="text"
                                                    className="form-control amount-input"
                                                    value={Number(
                                                        item.amount ||
                                                        0
                                                    ).toFixed(
                                                        2
                                                    )}
                                                    readOnly
                                                />

                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm"
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

                            <tfoot>

                                <tr>

                                    <td
                                        colSpan="3"
                                        className="total-label"
                                    >
                                        Order Total
                                    </td>

                                    <td
                                        colSpan="2"
                                        className="total-value"
                                    >

                                        SAR{" "}
                                        {total.toFixed(
                                            2
                                        )}

                                    </td>

                                </tr>

                            </tfoot>

                        </table>

                    </div>

                </div>

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="order-create-actions">

                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={() =>
                            navigate(
                                `/orders/${id}`
                            )
                        }
                        disabled={
                            loading
                        }
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={
                            loading
                        }
                    >

                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-lg me-2"></i>
                                Update Order
                            </>
                        )}

                    </button>

                </div>

            </form>

        </div>
    );
}

export default OrderEdit;