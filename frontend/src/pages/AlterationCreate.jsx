import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AlterationCreate() {
    const navigate = useNavigate();

    // ========================================================
    // USER
    // ========================================================

    const storedUser = useMemo(() => {
        try {
            return JSON.parse(
                localStorage.getItem("user") || "{}"
            );
        } catch {
            return {};
        }
    }, []);

    const isAdmin =
        storedUser.role === "Admin" ||
        storedUser.is_superuser === true;

    const isBranchUser =
        storedUser.role === "Branch";

    /*
     * Depending on your login response, branch may be stored as:
     *
     * user.branch_id
     * user.branch
     * user.branch.id
     *
     * We support all three.
     */
    const loggedInBranchId =
        storedUser.branch_id ||
        (
            typeof storedUser.branch === "object"
                ? storedUser.branch?.id
                : storedUser.branch
        ) ||
        "";

    // ========================================================
    // DATA
    // ========================================================

    const [branches, setBranches] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);

    // ========================================================
    // CUSTOMER TYPE
    // ========================================================

    const [customerType, setCustomerType] =
        useState("existing");

    // ========================================================
    // FORM
    // ========================================================

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

    // ========================================================
    // STATE
    // ========================================================

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");

    // ========================================================
    // LOAD DATA
    // ========================================================

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoadingData(true);
        setError("");

        try {
            const requests = [
                api.get("branches/"),
                api.get("customers/"),
                api.get("employees/"),
                api.get("products/"),
            ];

            const [
                branchRes,
                customerRes,
                employeeRes,
                productRes,
            ] = await Promise.all(requests);

            const branchData =
                branchRes.data?.results ||
                branchRes.data ||
                [];

            const customerData =
                customerRes.data?.results ||
                customerRes.data ||
                [];

            const employeeData =
                employeeRes.data?.results ||
                employeeRes.data ||
                [];

            const productData =
                productRes.data?.results ||
                productRes.data ||
                [];

            setBranches(
                Array.isArray(branchData)
                    ? branchData
                    : []
            );

            setCustomers(
                Array.isArray(customerData)
                    ? customerData
                    : []
            );

            setEmployees(
                Array.isArray(employeeData)
                    ? employeeData
                    : []
            );

            setProducts(
                Array.isArray(productData)
                    ? productData
                    : []
            );
        } catch (err) {
            console.error(
                "Alteration form load error:",
                err
            );

            setError(
                "Unable to load alteration form data."
            );
        } finally {
            setLoadingData(false);
        }
    };

    // ========================================================
    // AUTO SELECT BRANCH
    // ========================================================

    useEffect(() => {
        if (!isBranchUser) {
            return;
        }

        /*
         * If branch ID is available in login user data,
         * automatically select it.
         */
        if (loggedInBranchId) {
            setForm((prev) => ({
                ...prev,
                branch: String(loggedInBranchId),
            }));

            return;
        }

        /*
         * Fallback:
         *
         * Branch APIs in this project may already return only
         * the user's branch. If exactly one branch is returned,
         * use it automatically.
         */
        if (branches.length === 1) {
            setForm((prev) => ({
                ...prev,
                branch: String(branches[0].id),
            }));
        }
    }, [
        isBranchUser,
        loggedInBranchId,
        branches,
    ]);

    // ========================================================
    // INPUT CHANGE
    // ========================================================

    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ========================================================
    // CUSTOMER TYPE CHANGE
    // ========================================================

    const handleCustomerTypeChange = (e) => {
        const type = e.target.value;

        setCustomerType(type);

        setForm((prev) => ({
            ...prev,

            customer: "",
            customer_name: "",
            phone: "",
        }));
    };

    // ========================================================
    // EXISTING CUSTOMER CHANGE
    // ========================================================

    const handleCustomerChange = (e) => {
        const customerId = e.target.value;

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

            customer: customerId,

            customer_name:
                selectedCustomer.name || "",

            phone:
                selectedCustomer.mobile ||
                selectedCustomer.phone ||
                "",
        }));
    };

    // ========================================================
    // BRANCH CHANGE
    // ========================================================

    const handleBranchChange = (e) => {
        /*
         * Branch user should never reach this function because
         * their branch selector is hidden.
         */
        if (isBranchUser) {
            return;
        }

        const branchId = e.target.value;

        setForm((prev) => ({
            ...prev,

            branch: branchId,

            assigned_employee: "",

            customer: "",
            customer_name: "",
            phone: "",
        }));
    };

    // ========================================================
    // FILTER EMPLOYEES
    // ========================================================

    const availableEmployees = useMemo(() => {
        if (!form.branch) {
            return [];
        }

        return employees.filter(
            (employee) =>
                String(employee.branch) ===
                String(form.branch)
        );
    }, [
        employees,
        form.branch,
    ]);

    // ========================================================
    // FILTER CUSTOMERS
    // ========================================================

    const availableCustomers = useMemo(() => {
        if (!form.branch) {
            return [];
        }

        return customers.filter(
            (customer) =>
                String(customer.branch) ===
                String(form.branch)
        );
    }, [
        customers,
        form.branch,
    ]);

    // ========================================================
    // VALIDATE AMOUNTS
    // ========================================================

    const validateAmounts = () => {
        const total =
            parseFloat(form.total_amount || 0);

        const advance =
            parseFloat(form.advance_amount || 0);

        if (total < 0) {
            setError(
                "Total amount cannot be negative."
            );

            return false;
        }

        if (advance < 0) {
            setError(
                "Advance amount cannot be negative."
            );

            return false;
        }

        if (advance > total) {
            setError(
                "Advance cannot be greater than total amount."
            );

            return false;
        }

        return true;
    };

    // ========================================================
    // SUBMIT
    // ========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        // ----------------------------------------------------
        // BRANCH VALIDATION
        // ----------------------------------------------------

        if (!isAdmin && !form.branch) {
            setError(
                "Your branch could not be determined. Please contact the administrator."
            );

            return;
        }

        if (isAdmin && !form.branch) {
            setError(
                "Please select a branch."
            );

            return;
        }

        // ----------------------------------------------------
        // CUSTOMER VALIDATION
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // EXISTING CUSTOMER VALIDATION
        // ----------------------------------------------------

        if (
            customerType === "existing" &&
            !form.customer
        ) {
            setError(
                "Please select an existing customer."
            );

            return;
        }

        // ----------------------------------------------------
        // PRODUCT / ITEM VALIDATION
        // ----------------------------------------------------

        if (
            !form.product &&
            !form.item_name.trim()
        ) {
            setError(
                "Select a product or enter an outside/customer item."
            );

            return;
        }

        // ----------------------------------------------------
        // TOTAL AMOUNT
        // ----------------------------------------------------

        if (
            form.total_amount === "" ||
            form.total_amount === null
        ) {
            setError(
                "Total amount is required."
            );

            return;
        }

        if (!validateAmounts()) {
            return;
        }

        setLoading(true);

        try {
            /*
             * For branch users, send their selected automatic
             * branch. Backend will still force request.user.branch.
             *
             * For Admin, send selected branch.
             */

            const payload = {
                branch: form.branch || null,

                // --------------------------------------------
                // CUSTOMER
                // --------------------------------------------

                customer_name:
                    form.customer_name.trim(),

                phone:
                    form.phone.trim(),

                // --------------------------------------------
                // DATE
                // --------------------------------------------

                alteration_date:
                    form.alteration_date,

                // --------------------------------------------
                // EXPECTED DELIVERY
                // --------------------------------------------

                expected_delivery_date:
                    form.expected_delivery_date ||
                    null,

                expected_delivery_time:
                    form.expected_delivery_time ||
                    null,

                // --------------------------------------------
                // PRODUCT
                // --------------------------------------------

                product:
                    form.product || null,

                item_name:
                    form.item_name.trim(),

                // --------------------------------------------
                // ALTERATION
                // --------------------------------------------

                custom_size:
                    form.custom_size,

                notes:
                    form.notes,

                // --------------------------------------------
                // AMOUNTS
                // --------------------------------------------

                total_amount:
                    form.total_amount || 0,

                advance_amount:
                    form.advance_amount || 0,

                advance_payment_mode:
                    form.advance_payment_mode,

                // --------------------------------------------
                // EMPLOYEE
                // --------------------------------------------

                assigned_employee:
                    form.assigned_employee || null,
            };

            console.log(
                "Creating alteration:",
                payload
            );

            await api.post(
                "alterations/",
                payload
            );

            navigate("/alterations");
        } catch (err) {
            console.error(
                "Alteration create error:",
                err
            );

            const data =
                err.response?.data;

            if (data) {
                if (
                    typeof data === "object"
                ) {
                    const firstError =
                        Object.values(data)[0];

                    if (
                        Array.isArray(firstError)
                    ) {
                        setError(
                            String(firstError[0])
                        );
                    } else if (
                        typeof firstError ===
                        "object"
                    ) {
                        setError(
                            JSON.stringify(
                                firstError
                            )
                        );
                    } else {
                        setError(
                            String(firstError)
                        );
                    }
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

    // ========================================================
    // CALCULATE BALANCE
    // ========================================================

    const totalAmount =
        parseFloat(
            form.total_amount || 0
        );

    const advanceAmount =
        parseFloat(
            form.advance_amount || 0
        );

    const balanceAmount =
        Math.max(
            totalAmount - advanceAmount,
            0
        );

    // ========================================================
    // UI
    // ========================================================

    return (
        <div className="container-fluid py-4">

            <div className="card shadow-sm border-0 rounded-4">

                <div className="card-body p-4">

                    {/* ==================================================
                        HEADER
                    ================================================== */}

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <div>

                            <h2 className="fw-bold mb-1">
                                Add Alteration
                            </h2>

                            <p className="text-muted mb-0">
                                Record customer alteration
                                details, measurements,
                                delivery and payment.
                            </p>

                        </div>

                    </div>

                    {/* ==================================================
                        LOADING
                    ================================================== */}

                    {loadingData && (
                        <div className="alert alert-info">
                            Loading alteration form...
                        </div>
                    )}

                    {/* ==================================================
                        ERROR
                    ================================================== */}

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                    >

                        <div className="row g-3">

                            {/* ==================================================
                                BRANCH
                            ================================================== */}

                            {isAdmin ? (
                                <div className="col-md-6">

                                    <label className="form-label fw-semibold">
                                        Branch *
                                    </label>

                                    <select
                                        name="branch"
                                        value={form.branch}
                                        onChange={
                                            handleBranchChange
                                        }
                                        className="form-select"
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
                                                    {
                                                        branch.name
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>
                            ) : (
                                <div className="col-md-6">

                                    <label className="form-label fw-semibold">
                                        Branch
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={
                                            branches.find(
                                                (branch) =>
                                                    String(
                                                        branch.id
                                                    ) ===
                                                    String(
                                                        form.branch
                                                    )
                                            )?.name ||
                                            (
                                                form.branch
                                                    ? `Branch #${form.branch}`
                                                    : "Loading branch..."
                                            )
                                        }
                                        readOnly
                                    />

                                    <small className="text-muted">
                                        Branch is automatically
                                        selected from your
                                        account.
                                    </small>

                                </div>
                            )}

                            {/* ==================================================
                                CUSTOMER TYPE
                            ================================================== */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Customer Type *
                                </label>

                                <select
                                    className="form-select"
                                    value={
                                        customerType
                                    }
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

                            {/* ==================================================
                                EXISTING CUSTOMER
                            ================================================== */}

                            {customerType ===
                                "existing" && (
                                <div className="col-12">

                                    <label className="form-label fw-semibold">
                                        Select Customer *
                                    </label>

                                    <select
                                        className="form-select"
                                        value={
                                            form.customer
                                        }
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
                                                    key={
                                                        customer.id
                                                    }
                                                    value={
                                                        customer.id
                                                    }
                                                >
                                                    {
                                                        customer.name
                                                    }
                                                    {" — "}
                                                    {
                                                        customer.mobile ||
                                                        customer.phone
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                    {form.branch &&
                                        availableCustomers.length ===
                                            0 && (
                                            <small className="text-danger">
                                                No customers found
                                                for this branch.
                                            </small>
                                        )}

                                </div>
                            )}

                            {/* ==================================================
                                WALK-IN CUSTOMER
                            ================================================== */}

                            {customerType ===
                                "walkin" && (
                                <>
                                    <div className="col-md-6">

                                        <label className="form-label fw-semibold">
                                            Customer Name *
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
                                            Phone *
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

                            {/* ==================================================
                                EXISTING CUSTOMER DETAILS
                            ================================================== */}

                            {customerType ===
                                "existing" &&
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

                            {/* ==================================================
                                EMPLOYEE
                            ================================================== */}

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
                                                key={
                                                    employee.id
                                                }
                                                value={
                                                    employee.id
                                                }
                                            >
                                                {
                                                    employee.name
                                                }
                                                {employee.designation
                                                    ? ` — ${employee.designation}`
                                                    : ""}
                                            </option>
                                        )
                                    )}

                                </select>

                                <small className="text-muted">
                                    Optional. Only employees
                                    from the selected branch
                                    are shown.
                                </small>

                            </div>

                            {/* ==================================================
                                ALTERATION DATE
                            ================================================== */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Alteration Date *
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
                                    required
                                />

                            </div>

                            {/* ==================================================
                                EXPECTED DELIVERY DATE
                            ================================================== */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Expected Delivery Date
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
                                />

                            </div>

                            {/* ==================================================
                                EXPECTED DELIVERY TIME
                            ================================================== */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Expected Delivery Time
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
                                />

                            </div>

                            {/* ==================================================
                                PRODUCT
                            ================================================== */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Our Product
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
                                        Select Product
                                    </option>

                                    {products.map(
                                        (product) => (
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

                            </div>

                            {/* ==================================================
                                OUTSIDE ITEM
                            ================================================== */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Outside / Customer Item
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
                                    placeholder="e.g. Shirt, Pant"
                                />

                            </div>

                            {/* ==================================================
                                CUSTOM SIZE
                            ================================================== */}

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
                                    placeholder="Enter alteration measurements..."
                                />

                            </div>

                            {/* ==================================================
                                NOTES
                            ================================================== */}

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
                                    placeholder="Additional notes..."
                                />

                            </div>

                            {/* ==================================================
                                TOTAL AMOUNT
                            ================================================== */}

                            <div className="col-md-4">

                                <label className="form-label fw-semibold">
                                    Total Amount *
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

                            {/* ==================================================
                                ADVANCE
                            ================================================== */}

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

                            {/* ==================================================
                                PAYMENT MODE
                            ================================================== */}

                            <div className="col-md-4">

                                <label className="form-label fw-semibold">
                                    Payment Mode
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

                            {/* ==================================================
                                BALANCE PREVIEW
                            ================================================== */}

                            <div className="col-12">

                                <div className="border rounded-3 p-3 bg-light">

                                    <div className="row">

                                        <div className="col-md-4">

                                            <small className="text-muted d-block">
                                                Total Amount
                                            </small>

                                            <strong>
                                                ₹{" "}
                                                {totalAmount.toFixed(
                                                    2
                                                )}
                                            </strong>

                                        </div>

                                        <div className="col-md-4">

                                            <small className="text-muted d-block">
                                                Advance
                                            </small>

                                            <strong>
                                                ₹{" "}
                                                {advanceAmount.toFixed(
                                                    2
                                                )}
                                            </strong>

                                        </div>

                                        <div className="col-md-4">

                                            <small className="text-muted d-block">
                                                Balance
                                            </small>

                                            <strong>
                                                ₹{" "}
                                                {balanceAmount.toFixed(
                                                    2
                                                )}
                                            </strong>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* ==================================================
                            BUTTONS
                        ================================================== */}

                        <div className="d-flex justify-content-end gap-2 mt-4">

                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={() =>
                                    navigate(
                                        "/alterations"
                                    )
                                }
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={
                                    loading ||
                                    loadingData
                                }
                            >
                                {loading
                                    ? "Saving..."
                                    : "Save Alteration"}
                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default AlterationCreate;