import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./OrderCreate.css";

function OrderCreate() {
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    const [customer, setCustomer] = useState("");
    const [orderDate, setOrderDate] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [status, setStatus] = useState("Pending");

    const [paymentMode, setPaymentMode] = useState("Cash");
    const [advance, setAdvance] = useState("");

    const [items, setItems] = useState([
        {
            product: "",
            quantity: 1,
            rate: 0,
            amount: 0,
        },
    ]);

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState("");

    // ---------------------------------------------------------
    // LOAD CUSTOMERS + PRODUCTS
    // ---------------------------------------------------------

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setPageLoading(true);
            setError("");

            const today = new Date()
                .toISOString()
                .split("T")[0];

            setOrderDate(today);
            setDeliveryDate(today);

            const [
                customerResponse,
                productResponse,
            ] = await Promise.all([
                api.get("customers/"),
                api.get("products/"),
            ]);

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

        } catch (err) {
            console.error(
                "Unable to load order data:",
                err
            );

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to load customers and products."
            );
        } finally {
            setPageLoading(false);
        }
    };

    // ---------------------------------------------------------
    // PRODUCT PRICE
    // ---------------------------------------------------------

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
            updateItem(index, {
                product: productId,
                rate: 0,
            });

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

    // ---------------------------------------------------------
    // ITEM UPDATE
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // ADD ITEM
    // ---------------------------------------------------------

    const addItem = () => {
        setItems((current) => [
            ...current,
            {
                product: "",
                quantity: 1,
                rate: 0,
                amount: 0,
            },
        ]);
    };

    // ---------------------------------------------------------
    // REMOVE ITEM
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // TOTAL
    // ---------------------------------------------------------

    const total = items.reduce(
        (sum, item) =>
            sum +
            Number(item.amount || 0),
        0
    );

    const advanceAmount =
        Number(advance || 0);

    const balance =
        total - advanceAmount;

    // ---------------------------------------------------------
    // SAVE ORDER
    // ---------------------------------------------------------

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        // CUSTOMER
        if (!customer) {
            setError(
                "Please select a customer."
            );
            return;
        }

        // VALID ITEMS
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

        // QUANTITY
        if (
            validItems.some(
                (item) =>
                    Number(
                        item.quantity
                    ) <= 0
            )
        ) {
            setError(
                "Quantity must be greater than zero."
            );
            return;
        }

        // RATE
        if (
            validItems.some(
                (item) =>
                    Number(
                        item.rate
                    ) < 0
            )
        ) {
            setError(
                "Rate cannot be negative."
            );
            return;
        }

        // ADVANCE
        if (advanceAmount < 0) {
            setError(
                "Advance amount cannot be negative."
            );
            return;
        }

        // ADVANCE > TOTAL
        if (advanceAmount > total) {
            setError(
                "Advance cannot exceed the order total."
            );
            return;
        }

        try {
            setLoading(true);

            // -------------------------------------------------
            // CREATE ORDER + ITEMS + ADVANCE
            // -------------------------------------------------

            const response =
                await api.post(
                    "orders/",
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

                        // ORDER ITEMS
                        items:
                            validItems.map(
                                (item) => ({
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
                                })
                            ),

                        // ADVANCE PAYMENT
                        advance_amount:
                            advanceAmount,
                    }
                );

            const createdOrder =
                response.data;

            const orderId =
                createdOrder.id ||
                createdOrder.pk;

            if (!orderId) {
                throw new Error(
                    "Order was created but no order ID was returned."
                );
            }

            // GO TO ORDER DETAIL
            navigate(
                `/orders/${orderId}`
            );

        } catch (err) {

            console.error(
                "Order creation failed:",
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
                data?.advance_amount?.[0] ||
                "Unable to create order."
            );

        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // PAGE LOADING
    // ---------------------------------------------------------

    if (pageLoading) {
        return (
            <div className="order-create-loading">

                <div
                    className="spinner-border"
                    role="status"
                ></div>

                <p>
                    Loading order form...
                </p>

            </div>
        );
    }

    // ---------------------------------------------------------
    // PAGE
    // ---------------------------------------------------------

    return (
        <div className="order-create-page">

            {/* =================================================
                HEADER
            ================================================= */}

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
                            Create Order
                        </span>

                    </div>

                    <h1>
                        Create Order
                    </h1>

                    <p>
                        Create a new customer order
                        with products and payment details.
                    </p>

                </div>

                <button
                    type="button"
                    className="btn btn-light"
                    onClick={() =>
                        navigate(
                            "/orders"
                        )
                    }
                >
                    <i className="bi bi-arrow-left me-2"></i>

                    Back to Orders
                </button>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

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
                                Enter basic order details
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

                                    setCustomer(
                                        e.target.value
                                    );

                                    setItems(
                                        (current) =>
                                            current.map(
                                                (
                                                    item
                                                ) => ({
                                                    ...item,
                                                    rate: 0,
                                                    amount: 0,
                                                })
                                            )
                                    );

                                    setError("");

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
                                Initial Status
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
                                Add products to this order
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

                                            {/* RATE */}

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

                                            {/* AMOUNT */}

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

                                            {/* REMOVE */}

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
                    ORDER SUMMARY
                ================================================= */}

                <div className="row mt-3 justify-content-end">

                    <div className="col-12 col-md-5 col-lg-4">

                        <div className="card p-3 bg-light border">

                            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">

                                Order Summary

                            </h6>

                            <div className="d-flex justify-content-between mb-2">

                                <span className="text-muted">
                                    Grand Total:
                                </span>

                                <strong className="text-dark fs-5">
                                    SAR{" "}
                                    {total.toFixed(
                                        2
                                    )}
                                </strong>

                            </div>

                            <div className="d-flex justify-content-between mb-2">

                                <span className="text-muted">
                                    Advance Paid:
                                </span>

                                <strong className="text-success">
                                    SAR{" "}
                                    {advanceAmount.toFixed(
                                        2
                                    )}
                                </strong>

                            </div>

                            <hr className="my-2" />

                            <div className="d-flex justify-content-between">

                                <span className="fw-bold text-dark">
                                    Balance Due:
                                </span>

                                <strong className="text-danger fs-5">

                                    SAR{" "}
                                    {Math.max(
                                        balance,
                                        0
                                    ).toFixed(
                                        2
                                    )}

                                </strong>

                            </div>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    ADVANCE PAYMENT
                ================================================= */}

                <div className="order-form-card">

                    <div className="order-form-card-header">

                        <div className="form-section-icon">

                            <i className="bi bi-wallet2"></i>

                        </div>

                        <div>

                            <h3>
                                Advance Payment
                            </h3>

                            <p>
                                Enter advance received
                            </p>

                        </div>

                    </div>

                    <div className="row g-3">

                        {/* ADVANCE */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Advance Amount
                            </label>

                            <input
                                type="number"
                                className="form-control"
                                min="0"
                                step="0.01"
                                placeholder="Advance amount"
                                value={
                                    advance
                                }
                                onChange={(e) =>
                                    setAdvance(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        {/* PAYMENT MODE */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Payment Mode
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

                        {/* BALANCE */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Balance
                            </label>

                            <div className="balance-preview">

                                SAR{" "}
                                {Math.max(
                                    balance,
                                    0
                                ).toFixed(
                                    2
                                )}

                            </div>

                        </div>

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
                                "/orders"
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

                                Save Order
                            </>
                        )}

                    </button>

                </div>

            </form>

        </div>
    );
}

export default OrderCreate;