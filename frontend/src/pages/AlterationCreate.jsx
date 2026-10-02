import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AlterationCreate() {

    const navigate = useNavigate();

    // ============================================================
    // USER
    // ============================================================

    const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const isAdmin =
        storedUser.role === "Admin" ||
        storedUser.is_superuser === true;

    const isBranchUser =
        storedUser.role === "Branch";

    const loggedInBranchId =
        storedUser.branch_id ||
        storedUser.branch?.id ||
        "";

    // ============================================================
    // DATA
    // ============================================================

    const [branches, setBranches] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);

    // ============================================================
    // CUSTOMER TYPE
    // ============================================================

    const [customerType, setCustomerType] =
        useState("existing");

    // ============================================================
    // FORM
    // ============================================================

    const [form, setForm] = useState({

        branch: "",

        customer: "",
        customer_name: "",
        phone: "",

        alteration_date:
            new Date().toISOString().split("T")[0],

        expected_delivery_date: "",
        expected_delivery_time: "",

        product: "",
        item_name: "",

        custom_size: "",
        notes: "",

        total_amount: "",
        advance_amount: "",

        advance_payment_mode: "Cash",

        assigned_employee: "",
    });

    // ============================================================
    // STATE
    // ============================================================

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");

    // ============================================================
    // HELPER
    // ============================================================

    const getBranchId = (item) => {

        if (!item) {
            return "";
        }

        if (item.branch_id) {
            return String(item.branch_id);
        }

        if (item.branch?.id) {
            return String(item.branch.id);
        }

        if (
            item.branch !== undefined &&
            item.branch !== null
        ) {
            return String(item.branch);
        }

        return "";
    };

    // ============================================================
    // LOAD DATA
    // ============================================================

    useEffect(() => {

        loadData();

    }, []);

    const loadData = async () => {

        setLoadingData(true);
        setError("");

        try {

            const [
                branchRes,
                customerRes,
                employeeRes,
                productRes,
            ] = await Promise.all([

                api.get("branches/"),
                api.get("customers/"),
                api.get("employees/"),
                api.get("products/"),

            ]);

            const branchData =
                branchRes.data.results ||
                branchRes.data ||
                [];

            const customerData =
                customerRes.data.results ||
                customerRes.data ||
                [];

            const employeeData =
                employeeRes.data.results ||
                employeeRes.data ||
                [];

            const productData =
                productRes.data.results ||
                productRes.data ||
                [];

            setBranches(branchData);
            setCustomers(customerData);
            setEmployees(employeeData);
            setProducts(productData);

            // ====================================================
            // BRANCH USER AUTO SELECT
            // ====================================================

            if (isBranchUser) {

                let branchId =
                    loggedInBranchId;

                // Fallback:
                // If login data doesn't contain branch_id,
                // try to find the branch from available data.
                if (!branchId) {

                    const firstEmployee =
                        employeeData.find(
                            (employee) =>
                                getBranchId(employee)
                        );

                    if (firstEmployee) {

                        branchId =
                            getBranchId(firstEmployee);
                    }
                }

                // Another fallback:
                // If only one branch is available.
                if (
                    !branchId &&
                    branchData.length === 1
                ) {

                    branchId =
                        String(branchData[0].id);
                }

                if (branchId) {

                    setForm((prev) => ({
                        ...prev,
                        branch: String(branchId),
                    }));

                } else {

                    setError(
                        "Your account is not assigned to a branch."
                    );
                }
            }

        } catch (err) {

            console.error(
                "Alteration load error:",
                err
            );

            setError(
                "Unable to load form data."
            );

        } finally {

            setLoadingData(false);
        }
    };

    // ============================================================
    // INPUT CHANGE
    // ============================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ============================================================
    // CUSTOMER TYPE
    // ============================================================

    const handleCustomerTypeChange = (e) => {

        const type =
            e.target.value;

        setCustomerType(type);

        setForm((prev) => ({

            ...prev,

            customer: "",
            customer_name: "",
            phone: "",

        }));
    };

    // ============================================================
    // EXISTING CUSTOMER
    // ============================================================

    const handleCustomerChange = (e) => {

        const customerId =
            e.target.value;

        const selectedCustomer =
            customers.find(
                (customer) =>
                    String(customer.id) ===
                    String(customerId)
            );

        if (!selectedCustomer) {

            setForm((prev) => ({

                ...prev,

                customer: "",
                customer_name: "",
                phone: "",

            }));

            return;
        }

        setForm((prev) => ({

            ...prev,

            customer:
                customerId,

            customer_name:
                selectedCustomer.name || "",

            phone:
                selectedCustomer.mobile ||
                selectedCustomer.phone ||
                "",

        }));
    };

    // ============================================================
    // BRANCH CHANGE
    // ADMIN ONLY
    // ============================================================

    const handleBranchChange = (e) => {

        if (isBranchUser) {
            return;
        }

        const branchId =
            e.target.value;

        setForm((prev) => ({

            ...prev,

            branch:
                branchId,

            assigned_employee:
                "",

            customer:
                "",

            customer_name:
                "",

            phone:
                "",

        }));
    };

    // ============================================================
    // FILTER CUSTOMERS
    // ============================================================

    const availableCustomers =
        form.branch

            ? customers.filter(
                (customer) =>
                    getBranchId(customer) ===
                    String(form.branch)
            )

            : [];

    // ============================================================
    // FILTER EMPLOYEES
    // ============================================================

    const availableEmployees =
        form.branch

            ? employees.filter(
                (employee) =>
                    getBranchId(employee) ===
                    String(form.branch)
            )

            : [];

    // ============================================================
    // BALANCE
    // ============================================================

    const totalAmount =
        Number(form.total_amount || 0);

    const advanceAmount =
        Number(form.advance_amount || 0);

    const balanceAmount =
        Math.max(
            totalAmount - advanceAmount,
            0
        );

    // ============================================================
    // SUBMIT
    // ============================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        // ========================================================
        // BRANCH VALIDATION
        // ========================================================

        if (!form.branch) {

            setError(
                "Branch is required."
            );

            return;
        }

        // ========================================================
        // CUSTOMER VALIDATION
        // ========================================================

        if (
            customerType === "existing" &&
            !form.customer
        ) {

            setError(
                "Please select an existing customer."
            );

            return;
        }

        if (!form.customer_name.trim()) {

            setError(
                "Customer name is required."
            );

            return;
        }

        if (!form.phone.trim()) {

            setError(
                "Phone number is required."
            );

            return;
        }

        // ========================================================
        // EXPECTED DELIVERY
        // ========================================================

        if (!form.expected_delivery_date) {

            setError(
                "Expected delivery date is required."
            );

            return;
        }

        if (!form.expected_delivery_time) {

            setError(
                "Expected delivery time is required."
            );

            return;
        }

        // ========================================================
        // PRODUCT / ITEM
        // ========================================================

        if (
            !form.product &&
            !form.item_name.trim()
        ) {

            setError(
                "Select a product or enter an outside/customer item."
            );

            return;
        }

        // ========================================================
        // TOTAL AMOUNT
        // ========================================================

        if (
            form.total_amount === "" ||
            Number(form.total_amount) < 0
        ) {

            setError(
                "Enter a valid total amount."
            );

            return;
        }

        // ========================================================
        // ADVANCE
        // ========================================================

        if (
            form.advance_amount !== "" &&
            Number(form.advance_amount) < 0
        ) {

            setError(
                "Advance amount cannot be negative."
            );

            return;
        }

        if (
            Number(form.advance_amount || 0) >
            Number(form.total_amount || 0)
        ) {

            setError(
                "Advance amount cannot be greater than total amount."
            );

            return;
        }

        // ========================================================
        // START SAVE
        // ========================================================

        setLoading(true);

        try {

            const payload = {

                // ------------------------------------------------
                // Branch
                // ------------------------------------------------

                branch:
                    form.branch,

                // ------------------------------------------------
                // Customer
                // ------------------------------------------------

                customer:
                    customerType === "existing"
                        ? form.customer
                        : null,

                customer_name:
                    form.customer_name.trim(),

                phone:
                    form.phone.trim(),

                // ------------------------------------------------
                // Dates
                // ------------------------------------------------

                alteration_date:
                    form.alteration_date,

                expected_delivery_date:
                    form.expected_delivery_date,

                expected_delivery_time:
                    form.expected_delivery_time,

                // ------------------------------------------------
                // Product
                // ------------------------------------------------

                product:
                    form.product || null,

                item_name:
                    form.item_name.trim(),

                // ------------------------------------------------
                // Details
                // ------------------------------------------------

                custom_size:
                    form.custom_size,

                notes:
                    form.notes,

                // ------------------------------------------------
                // Amount
                // ------------------------------------------------

                total_amount:
                    Number(form.total_amount || 0),

                advance_amount:
                    Number(form.advance_amount || 0),

                advance_payment_mode:
                    form.advance_payment_mode,

                // ------------------------------------------------
                // Employee
                // ------------------------------------------------

                assigned_employee:
                    form.assigned_employee || null,
            };

            console.log(
                "ALTERATION PAYLOAD:",
                payload
            );

            await api.post(
                "alterations/",
                payload
            );

            navigate(
                "/alterations"
            );

        } catch (err) {

            console.error(
                "Alteration save error:",
                err
            );

            const data =
                err.response?.data;

            if (data) {

                if (
                    typeof data === "object"
                ) {

                    const messages = [];

                    Object.entries(
                        data
                    ).forEach(
                        ([field, value]) => {

                            if (
                                Array.isArray(value)
                            ) {

                                messages.push(
                                    `${field}: ${value.join(", ")}`
                                );

                            } else {

                                messages.push(
                                    `${field}: ${value}`
                                );
                            }
                        }
                    );

                    setError(
                        messages.join(" | ") ||
                        "Unable to save alteration."
                    );

                } else {

                    setError(
                        String(data)
                    );
                }

            } else {

                setError(
                    "Unable to save alteration."
                );
            }

        } finally {

            setLoading(false);
        }
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loadingData) {

        return (

            <div className="container-fluid py-5">

                <div className="text-center">

                    <div
                        className="spinner-border text-primary"
                        role="status"
                    />

                    <div className="mt-3 text-muted">

                        Loading alteration form...

                    </div>

                </div>

            </div>
        );
    }

    // ============================================================
    // UI
    // ============================================================

    return (

        <div className="container-fluid py-4">

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">

                        Create Alteration

                    </h2>

                    <p className="text-muted mb-0">

                        Create a new alteration job

                    </p>

                </div>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                        navigate("/alterations")
                    }
                >

                    ← Back

                </button>

            </div>

            {/* ====================================================
                ERROR
            ==================================================== */}

            {error && (

                <div
                    className="alert alert-danger"
                    role="alert"
                >

                    {error}

                </div>

            )}

            <form
                onSubmit={handleSubmit}
            >

                {/* =================================================
                    CUSTOMER DETAILS
                ================================================= */}

                <div className="card shadow-sm mb-4">

                    <div className="card-header">

                        <h5 className="mb-0">

                            Customer Details

                        </h5>

                    </div>

                    <div className="card-body">

                        <div className="row g-3">

                            {/* =====================================
                                BRANCH
                            ====================================== */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">

                                    Branch
                                    <span className="text-danger">
                                        *
                                    </span>

                                </label>

                                <select
                                    name="branch"
                                    value={form.branch}
                                    onChange={handleBranchChange}
                                    className="form-select"
                                    disabled={isBranchUser}
                                    required
                                >

                                    <option value="">

                                        Select Branch

                                    </option>

                                    {branches.map(
                                        (branch) => (

                                            <option
                                                key={branch.id}
                                                value={branch.id}
                                            >

                                                {branch.name}

                                            </option>

                                        )
                                    )}

                                </select>

                                {isBranchUser && (

                                    <small className="text-muted">

                                        Branch is automatically selected
                                        from your account.

                                    </small>

                                )}

                            </div>

                            {/* =====================================
                                CUSTOMER TYPE
                            ====================================== */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">

                                    Customer Type
                                    <span className="text-danger">
                                        *
                                    </span>

                                </label>

                                <select
                                    className="form-select"
                                    value={customerType}
                                    onChange={
                                        handleCustomerTypeChange
                                    }
                                >

                                    <option value="existing">

                                        Existing Customer

                                    </option>

                                    <option value="walkin">

                                        Walk-in Customer

                                    </option>

                                </select>

                            </div>

                            {/* =====================================
                                EXISTING CUSTOMER
                            ====================================== */}

                            {customerType === "existing" && (

                                <div className="col-12">

                                    <label className="form-label fw-semibold">

                                        Select Customer
                                        <span className="text-danger">
                                            *
                                        </span>

                                    </label>

                                    <select
                                        className="form-select"
                                        value={form.customer}
                                        onChange={
                                            handleCustomerChange
                                        }
                                        required
                                    >

                                        <option value="">

                                            Select Existing Customer

                                        </option>

                                        {availableCustomers.map(
                                            (customer) => (

                                                <option
                                                    key={customer.id}
                                                    value={customer.id}
                                                >

                                                    {customer.name}

                                                    {" — "}

                                                    {
                                                        customer.mobile ||
                                                        customer.phone ||
                                                        ""
                                                    }

                                                </option>

                                            )
                                        )}

                                    </select>

                                    {form.branch &&
                                        availableCustomers.length === 0 && (

                                            <small className="text-muted">

                                                No customers found
                                                for this branch.

                                            </small>

                                        )}

                                </div>

                            )}

                            {/* =====================================
                                WALK-IN CUSTOMER
                            ====================================== */}

                            {customerType === "walkin" && (

                                <>

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">

                                            Customer Name
                                            <span className="text-danger">
                                                *
                                            </span>

                                        </label>

                                        <input
                                            type="text"
                                            name="customer_name"
                                            value={
                                                form.customer_name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            className="form-control"
                                            placeholder="Customer Name"
                                            required
                                        />

                                    </div>

                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">

                                            Phone
                                            <span className="text-danger">
                                                *
                                            </span>

                                        </label>

                                        <input
                                            type="text"
                                            name="phone"
                                            value={
                                                form.phone
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            className="form-control"
                                            placeholder="Phone Number"
                                            required
                                        />

                                    </div>

                                </>

                            )}

                            {/* =====================================
                                EXISTING CUSTOMER DETAILS
                            ====================================== */}

                            {customerType === "existing" &&
                                form.customer && (

                                    <>

                                        <div className="col-md-6">

                                            <label className="form-label fw-semibold">

                                                Customer Name

                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                value={
                                                    form.customer_name
                                                }
                                                readOnly
                                            />

                                        </div>

                                        <div className="col-md-6">

                                            <label className="form-label fw-semibold">

                                                Phone

                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                value={
                                                    form.phone
                                                }
                                                readOnly
                                            />

                                        </div>

                                    </>

                                )}

                        </div>

                    </div>

                </div>

                {/* =================================================
                    ALTERATION DETAILS
                ================================================= */}

                <div className="card shadow-sm mb-4">

                    <div className="card-header">

                        <h5 className="mb-0">

                            Alteration Details

                        </h5>

                    </div>

                    <div className="card-body">

                        <div className="row g-3">

                            {/* =====================================
                                ALTERATION DATE
                            ====================================== */}

                            <div className="col-md-4">

                                <label className="form-label fw-semibold">

                                    Alteration Date

                                </label>

                                <input
                                    type="date"
                                    name="alteration_date"
                                    value={
                                        form.alteration_date
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="form-control"
                                />

                            </div>

                            {/* =====================================
                                EXPECTED DELIVERY DATE
                            ====================================== */}

                            <div className="col-md-4">

                                <label className="form-label fw-semibold">

                                    Expected Delivery Date
                                    <span className="text-danger">
                                        *
                                    </span>

                                </label>

                                <input
                                    type="date"
                                    name="expected_delivery_date"
                                    value={
                                        form.expected_delivery_date
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="form-control"
                                    required
                                />

                            </div>

                            {/* =====================================
                                EXPECTED DELIVERY TIME
                            ====================================== */}

                            <div className="col-md-4">

                                <label className="form-label fw-semibold">

                                    Expected Delivery Time
                                    <span className="text-danger">
                                        *
                                    </span>

                                </label>

                                <input
                                    type="time"
                                    name="expected_delivery_time"
                                    value={
                                        form.expected_delivery_time
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="form-control"
                                    required
                                />

                            </div>

                            {/* =====================================
                                PRODUCT
                            ====================================== */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">

                                    Product

                                </label>

                                <select
                                    name="product"
                                    value={
                                        form.product
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="form-select"
                                >

                                    <option value="">

                                        Other Item

                                    </option>

                                    {products.map(
                                        (product) => (

                                            <option
                                                key={product.id}
                                                value={product.id}
                                            >

                                                {product.name}

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                            {/* =====================================
                                OTHER ITEM
                            ====================================== */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">

                                    Other Item

                                </label>

                                <input
                                    type="text"
                                    name="item_name"
                                    value={
                                        form.item_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="form-control"
                                    placeholder="Example: Shirt, Pant"
                                />

                            </div>

                            {/* =====================================
                                EMPLOYEE
                            ====================================== */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">

                                    Assigned Employee

                                </label>

                                <select
                                    name="assigned_employee"
                                    value={
                                        form.assigned_employee
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="form-select"
                                >

                                    <option value="">

                                        Unassigned

                                    </option>

                                    {availableEmployees.map(
                                        (employee) => (

                                            <option
                                                key={employee.id}
                                                value={employee.id}
                                            >

                                                {employee.name}

                                                {employee.designation
                                                    ? ` — ${employee.designation}`
                                                    : ""}

                                            </option>

                                        )
                                    )}

                                </select>

                                <small className="text-muted">

                                    Only employees from the
                                    selected branch are shown.

                                </small>

                            </div>

                            {/* =====================================
                                CUSTOM SIZE
                            ====================================== */}

                            <div className="col-12">

                                <label className="form-label fw-semibold">

                                    Custom Size / Measurements

                                </label>

                                <textarea
                                    name="custom_size"
                                    value={
                                        form.custom_size
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="form-control"
                                    rows="3"
                                    placeholder="Enter alteration size/details"
                                />

                            </div>

                            {/* =====================================
                                NOTES
                            ====================================== */}

                            <div className="col-12">

                                <label className="form-label fw-semibold">

                                    Notes

                                </label>

                                <textarea
                                    name="notes"
                                    value={
                                        form.notes
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="form-control"
                                    rows="3"
                                    placeholder="Additional notes"
                                />

                            </div>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    PAYMENT
                ================================================= */}

                <div className="card shadow-sm mb-4">

                    <div className="card-header">

                        <h5 className="mb-0">

                            Payment Details

                        </h5>

                    </div>

                    <div className="card-body">

                        <div className="row g-3">

                            {/* =====================================
                                TOTAL
                            ====================================== */}

                            <div className="col-md-4">

                                <label className="form-label fw-semibold">

                                    Total Amount
                                    <span className="text-danger">
                                        *
                                    </span>

                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="total_amount"
                                    value={
                                        form.total_amount
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="form-control"
                                    placeholder="0.00"
                                    required
                                />

                            </div>

                            {/* =====================================
                                ADVANCE
                            ====================================== */}

                            <div className="col-md-4">

                                <label className="form-label fw-semibold">

                                    Advance Amount

                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="advance_amount"
                                    value={
                                        form.advance_amount
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="form-control"
                                    placeholder="0.00"
                                />

                            </div>

                            {/* =====================================
                                PAYMENT MODE
                            ====================================== */}

                            <div className="col-md-4">

                                <label className="form-label fw-semibold">

                                    Advance Payment Mode

                                </label>

                                <select
                                    name="advance_payment_mode"
                                    value={
                                        form.advance_payment_mode
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="form-select"
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

                            {/* =====================================
                                BALANCE
                            ====================================== */}

                            <div className="col-12">

                                <div className="alert alert-light border mb-0">

                                    <div className="row">

                                        <div className="col-md-4">

                                            <strong>
                                                Total:
                                            </strong>

                                            <br />

                                            ₹
                                            {totalAmount.toFixed(2)}

                                        </div>

                                        <div className="col-md-4">

                                            <strong>
                                                Advance:
                                            </strong>

                                            <br />

                                            ₹
                                            {advanceAmount.toFixed(2)}

                                        </div>

                                        <div className="col-md-4">

                                            <strong>
                                                Balance:
                                            </strong>

                                            <br />

                                            ₹
                                            {balanceAmount.toFixed(2)}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    BUTTONS
                ================================================= */}

                <div className="d-flex justify-content-end gap-2 mb-4">

                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={() =>
                            navigate("/alterations")
                        }
                        disabled={loading}
                    >

                        Cancel

                    </button>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >

                        {loading
                            ? "Saving..."
                            : "Save Alteration"}

                    </button>

                </div>

            </form>

        </div>
    );
}

export default AlterationCreate;