import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AlterationCreate() {
    const navigate = useNavigate();

    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);

    const [form, setForm] = useState({
        branch: "",
        customer_name: "",
        phone: "",
        alteration_date: new Date().toISOString().split("T")[0],
        product: "",
        item_name: "",
        custom_size: "",
        notes: "",
        advance_amount: "",
        advance_payment_mode: "Cash",
        assigned_employee: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // --------------------------------------------------------
    // LOAD DATA
    // --------------------------------------------------------

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [branchRes, employeeRes, productRes] =
                await Promise.all([
                    api.get("branches/"),
                    api.get("employees/"),
                    api.get("products/"),
                ]);

            setBranches(
                branchRes.data.results || branchRes.data
            );

            setEmployees(
                employeeRes.data.results || employeeRes.data
            );

            setProducts(
                productRes.data.results || productRes.data
            );

        } catch (err) {
            console.error(err);
            setError("Unable to load form data.");
        }
    };

    // --------------------------------------------------------
    // INPUT
    // --------------------------------------------------------

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // --------------------------------------------------------
    // BRANCH CHANGE
    // --------------------------------------------------------

    const handleBranchChange = (e) => {

        const branchId = e.target.value;

        setForm((prev) => ({
            ...prev,
            branch: branchId,
            assigned_employee: "",
        }));

    };

    // --------------------------------------------------------
    // SUBMIT
    // --------------------------------------------------------

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!form.customer_name.trim()) {
            setError("Customer name is required.");
            return;
        }

        if (!form.phone.trim()) {
            setError("Phone number is required.");
            return;
        }

        if (!form.product && !form.item_name.trim()) {
            setError(
                "Select a product or enter an outside/customer item."
            );
            return;
        }

        setLoading(true);

        try {

            const payload = {
                branch: form.branch || null,

                customer_name: form.customer_name,
                phone: form.phone,

                alteration_date: form.alteration_date,

                product: form.product || null,

                item_name: form.item_name,

                custom_size: form.custom_size,

                notes: form.notes,

                advance_amount:
                    form.advance_amount || 0,

                advance_payment_mode:
                    form.advance_payment_mode,

                assigned_employee:
                    form.assigned_employee || null,
            };

            await api.post(
                "alterations/",
                payload
            );

            navigate("/alterations");

        } catch (err) {

            console.error(err);

            const data = err.response?.data;

            if (data) {

                if (typeof data === "object") {

                    const firstError =
                        Object.values(data)[0];

                    setError(
                        Array.isArray(firstError)
                            ? firstError[0]
                            : firstError
                    );

                } else {

                    setError("Unable to save alteration.");
                }

            } else {

                setError("Unable to save alteration.");
            }

        } finally {

            setLoading(false);
        }
    };

    // --------------------------------------------------------
    // FILTER EMPLOYEES BY SELECTED BRANCH
    // --------------------------------------------------------

    const availableEmployees = form.branch
        ? employees.filter(
            (employee) =>
                String(employee.branch) ===
                String(form.branch)
        )
        : employees;

    return (
        <div className="container-fluid py-4">

            <div className="card shadow-sm border-0 rounded-4">

                <div className="card-body p-4">

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <div>
                            <h2 className="fw-bold mb-1">
                                Add Alteration
                            </h2>

                            <p className="text-muted mb-0">
                                Record customer alteration details,
                                measurements and advance payment.
                            </p>
                        </div>

                    </div>

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="row g-3">

                            {/* BRANCH */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Branch
                                </label>

                                <select
                                    name="branch"
                                    value={form.branch}
                                    onChange={handleBranchChange}
                                    className="form-select"
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

                            {/* EMPLOYEE */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Assigned Employee
                                </label>

                                <select
                                    name="assigned_employee"
                                    value={form.assigned_employee}
                                    onChange={handleChange}
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
                                                {" — "}
                                                {employee.designation}
                                            </option>
                                        )
                                    )}

                                </select>

                                <small className="text-muted">
                                    Optional. Only employees from the
                                    selected branch should be assigned.
                                </small>

                            </div>

                            {/* CUSTOMER */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Customer Name *
                                </label>

                                <input
                                    type="text"
                                    name="customer_name"
                                    value={form.customer_name}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Customer Name"
                                    required
                                />

                            </div>

                            {/* PHONE */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Phone *
                                </label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Phone Number"
                                    required
                                />

                            </div>

                            {/* DATE */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Alteration Date
                                </label>

                                <input
                                    type="date"
                                    name="alteration_date"
                                    value={form.alteration_date}
                                    onChange={handleChange}
                                    className="form-control"
                                />

                            </div>

                            {/* PRODUCT */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Our Product
                                </label>

                                <select
                                    name="product"
                                    value={form.product}
                                    onChange={handleChange}
                                    className="form-select"
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

                            {/* OUTSIDE ITEM */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Outside / Customer Item
                                </label>

                                <input
                                    type="text"
                                    name="item_name"
                                    value={form.item_name}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="e.g. Shirt, Pant"
                                />

                            </div>

                            {/* CUSTOM SIZE */}

                            <div className="col-12">

                                <label className="form-label fw-semibold">
                                    Custom Size / Measurements
                                </label>

                                <textarea
                                    name="custom_size"
                                    value={form.custom_size}
                                    onChange={handleChange}
                                    className="form-control"
                                    rows="3"
                                    placeholder="Enter alteration measurements..."
                                />

                            </div>

                            {/* NOTES */}

                            <div className="col-12">

                                <label className="form-label fw-semibold">
                                    Notes
                                </label>

                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    className="form-control"
                                    rows="3"
                                    placeholder="Additional notes..."
                                />

                            </div>

                            {/* ADVANCE */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Advance Amount
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="advance_amount"
                                    value={form.advance_amount}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="0.00"
                                />

                            </div>

                            {/* PAYMENT MODE */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Payment Mode
                                </label>

                                <select
                                    name="advance_payment_mode"
                                    value={form.advance_payment_mode}
                                    onChange={handleChange}
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

                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-4">

                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={() =>
                                    navigate("/alterations")
                                }
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

            </div>

        </div>
    );
}

export default AlterationCreate;