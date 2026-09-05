import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function AlterationEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);

    const [form, setForm] = useState({
        branch: "",
        customer_name: "",
        phone: "",
        alteration_date: "",
        product: "",
        item_name: "",
        custom_size: "",
        notes: "",
        advance_amount: "",
        advance_payment_mode: "Cash",
        assigned_employee: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // ========================================================
    // LOAD ALTERATION + FORM DATA
    // ========================================================

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [
                alterationRes,
                branchRes,
                employeeRes,
                productRes,
            ] = await Promise.all([
                api.get(`alterations/${id}/`),
                api.get("branches/"),
                api.get("employees/"),
                api.get("products/"),
            ]);

            const alteration = alterationRes.data;

            setBranches(
                branchRes.data.results ||
                branchRes.data
            );

            setEmployees(
                employeeRes.data.results ||
                employeeRes.data
            );

            setProducts(
                productRes.data.results ||
                productRes.data
            );

            setForm({
                branch: alteration.branch || "",
                customer_name:
                    alteration.customer_name || "",
                phone:
                    alteration.phone || "",
                alteration_date:
                    alteration.alteration_date || "",
                product:
                    alteration.product || "",
                item_name:
                    alteration.item_name || "",
                custom_size:
                    alteration.custom_size || "",
                notes:
                    alteration.notes || "",
                advance_amount:
                    alteration.advance_amount || "",
                advance_payment_mode:
                    alteration.advance_payment_mode ||
                    "Cash",
                assigned_employee:
                    alteration.assigned_employee || "",
            });

        } catch (err) {

            console.error(
                "Failed to load alteration:",
                err
            );

            setError(
                "Unable to load alteration."
            );

        } finally {

            setLoading(false);
        }
    };

    // ========================================================
    // INPUT CHANGE
    // ========================================================

    const handleChange = (e) => {

        const {
            name,
            value,
        } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ========================================================
    // BRANCH CHANGE
    // ========================================================

    const handleBranchChange = (e) => {

        const branchId =
            e.target.value;

        setForm((previous) => ({
            ...previous,
            branch: branchId,
            assigned_employee: "",
        }));
    };

    // ========================================================
    // SUBMIT
    // ========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

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

        if (
            !form.product &&
            !form.item_name.trim()
        ) {
            setError(
                "Select a product or enter an outside/customer item."
            );
            return;
        }

        setSaving(true);

        try {

            const payload = {
                branch:
                    form.branch || null,

                customer_name:
                    form.customer_name,

                phone:
                    form.phone,

                alteration_date:
                    form.alteration_date,

                product:
                    form.product || null,

                item_name:
                    form.item_name,

                custom_size:
                    form.custom_size,

                notes:
                    form.notes,

                advance_amount:
                    form.advance_amount || 0,

                advance_payment_mode:
                    form.advance_payment_mode,

                assigned_employee:
                    form.assigned_employee ||
                    null,
            };

            await api.put(
                `alterations/${id}/`,
                payload
            );

            navigate("/alterations");

        } catch (err) {

            console.error(
                "Failed to update alteration:",
                err
            );

            const data =
                err.response?.data;

            if (data && typeof data === "object") {

                const firstError =
                    Object.values(data)[0];

                setError(
                    Array.isArray(firstError)
                        ? firstError[0]
                        : String(firstError)
                );

            } else {

                setError(
                    "Unable to update alteration."
                );
            }

        } finally {

            setSaving(false);
        }
    };

    // ========================================================
    // FILTER EMPLOYEES
    // ========================================================

    const availableEmployees =
        form.branch
            ? employees.filter(
                (employee) =>
                    String(employee.branch) ===
                    String(form.branch)
            )
            : employees;

    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (
            <div className="container-fluid py-5">

                <div className="text-center">

                    <div
                        className="spinner-border"
                        role="status"
                    ></div>

                    <p className="text-muted mt-3">
                        Loading alteration...
                    </p>

                </div>

            </div>
        );
    }

    // ========================================================
    // UI
    // ========================================================

    return (
        <div className="container-fluid py-4">

            <div className="card border-0 shadow-sm rounded-4">

                <div className="card-body p-4">

                    {/* HEADER */}

                    <div className="mb-4">

                        <h2 className="fw-bold mb-1">

                            <i className="bi bi-rulers me-2"></i>

                            Edit Alteration

                        </h2>

                        <p className="text-muted mb-0">

                            Update customer alteration details,
                            measurements, employee assignment
                            and advance payment.

                        </p>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="alert alert-danger">

                            {error}

                        </div>

                    )}


                    <form onSubmit={handleSubmit}>

                        <div className="row g-3">

                            {/* ==================================================
                                BRANCH
                            ================================================== */}

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">

                                    Branch

                                </label>

                                <select
                                    name="branch"
                                    value={form.branch}
                                    onChange={
                                        handleBranchChange
                                    }
                                    className="form-select"
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

                                                {" — "}

                                                {
                                                    employee.designation
                                                }

                                            </option>

                                        )
                                    )}

                                </select>

                                <small className="text-muted">

                                    Select the employee responsible
                                    for this alteration.

                                </small>

                            </div>


                            {/* ==================================================
                                CUSTOMER
                            ================================================== */}

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


                            {/* ==================================================
                                PHONE
                            ================================================== */}

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


                            {/* ==================================================
                                DATE
                            ================================================== */}

                            <div className="col-md-6">

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
                                ADVANCE
                            ================================================== */}

                            <div className="col-md-6">

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

                            <div className="col-md-6">

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
                            >

                                Cancel

                            </button>


                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >

                                {saving ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                        ></span>

                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-lg me-2"></i>

                                        Update Alteration
                                    </>
                                )}

                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default AlterationEdit;