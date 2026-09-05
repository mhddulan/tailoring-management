import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Customers.css";

function Customers() {
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("customers/");

            const data = response.data;

            if (Array.isArray(data)) {
                setCustomers(data);
            } else if (Array.isArray(data.results)) {
                setCustomers(data.results);
            } else {
                setCustomers([]);
            }
        } catch (err) {
            console.error("Customer loading error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load customers."
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter((customer) => {
        const value = search.trim().toLowerCase();

        if (!value) return true;

        return (
            customer.name?.toLowerCase().includes(value) ||
            customer.mobile?.toLowerCase().includes(value)
        );
    });

    const money = (value) =>
        `SAR ${Number(value || 0).toFixed(2)}`;

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this customer?"
        );

        if (!confirmed) return;

        try {
            await api.delete(`customers/${id}/`);

            setCustomers((prev) =>
                prev.filter((customer) => customer.id !== id)
            );
        } catch (err) {
            console.error("Delete customer error:", err);

            alert(
                err.response?.data?.detail ||
                "Unable to delete customer."
            );
        }
    };

    return (
        <div className="customers-page">

            {/* HEADER */}

            <div className="page-header-block">

                <div>
                    <h2 className="page-header-title">
                        Customer Directory
                    </h2>

                    <p className="page-header-sub">
                        View, search, and manage customer profiles,
                        measurements, orders, and payments.
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => navigate("/customers/create")}
                >
                    <i className="bi bi-person-plus-fill me-1"></i>
                    Add Customer
                </button>

            </div>


            {/* ERROR */}

            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}

                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger ms-3"
                        onClick={loadCustomers}
                    >
                        Retry
                    </button>
                </div>
            )}


            {/* TABLE CARD */}

            <div className="table-card mb-4">

                {/* SEARCH */}

                <div className="table-card-header">

                    <form
                        className="customer-search-form"
                        onSubmit={(e) => e.preventDefault()}
                    >

                        <div className="customer-search-wrapper">

                            <div className="header-search">

                                <i className="bi bi-search"></i>

                                <input
                                    type="text"
                                    className="form-control"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search customer name or mobile number..."
                                />

                            </div>

                        </div>

                        <div className="customer-search-button">

                            <button
                                type="submit"
                                className="btn btn-secondary w-100"
                            >
                                <i className="bi bi-search me-1"></i>
                                Search
                            </button>

                        </div>

                    </form>

                </div>


                {/* TABLE */}

                <div className="table-responsive">

                    <table className="table app-table">

                        <thead>

                            <tr>
                                <th width="60">#</th>
                                <th>Customer</th>
                                <th>Mobile</th>
                                <th>Branch</th>
                                <th className="text-center">
                                    Orders
                                </th>
                                <th className="text-end">
                                    Total
                                </th>
                                <th className="text-end">
                                    Paid
                                </th>
                                <th className="text-end">
                                    Balance
                                </th>
                                <th
                                    width="150"
                                    className="text-end"
                                >
                                    Actions
                                </th>
                            </tr>

                        </thead>


                        <tbody>

                            {loading ? (

                                <tr>
                                    <td
                                        colSpan="9"
                                        className="text-center py-5"
                                    >

                                        <div
                                            className="spinner-border text-primary"
                                            role="status"
                                        ></div>

                                        <div className="text-muted mt-2">
                                            Loading customers...
                                        </div>

                                    </td>
                                </tr>

                            ) : filteredCustomers.length > 0 ? (

                                filteredCustomers.map(
                                    (customer, index) => {

                                        /*
                                         * Your CustomerSerializer
                                         * gives:
                                         * id
                                         * branch
                                         * branch_name
                                         * name
                                         * mobile
                                         * address
                                         * created_at
                                         *
                                         * Order totals may be added
                                         * by the API later.
                                         */

                                        const totalOrders =
                                            customer.total_orders ??
                                            0;

                                        const totalAmount =
                                            customer.total_amount ??
                                            0;

                                        const totalPaid =
                                            customer.total_paid ??
                                            0;

                                        const balance =
                                            customer.balance ??
                                            (
                                                Number(totalAmount) -
                                                Number(totalPaid)
                                            );

                                        return (

                                            <tr key={customer.id}>

                                                {/* # */}

                                                <td className="fw-semibold text-muted">
                                                    {index + 1}
                                                </td>


                                                {/* CUSTOMER */}

                                                <td>

                                                    <button
                                                        type="button"
                                                        className="customer-name-link"
                                                        onClick={() =>
                                                            navigate(
                                                                `/customers/${customer.id}`
                                                            )
                                                        }
                                                    >

                                                        <i className="bi bi-person-circle me-2"></i>

                                                        {customer.name}

                                                    </button>

                                                </td>


                                                {/* MOBILE */}

                                                <td>

                                                    <i className="bi bi-telephone text-muted me-1"></i>

                                                    {customer.mobile ||
                                                        "-"}

                                                </td>


                                                {/* BRANCH */}

                                                <td>

                                                    <span className="badge bg-light text-dark border">

                                                        <i className="bi bi-building me-1"></i>

                                                        {customer.branch_name ||
                                                            customer.branch ||
                                                            "-"}

                                                    </span>

                                                </td>


                                                {/* ORDERS */}

                                                <td className="text-center">

                                                    <span className="badge bg-primary-subtle text-primary border">

                                                        {totalOrders}

                                                    </span>

                                                </td>


                                                {/* TOTAL */}

                                                <td className="text-end fw-semibold">

                                                    {money(
                                                        totalAmount
                                                    )}

                                                </td>


                                                {/* PAID */}

                                                <td className="text-end fw-semibold text-success">

                                                    {money(
                                                        totalPaid
                                                    )}

                                                </td>


                                                {/* BALANCE */}

                                                <td className="text-end fw-bold">

                                                    {Number(balance) > 0 ? (

                                                        <span className="text-danger">
                                                            {money(balance)}
                                                        </span>

                                                    ) : (

                                                        <span className="text-success">
                                                            SAR 0.00
                                                        </span>

                                                    )}

                                                </td>


                                                {/* ACTIONS */}

                                                <td className="text-end">

                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary btn-icon-only me-1"
                                                        title="View Customer"
                                                        onClick={() =>
                                                            navigate(
                                                                `/customers/${customer.id}`
                                                            )
                                                        }
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-secondary btn-icon-only me-1"
                                                        title="Edit Customer"
                                                        onClick={() =>
                                                            navigate(
                                                                `/customers/${customer.id}/edit`
                                                            )
                                                        }
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger btn-icon-only"
                                                        title="Delete Customer"
                                                        onClick={() =>
                                                            handleDelete(
                                                                customer.id
                                                            )
                                                        }
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="9"
                                        className="text-center py-5 text-muted"
                                    >

                                        <i className="bi bi-people fs-1 d-block mb-2"></i>

                                        <strong>
                                            No customers found.
                                        </strong>

                                        {search ? (

                                            <div className="small mt-1">
                                                Try a different customer
                                                name or mobile number.
                                            </div>

                                        ) : (

                                            <div className="small mt-1">
                                                Click "Add Customer" to
                                                create your first customer.
                                            </div>

                                        )}

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default Customers;