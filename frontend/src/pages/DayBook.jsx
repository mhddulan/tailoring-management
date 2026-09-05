import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const BANK_MODES = ["Bank", "Online", "POS"];

const money = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const todayString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
};

const formatDate = (value) => {
    if (!value) return "-";

    const d = new Date(`${value}T00:00:00`);

    return d.toLocaleDateString("en-GB");
};

const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        return {};
    }
};

export default function DayBook() {
    const user = getUser();

    const [entries, setEntries] = useState([]);
    const [branches, setBranches] = useState([]);
    const [openingBalances, setOpeningBalances] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showOpeningModal, setShowOpeningModal] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [filters, setFilters] = useState({
        from_date: todayString(),
        to_date: todayString(),
        branch: "",
        transaction_type: "",
        payment_mode: "",
        category: "",
    });

    const [form, setForm] = useState({
        branch: "",
        date: todayString(),
        transaction_type: "Income",
        category: "",
        payment_mode: "Cash",
        description: "",
        amount: "",
    });

    const [openingForm, setOpeningForm] = useState({
        branch: "",
        opening_date: todayString(),
        opening_cash: "",
        opening_bank: "",
    });

    /* ======================================================
       LOAD DATA
    ====================================================== */

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [entriesRes, branchesRes, openingRes] =
                await Promise.all([
                    api.get("daybook/"),
                    api.get("branches/"),
                    api.get("opening-balances/"),
                ]);

            setEntries(Array.isArray(entriesRes.data)
                ? entriesRes.data
                : entriesRes.data.results || []);

            setBranches(Array.isArray(branchesRes.data)
                ? branchesRes.data
                : branchesRes.data.results || []);

            setOpeningBalances(
                Array.isArray(openingRes.data)
                    ? openingRes.data
                    : openingRes.data.results || []
            );
        } catch (err) {
            console.error(err);

            setError(
                err?.response?.data?.detail ||
                "Unable to load Day Book data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    /* ======================================================
       FILTER
    ====================================================== */

    const filteredEntries = useMemo(() => {
        return entries
            .filter((entry) => {
                if (
                    filters.from_date &&
                    entry.date < filters.from_date
                ) {
                    return false;
                }

                if (
                    filters.to_date &&
                    entry.date > filters.to_date
                ) {
                    return false;
                }

                if (
                    filters.branch &&
                    String(entry.branch) !== String(filters.branch)
                ) {
                    return false;
                }

                if (
                    filters.transaction_type &&
                    entry.transaction_type !==
                        filters.transaction_type
                ) {
                    return false;
                }

                if (
                    filters.payment_mode &&
                    entry.payment_mode !==
                        filters.payment_mode
                ) {
                    return false;
                }

                if (
                    filters.category &&
                    entry.category !==
                        filters.category
                ) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => {
                if (a.date === b.date) {
                    return Number(b.id) - Number(a.id);
                }

                return a.date < b.date ? 1 : -1;
            });
    }, [entries, filters]);

    /* ======================================================
       CALCULATIONS
       ====================================================== */

    const summary = useMemo(() => {
        let income = 0;
        let expense = 0;

        let cashIncome = 0;
        let cashExpense = 0;

        let bankIncome = 0;
        let bankExpense = 0;

        filteredEntries.forEach((entry) => {
            const amount = Number(entry.amount || 0);

            if (entry.transaction_type === "Income") {
                income += amount;

                if (entry.payment_mode === "Cash") {
                    cashIncome += amount;
                }

                if (BANK_MODES.includes(entry.payment_mode)) {
                    bankIncome += amount;
                }
            }

            if (entry.transaction_type === "Expense") {
                expense += amount;

                if (entry.payment_mode === "Cash") {
                    cashExpense += amount;
                }

                if (BANK_MODES.includes(entry.payment_mode)) {
                    bankExpense += amount;
                }
            }
        });

        return {
            income,
            expense,
            profit: income - expense,

            cashIncome,
            cashExpense,

            bankIncome,
            bankExpense,
        };
    }, [filteredEntries]);

    /* ======================================================
       PREVIOUS BALANCE
       ====================================================== */

    const opening = useMemo(() => {
        const fromDate = filters.from_date;

        let cash = 0;
        let bank = 0;

        entries.forEach((entry) => {
            if (fromDate && entry.date >= fromDate) {
                return;
            }

            const amount = Number(entry.amount || 0);

            if (entry.transaction_type === "Income") {
                if (entry.payment_mode === "Cash") {
                    cash += amount;
                }

                if (BANK_MODES.includes(entry.payment_mode)) {
                    bank += amount;
                }
            }

            if (entry.transaction_type === "Expense") {
                if (entry.payment_mode === "Cash") {
                    cash -= amount;
                }

                if (BANK_MODES.includes(entry.payment_mode)) {
                    bank -= amount;
                }
            }
        });

        /*
         * Add configured opening balance.
         *
         * Admin + selected branch:
         */
        if (user.role === "Admin" && filters.branch) {
            const record = openingBalances.find(
                (item) =>
                    String(item.branch) ===
                    String(filters.branch)
            );

            if (record) {
                cash += Number(record.opening_cash || 0);
                bank += Number(record.opening_bank || 0);
            }
        }

        /*
         * Branch user:
         */
        if (user.role !== "Admin" && user.branch) {
            const record = openingBalances.find(
                (item) =>
                    String(item.branch) ===
                    String(user.branch)
            );

            if (record) {
                cash += Number(record.opening_cash || 0);
                bank += Number(record.opening_bank || 0);
            }
        }

        /*
         * Admin with all branches:
         */
        if (user.role === "Admin" && !filters.branch) {
            openingBalances.forEach((record) => {
                cash += Number(record.opening_cash || 0);
                bank += Number(record.opening_bank || 0);
            });
        }

        return {
            cash,
            bank,
        };
    }, [
        entries,
        openingBalances,
        filters.from_date,
        filters.branch,
        user.role,
        user.branch,
    ]);

    const closingCash =
        opening.cash +
        summary.cashIncome -
        summary.cashExpense;

    const closingBank =
        opening.bank +
        summary.bankIncome -
        summary.bankExpense;

    const totalClosing =
        closingCash +
        closingBank;

    /* ======================================================
       MONTHLY SUMMARY
       ====================================================== */

    const monthly = useMemo(() => {
        const now = new Date();

        const monthStart =
            `${now.getFullYear()}-${String(
                now.getMonth() + 1
            ).padStart(2, "0")}-01`;

        const currentDate = todayString();

        let income = 0;
        let expense = 0;

        entries.forEach((entry) => {
            if (
                entry.date < monthStart ||
                entry.date > currentDate
            ) {
                return;
            }

            if (
                filters.branch &&
                String(entry.branch) !==
                    String(filters.branch)
            ) {
                return;
            }

            const amount = Number(entry.amount || 0);

            if (entry.transaction_type === "Income") {
                income += amount;
            }

            if (entry.transaction_type === "Expense") {
                expense += amount;
            }
        });

        return {
            income,
            expense,
            profit: income - expense,
        };
    }, [entries, filters.branch]);

    /* ======================================================
       CATEGORIES
       ====================================================== */

    const categories = useMemo(() => {
        return [
            ...new Set(
                entries
                    .map((entry) => entry.category)
                    .filter(Boolean)
            ),
        ].sort();
    }, [entries]);

    /* ======================================================
       FORM
       ====================================================== */

    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const openAdd = () => {
        setEditingId(null);

        setForm({
            branch:
                filters.branch ||
                (user.role === "Admin"
                    ? ""
                    : user.branch || ""),
            date: todayString(),
            transaction_type: "Income",
            category: "",
            payment_mode: "Cash",
            description: "",
            amount: "",
        });

        setShowModal(true);
    };

    const openEdit = (entry) => {
        setEditingId(entry.id);

        setForm({
            branch: entry.branch || "",
            date: entry.date || todayString(),
            transaction_type:
                entry.transaction_type || "Income",
            category: entry.category || "",
            payment_mode:
                entry.payment_mode || "Cash",
            description:
                entry.description || "",
            amount: entry.amount || "",
        });

        setShowModal(true);
    };

    const saveEntry = async (e) => {
        e.preventDefault();

        if (!form.category.trim()) {
            alert("Please enter category.");
            return;
        }

        if (!form.amount || Number(form.amount) <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        if (
            user.role === "Admin" &&
            !form.branch
        ) {
            alert("Please select a branch.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                date: form.date,
                transaction_type:
                    form.transaction_type,
                category: form.category,
                payment_mode:
                    form.payment_mode,
                description:
                    form.description,
                amount: form.amount,
            };

            /*
             * Admin sends branch.
             *
             * Branch users are assigned automatically
             * by Django backend.
             */
            if (user.role === "Admin") {
                payload.branch = form.branch;
            }

            if (editingId) {
                await api.put(
                    `daybook/${editingId}/`,
                    payload
                );
            } else {
                await api.post(
                    "daybook/",
                    payload
                );
            }

            setShowModal(false);
            setEditingId(null);

            await loadData();
        } catch (err) {
            console.error(err);

            alert(
                typeof err?.response?.data === "object"
                    ? JSON.stringify(
                          err.response.data
                      )
                    : "Unable to save Day Book entry."
            );
        } finally {
            setSaving(false);
        }
    };

    /* ======================================================
       DELETE
       ====================================================== */

    const deleteEntry = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this Day Book entry?"
        );

        if (!confirmed) return;

        try {
            await api.delete(
                `daybook/${id}/`
            );

            await loadData();
        } catch (err) {
            console.error(err);

            alert(
                "Unable to delete this entry."
            );
        }
    };

    /* ======================================================
       OPENING BALANCE
       ====================================================== */

    const openOpeningBalance = () => {
        if (user.role !== "Admin") {
            alert(
                "Only Admin can manage opening balances."
            );
            return;
        }

        setOpeningForm({
            branch: filters.branch || "",
            opening_date: todayString(),
            opening_cash: "",
            opening_bank: "",
        });

        setShowOpeningModal(true);
    };

    const handleOpeningChange = (e) => {
        const { name, value } = e.target;

        setOpeningForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const saveOpeningBalance = async (e) => {
        e.preventDefault();

        if (!openingForm.branch) {
            alert("Please select a branch.");
            return;
        }

        try {
            const existing =
                openingBalances.find(
                    (item) =>
                        String(item.branch) ===
                        String(
                            openingForm.branch
                        )
                );

            const payload = {
                branch: openingForm.branch,
                opening_date:
                    openingForm.opening_date,
                opening_cash:
                    openingForm.opening_cash || 0,
                opening_bank:
                    openingForm.opening_bank || 0,
            };

            if (existing) {
                await api.put(
                    `opening-balances/${existing.id}/`,
                    payload
                );
            } else {
                await api.post(
                    "opening-balances/",
                    payload
                );
            }

            setShowOpeningModal(false);

            await loadData();
        } catch (err) {
            console.error(err);

            alert(
                typeof err?.response?.data === "object"
                    ? JSON.stringify(
                          err.response.data
                      )
                    : "Unable to save opening balance."
            );
        }
    };

    /* ======================================================
       QUICK FILTERS
       ====================================================== */

    const setDateRange = (type) => {
        const today = new Date();

        const format = (date) => {
            const offset =
                date.getTimezoneOffset();

            const local = new Date(
                date.getTime() -
                    offset * 60000
            );

            return local
                .toISOString()
                .slice(0, 10);
        };

        if (type === "today") {
            const value = format(today);

            setFilters((f) => ({
                ...f,
                from_date: value,
                to_date: value,
            }));
        }

        if (type === "yesterday") {
            const d = new Date(today);
            d.setDate(d.getDate() - 1);

            const value = format(d);

            setFilters((f) => ({
                ...f,
                from_date: value,
                to_date: value,
            }));
        }

        if (type === "week") {
            const d = new Date(today);

            const day =
                d.getDay() || 7;

            d.setDate(
                d.getDate() -
                    day +
                    1
            );

            setFilters((f) => ({
                ...f,
                from_date: format(d),
                to_date: format(today),
            }));
        }

        if (type === "month") {
            const d = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

            setFilters((f) => ({
                ...f,
                from_date: format(d),
                to_date: format(today),
            }));
        }
    };

    /* ======================================================
       EXPORT
       ====================================================== */

    const buildQuery = () => {
        const params =
            new URLSearchParams();

        Object.entries(filters).forEach(
            ([key, value]) => {
                if (value) {
                    params.set(
                        key,
                        value
                    );
                }
            }
        );

        return params.toString();
    };

    const downloadFile = async (
        endpoint,
        filename
    ) => {
        try {
            const response = await api.get(
                endpoint,
                {
                    params: filters,
                    responseType: "blob",
                }
            );

            const blob = new Blob([
                response.data,
            ]);

            const url =
                window.URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement("a");

            link.href = url;
            link.download = filename;

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            window.URL.revokeObjectURL(
                url
            );
        } catch (err) {
            console.error(err);

            alert(
                "Unable to generate the report."
            );
        }
    };

    const exportExcel = () => {
        downloadFile(
            "daybook/excel/",
            "StitchingPro_DayBook.xlsx"
        );
    };

    const exportPDF = () => {
        downloadFile(
            "daybook/pdf/",
            "StitchingPro_DayBook.pdf"
        );
    };

    const printPage = () => {
        window.print();
    };

    /* ======================================================
       STYLES
       ====================================================== */

    const styles = {
        page: {
            padding: "24px",
            background: "#f6f8fb",
            minHeight: "100vh",
        },

        header: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            gap: "20px",
            flexWrap: "wrap",
        },

        title: {
            margin: 0,
            fontSize: "28px",
            fontWeight: 700,
            color: "#212529",
        },

        subtitle: {
            margin: "5px 0 0",
            color: "#6c757d",
        },

        actions: {
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
        },

        button: {
            border: "0",
            borderRadius: "8px",
            padding: "10px 15px",
            fontWeight: 600,
            cursor: "pointer",
        },

        cardGrid: {
            display: "grid",
            gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
        },

        card: {
            background: "#fff",
            borderRadius: "14px",
            padding: "20px",
            boxShadow:
                "0 2px 12px rgba(0,0,0,.06)",
            border: "1px solid #edf0f4",
        },

        label: {
            color: "#6c757d",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "8px",
        },

        amount: {
            fontSize: "25px",
            fontWeight: 700,
        },

        section: {
            background: "#fff",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow:
                "0 2px 12px rgba(0,0,0,.05)",
            border:
                "1px solid #edf0f4",
        },

        quickButtons: {
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "15px",
        },

        filters: {
            display: "grid",
            gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
        },

        input: {
            width: "100%",
            boxSizing: "border-box",
            border:
                "1px solid #ced4da",
            borderRadius: "8px",
            padding: "10px 12px",
            background: "#fff",
        },

        tableWrapper: {
            overflowX: "auto",
        },

        table: {
            width: "100%",
            borderCollapse:
                "collapse",
            minWidth: "900px",
        },

        th: {
            textAlign: "left",
            padding: "13px",
            background: "#343a40",
            color: "#fff",
            fontSize: "13px",
            whiteSpace: "nowrap",
        },

        td: {
            padding: "13px",
            borderBottom:
                "1px solid #edf0f4",
            fontSize: "14px",
        },

        badge: {
            display: "inline-block",
            borderRadius: "20px",
            padding: "5px 9px",
            fontSize: "12px",
            fontWeight: 600,
        },

        modalOverlay: {
            position: "fixed",
            inset: 0,
            background:
                "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
        },

        modal: {
            width: "100%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto",
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
        },

        formGrid: {
            display: "grid",
            gridTemplateColumns:
                "repeat(2, 1fr)",
            gap: "14px",
        },
    };

    /* ======================================================
       RENDER
       ====================================================== */

    return (
        <div
            className="daybook-page"
            style={styles.page}
        >
            {/* HEADER */}

            <div
                className="no-print"
                style={styles.header}
            >
                <div>
                    <h1 style={styles.title}>
                        <i className="bi bi-journal-text me-2" />
                        Day Book Accounting
                    </h1>

                    <p style={styles.subtitle}>
                        Daily income, expenses,
                        cash, bank balances and
                        financial transactions.
                    </p>
                </div>

                <div style={styles.actions}>
                    <button
                        style={{
                            ...styles.button,
                            background: "#198754",
                            color: "#fff",
                        }}
                        onClick={exportExcel}
                    >
                        <i className="bi bi-file-earmark-excel me-1" />
                        Excel
                    </button>

                    <button
                        style={{
                            ...styles.button,
                            background: "#dc3545",
                            color: "#fff",
                        }}
                        onClick={exportPDF}
                    >
                        <i className="bi bi-file-earmark-pdf me-1" />
                        PDF
                    </button>

                    <button
                        style={{
                            ...styles.button,
                            background: "#6c757d",
                            color: "#fff",
                        }}
                        onClick={printPage}
                    >
                        <i className="bi bi-printer me-1" />
                        Print
                    </button>

                    {user.role === "Admin" && (
                        <button
                            style={{
                                ...styles.button,
                                background: "#6f42c1",
                                color: "#fff",
                            }}
                            onClick={
                                openOpeningBalance
                            }
                        >
                            <i className="bi bi-wallet2 me-1" />
                            Opening Balance
                        </button>
                    )}

                    <button
                        style={{
                            ...styles.button,
                            background: "#0d6efd",
                            color: "#fff",
                        }}
                        onClick={openAdd}
                    >
                        <i className="bi bi-plus-lg me-1" />
                        Add Entry
                    </button>
                </div>
            </div>

            {error && (
                <div
                    className="no-print"
                    style={{
                        ...styles.section,
                        color: "#842029",
                        background: "#f8d7da",
                    }}
                >
                    {error}
                </div>
            )}

            {/* SUMMARY */}

            <div style={styles.cardGrid}>
                <SummaryCard
                    title="Today's Income"
                    value={summary.income}
                    icon="bi-arrow-down-circle"
                />

                <SummaryCard
                    title="Today's Expense"
                    value={summary.expense}
                    icon="bi-arrow-up-circle"
                />

                <SummaryCard
                    title="Today's Net Profit"
                    value={summary.profit}
                    icon="bi-graph-up"
                />

                <SummaryCard
                    title="Monthly Income"
                    value={monthly.income}
                    icon="bi-calendar-check"
                />

                <SummaryCard
                    title="Monthly Expense"
                    value={monthly.expense}
                    icon="bi-calendar-x"
                />

                <SummaryCard
                    title="Monthly Net Profit"
                    value={monthly.profit}
                    icon="bi-bar-chart"
                />
            </div>

            {/* BALANCE CARDS */}

            <div style={styles.cardGrid}>
                <BalanceCard
                    title="Cash in Hand"
                    opening={opening.cash}
                    income={summary.cashIncome}
                    expense={summary.cashExpense}
                    closing={closingCash}
                />

                <BalanceCard
                    title="Cash in Bank"
                    opening={opening.bank}
                    income={summary.bankIncome}
                    expense={summary.bankExpense}
                    closing={closingBank}
                />

                <BalanceCard
                    title="Total Available Balance"
                    opening={
                        opening.cash +
                        opening.bank
                    }
                    income={
                        summary.income
                    }
                    expense={
                        summary.expense
                    }
                    closing={
                        totalClosing
                    }
                />
            </div>

            {/* FILTERS */}

            <div
                className="no-print"
                style={styles.section}
            >
                <h3
                    style={{
                        marginTop: 0,
                        marginBottom: 15,
                    }}
                >
                    <i className="bi bi-funnel me-2" />
                    Filters
                </h3>

                <div style={styles.quickButtons}>
                    <button
                        style={{
                            ...styles.button,
                            background:
                                "#e9ecef",
                        }}
                        onClick={() =>
                            setDateRange(
                                "today"
                            )
                        }
                    >
                        Today
                    </button>

                    <button
                        style={{
                            ...styles.button,
                            background:
                                "#e9ecef",
                        }}
                        onClick={() =>
                            setDateRange(
                                "yesterday"
                            )
                        }
                    >
                        Yesterday
                    </button>

                    <button
                        style={{
                            ...styles.button,
                            background:
                                "#e9ecef",
                        }}
                        onClick={() =>
                            setDateRange(
                                "week"
                            )
                        }
                    >
                        This Week
                    </button>

                    <button
                        style={{
                            ...styles.button,
                            background:
                                "#e9ecef",
                        }}
                        onClick={() =>
                            setDateRange(
                                "month"
                            )
                        }
                    >
                        This Month
                    </button>
                </div>

                <div style={styles.filters}>
                    <input
                        type="date"
                        style={styles.input}
                        value={
                            filters.from_date
                        }
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                from_date:
                                    e.target.value,
                            })
                        }
                    />

                    <input
                        type="date"
                        style={styles.input}
                        value={
                            filters.to_date
                        }
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                to_date:
                                    e.target.value,
                            })
                        }
                    />

                    {user.role === "Admin" && (
                        <select
                            style={styles.input}
                            value={
                                filters.branch
                            }
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    branch:
                                        e.target.value,
                                })
                            }
                        >
                            <option value="">
                                All Branches
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
                                        {branch.name}
                                    </option>
                                )
                            )}
                        </select>
                    )}

                    <select
                        style={styles.input}
                        value={
                            filters.transaction_type
                        }
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                transaction_type:
                                    e.target.value,
                            })
                        }
                    >
                        <option value="">
                            All Types
                        </option>

                        <option value="Income">
                            Income
                        </option>

                        <option value="Expense">
                            Expense
                        </option>
                    </select>

                    <select
                        style={styles.input}
                        value={
                            filters.payment_mode
                        }
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                payment_mode:
                                    e.target.value,
                            })
                        }
                    >
                        <option value="">
                            All Payment Modes
                        </option>

                        <option value="Cash">
                            Cash
                        </option>

                        <option value="Bank">
                            Bank
                        </option>

                        <option value="Online">
                            Online
                        </option>

                        <option value="POS">
                            POS
                        </option>
                    </select>

                    <select
                        style={styles.input}
                        value={
                            filters.category
                        }
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                category:
                                    e.target.value,
                            })
                        }
                    >
                        <option value="">
                            All Categories
                        </option>

                        {categories.map(
                            (category) => (
                                <option
                                    key={
                                        category
                                    }
                                    value={
                                        category
                                    }
                                >
                                    {category}
                                </option>
                            )
                        )}
                    </select>
                </div>
            </div>

            {/* TABLE */}

            <div style={styles.section}>
                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "center",
                        marginBottom: 15,
                    }}
                >
                    <h3 style={{ margin: 0 }}>
                        Transaction Details
                    </h3>

                    <span
                        style={{
                            color: "#6c757d",
                            fontSize: 14,
                        }}
                    >
                        {filteredEntries.length}{" "}
                        transactions
                    </span>
                </div>

                {loading ? (
                    <div
                        style={{
                            padding: 40,
                            textAlign: "center",
                        }}
                    >
                        Loading Day Book...
                    </div>
                ) : (
                    <div
                        style={
                            styles.tableWrapper
                        }
                    >
                        <table
                            style={styles.table}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Date
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Branch
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Type
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Category
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Payment Mode
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Description
                                    </th>

                                    <th
                                        style={{
                                            ...styles.th,
                                            textAlign:
                                                "right",
                                        }}
                                    >
                                        Amount
                                    </th>

                                    <th
                                        className="no-print"
                                        style={
                                            styles.th
                                        }
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredEntries.length ===
                                0 ? (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            style={{
                                                ...styles.td,
                                                textAlign:
                                                    "center",
                                                padding: 40,
                                                color:
                                                    "#6c757d",
                                            }}
                                        >
                                            No transactions
                                            found for the
                                            selected period.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEntries.map(
                                        (entry) => (
                                            <tr
                                                key={
                                                    entry.id
                                                }
                                            >
                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {formatDate(
                                                        entry.date
                                                    )}
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {entry.branch_name ||
                                                        "-"}
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    <span
                                                        style={{
                                                            ...styles.badge,
                                                            background:
                                                                entry.transaction_type ===
                                                                "Income"
                                                                    ? "#d1e7dd"
                                                                    : "#f8d7da",
                                                            color:
                                                                entry.transaction_type ===
                                                                "Income"
                                                                    ? "#0f5132"
                                                                    : "#842029",
                                                        }}
                                                    >
                                                        {
                                                            entry.transaction_type
                                                        }
                                                    </span>
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {
                                                        entry.category
                                                    }
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {
                                                        entry.payment_mode
                                                    }
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {entry.description ||
                                                        "-"}
                                                </td>

                                                <td
                                                    style={{
                                                        ...styles.td,
                                                        textAlign:
                                                            "right",
                                                        fontWeight:
                                                            700,
                                                    }}
                                                >
                                                    {money(
                                                        entry.amount
                                                    )}
                                                </td>

                                                <td
                                                    className="no-print"
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    <button
                                                        onClick={() =>
                                                            openEdit(
                                                                entry
                                                            )
                                                        }
                                                        style={{
                                                            ...styles.button,
                                                            padding:
                                                                "6px 9px",
                                                            background:
                                                                "#ffc107",
                                                            marginRight:
                                                                5,
                                                        }}
                                                    >
                                                        <i className="bi bi-pencil" />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            deleteEntry(
                                                                entry.id
                                                            )
                                                        }
                                                        style={{
                                                            ...styles.button,
                                                            padding:
                                                                "6px 9px",
                                                            background:
                                                                "#dc3545",
                                                            color:
                                                                "#fff",
                                                        }}
                                                    >
                                                        <i className="bi bi-trash" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>

                            {filteredEntries.length >
                                0 && (
                                <tfoot>
                                    <tr>
                                        <td
                                            colSpan="6"
                                            style={{
                                                ...styles.td,
                                                fontWeight: 700,
                                                textAlign:
                                                    "right",
                                            }}
                                        >
                                            Net Profit
                                        </td>

                                        <td
                                            style={{
                                                ...styles.td,
                                                fontWeight: 700,
                                                textAlign:
                                                    "right",
                                            }}
                                        >
                                            {money(
                                                summary.profit
                                            )}
                                        </td>

                                        <td className="no-print" />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}
            </div>

            {/* ADD / EDIT MODAL */}

            {showModal && (
                <div
                    className="no-print"
                    style={
                        styles.modalOverlay
                    }
                >
                    <div
                        style={styles.modal}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                                marginBottom:
                                    20,
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                }}
                            >
                                {editingId
                                    ? "Edit Day Book Entry"
                                    : "Add Day Book Entry"}
                            </h2>

                            <button
                                onClick={() =>
                                    setShowModal(
                                        false
                                    )
                                }
                                style={{
                                    border: 0,
                                    background:
                                        "transparent",
                                    fontSize:
                                        24,
                                    cursor:
                                        "pointer",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={
                                saveEntry
                            }
                        >
                            <div
                                style={
                                    styles.formGrid
                                }
                            >
                                {user.role ===
                                    "Admin" && (
                                    <label>
                                        Branch
                                        <select
                                            name="branch"
                                            value={
                                                form.branch
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            style={
                                                styles.input
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select Branch
                                            </option>

                                            {branches.map(
                                                (
                                                    branch
                                                ) => (
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
                                    </label>
                                )}

                                <label>
                                    Date
                                    <input
                                        type="date"
                                        name="date"
                                        value={
                                            form.date
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        style={
                                            styles.input
                                        }
                                        required
                                    />
                                </label>

                                <label>
                                    Transaction Type
                                    <select
                                        name="transaction_type"
                                        value={
                                            form.transaction_type
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        style={
                                            styles.input
                                        }
                                    >
                                        <option value="Income">
                                            Income
                                        </option>

                                        <option value="Expense">
                                            Expense
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    Category
                                    <input
                                        type="text"
                                        name="category"
                                        value={
                                            form.category
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Category"
                                        style={
                                            styles.input
                                        }
                                        required
                                    />
                                </label>

                                <label>
                                    Payment Mode
                                    <select
                                        name="payment_mode"
                                        value={
                                            form.payment_mode
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        style={
                                            styles.input
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

                                        <option value="POS">
                                            POS
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    Amount
                                    <input
                                        type="number"
                                        name="amount"
                                        value={
                                            form.amount
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        style={
                                            styles.input
                                        }
                                        required
                                    />
                                </label>
                            </div>

                            <label
                                style={{
                                    display:
                                        "block",
                                    marginTop:
                                        14,
                                }}
                            >
                                Description

                                <textarea
                                    name="description"
                                    value={
                                        form.description
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    rows="4"
                                    placeholder="Description"
                                    style={{
                                        ...styles.input,
                                        resize:
                                            "vertical",
                                    }}
                                />
                            </label>

                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "flex-end",
                                    gap: 8,
                                    marginTop:
                                        20,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowModal(
                                            false
                                        )
                                    }
                                    style={{
                                        ...styles.button,
                                        background:
                                            "#e9ecef",
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    style={{
                                        ...styles.button,
                                        background:
                                            "#0d6efd",
                                        color:
                                            "#fff",
                                    }}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                        ? "Update Entry"
                                        : "Save Entry"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* OPENING BALANCE MODAL */}

            {showOpeningModal && (
                <div
                    className="no-print"
                    style={
                        styles.modalOverlay
                    }
                >
                    <div
                        style={styles.modal}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                                marginBottom:
                                    20,
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                }}
                            >
                                Opening Balance
                            </h2>

                            <button
                                onClick={() =>
                                    setShowOpeningModal(
                                        false
                                    )
                                }
                                style={{
                                    border: 0,
                                    background:
                                        "transparent",
                                    fontSize:
                                        24,
                                    cursor:
                                        "pointer",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={
                                saveOpeningBalance
                            }
                        >
                            <label>
                                Branch

                                <select
                                    name="branch"
                                    value={
                                        openingForm.branch
                                    }
                                    onChange={
                                        handleOpeningChange
                                    }
                                    style={
                                        styles.input
                                    }
                                    required
                                >
                                    <option value="">
                                        Select Branch
                                    </option>

                                    {branches.map(
                                        (
                                            branch
                                        ) => (
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
                            </label>

                            <label
                                style={{
                                    display:
                                        "block",
                                    marginTop:
                                        14,
                                }}
                            >
                                Opening Date

                                <input
                                    type="date"
                                    name="opening_date"
                                    value={
                                        openingForm.opening_date
                                    }
                                    onChange={
                                        handleOpeningChange
                                    }
                                    style={
                                        styles.input
                                    }
                                    required
                                />
                            </label>

                            <label
                                style={{
                                    display:
                                        "block",
                                    marginTop:
                                        14,
                                }}
                            >
                                Opening Cash

                                <input
                                    type="number"
                                    name="opening_cash"
                                    value={
                                        openingForm.opening_cash
                                    }
                                    onChange={
                                        handleOpeningChange
                                    }
                                    min="0"
                                    step="0.01"
                                    style={
                                        styles.input
                                    }
                                />
                            </label>

                            <label
                                style={{
                                    display:
                                        "block",
                                    marginTop:
                                        14,
                                }}
                            >
                                Opening Bank

                                <input
                                    type="number"
                                    name="opening_bank"
                                    value={
                                        openingForm.opening_bank
                                    }
                                    onChange={
                                        handleOpeningChange
                                    }
                                    min="0"
                                    step="0.01"
                                    style={
                                        styles.input
                                    }
                                />
                            </label>

                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "flex-end",
                                    gap: 8,
                                    marginTop:
                                        20,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowOpeningModal(
                                            false
                                        )
                                    }
                                    style={{
                                        ...styles.button,
                                        background:
                                            "#e9ecef",
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    style={{
                                        ...styles.button,
                                        background:
                                            "#6f42c1",
                                        color:
                                            "#fff",
                                    }}
                                >
                                    Save Opening Balance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ==========================================================
   SUMMARY CARD
   ========================================================== */

function SummaryCard({
    title,
    value,
    icon,
}) {
    return (
        <div
            style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "20px",
                boxShadow:
                    "0 2px 12px rgba(0,0,0,.06)",
                border:
                    "1px solid #edf0f4",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <div
                        style={{
                            color: "#6c757d",
                            fontSize: 13,
                            fontWeight: 600,
                            marginBottom: 8,
                        }}
                    >
                        {title}
                    </div>

                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                        }}
                    >
                        {money(value)}
                    </div>
                </div>

                <i
                    className={`bi ${icon}`}
                    style={{
                        fontSize: 30,
                        opacity: 0.5,
                    }}
                />
            </div>
        </div>
    );
}

/* ==========================================================
   BALANCE CARD
   ========================================================== */

function BalanceCard({
    title,
    opening,
    income,
    expense,
    closing,
}) {
    return (
        <div
            style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "20px",
                boxShadow:
                    "0 2px 12px rgba(0,0,0,.06)",
                border:
                    "1px solid #edf0f4",
            }}
        >
            <h3
                style={{
                    marginTop: 0,
                    marginBottom: 18,
                    fontSize: 18,
                }}
            >
                {title}
            </h3>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "1fr 1fr",
                    gap: 10,
                }}
            >
                <span>Opening</span>
                <strong
                    style={{
                        textAlign:
                            "right",
                    }}
                >
                    {money(opening)}
                </strong>

                <span>Income</span>
                <strong
                    style={{
                        textAlign:
                            "right",
                    }}
                >
                    {money(income)}
                </strong>

                <span>Expense</span>
                <strong
                    style={{
                        textAlign:
                            "right",
                    }}
                >
                    {money(expense)}
                </strong>

                <span
                    style={{
                        fontWeight: 700,
                    }}
                >
                    Closing
                </span>

                <strong
                    style={{
                        textAlign:
                            "right",
                        fontSize: 18,
                    }}
                >
                    {money(closing)}
                </strong>
            </div>
        </div>
    );
}