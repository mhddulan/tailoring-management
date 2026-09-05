import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Layout.css";

function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const isAdmin =
        user.role === "Admin";

    const isBranch =
        user.role === "Branch";


    const closeMobileSidebar = () => {
        setSidebarOpen(false);
    };


    const goTo = (path) => {
        navigate(path);
        closeMobileSidebar();
    };


    const isActive = (path) => {
        return location.pathname === path;
    };


    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };


    return (
        <div className="app-wrapper">


            {/* =================================================
                MOBILE BACKDROP
            ================================================= */}

            {sidebarOpen && (
                <div
                    className="sidebar-backdrop show"
                    onClick={closeMobileSidebar}
                />
            )}


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside
                className={
                    sidebarOpen
                        ? "app-sidebar show"
                        : "app-sidebar"
                }
            >


                {/* =================================================
                    BRAND
                ================================================= */}

                <div className="sidebar-header">

                    <div className="brand-icon-box">

                        <i className="bi bi-scissors"></i>

                    </div>

                    <div>

                        <h1 className="brand-title">
                            Stitching Pro
                        </h1>

                        <span className="brand-subtitle">
                            Tailoring ERP
                        </span>

                    </div>

                </div>


                {/* =================================================
                    MENU
                ================================================= */}

                <div className="sidebar-menu-wrapper">


                    {/* =================================================
                        ADMIN MENU
                    ================================================= */}

                    {isAdmin && (
                        <>

                            <p className="menu-section-title">
                                Administration
                            </p>


                            <SidebarLink
                                icon="bi-grid-1x2-fill"
                                label="Dashboard"
                                active={isActive("/dashboard")}
                                onClick={() =>
                                    goTo("/dashboard")
                                }
                            />


                            <SidebarLink
                                icon="bi-buildings-fill"
                                label="Branches"
                                active={isActive("/branches")}
                                onClick={() =>
                                    goTo("/branches")
                                }
                            />


                            <SidebarLink
                                icon="bi-people-fill"
                                label="Customers"
                                active={isActive("/customers")}
                                onClick={() =>
                                    goTo("/customers")
                                }
                            />


                            <SidebarLink
                                icon="bi-bag-check-fill"
                                label="Orders"
                                active={isActive("/orders")}
                                onClick={() =>
                                    goTo("/orders")
                                }
                            />


                            <SidebarLink
                                icon="bi-scissors"
                                label="Alterations"
                                active={isActive("/alterations")}
                                onClick={() =>
                                    goTo("/alterations")
                                }
                            />


                            <SidebarLink
                                icon="bi-person-badge-fill"
                                label="Employees"
                                active={isActive("/employees")}
                                onClick={() =>
                                    goTo("/employees")
                                }
                            />


                            <SidebarLink
                                icon="bi-gear-wide-connected"
                                label="Production"
                                active={isActive("/production")}
                                onClick={() =>
                                    goTo("/production")
                                }
                            />


                            <SidebarLink
                                icon="bi-journal-bookmark-fill"
                                label="Day Book"
                                active={isActive("/daybook")}
                                onClick={() =>
                                    goTo("/daybook")
                                }
                            />


                            {/* =================================================
                                STORE & INVENTORY
                            ================================================= */}

                            <p className="menu-section-title">
                                Store & Inventory
                            </p>


                            <SidebarLink
                                icon="bi-tags-fill"
                                label="Categories"
                                active={isActive("/categories")}
                                onClick={() =>
                                    goTo("/categories")
                                }
                            />


                            <SidebarLink
                                icon="bi-box-seam-fill"
                                label="Products"
                                active={isActive("/products")}
                                onClick={() =>
                                    goTo("/products")
                                }
                            />


                            <SidebarLink
                                icon="bi-arrow-left-right"
                                label="Stock Transfer"
                                active={isActive("/stock-transfer")}
                                onClick={() =>
                                    goTo("/stock-transfer")
                                }
                            />


                            <SidebarLink
                                icon="bi-boxes"
                                label="Branch Stock"
                                active={isActive("/branch-stock")}
                                onClick={() =>
                                    goTo("/branch-stock")
                                }
                            />


                            <SidebarLink
                                icon="bi-bar-chart-line-fill"
                                label="Stock Report"
                                active={isActive("/stock-report")}
                                onClick={() =>
                                    goTo("/stock-report")
                                }
                            />


                            <SidebarLink
                                icon="bi-cart-fill"
                                label="POS Sales"
                                active={isActive("/sales")}
                                onClick={() =>
                                    goTo("/sales")
                                }
                            />


                            <SidebarLink
                                icon="bi-graph-up-arrow"
                                label="Sales Report"
                                active={isActive("/sales-report")}
                                onClick={() =>
                                    goTo("/sales-report")
                                }
                            />

                        </>
                    )}


                    {/* =================================================
                        BRANCH MENU
                    ================================================= */}

                    {isBranch && (
                        <>

                            <p className="menu-section-title">
                                Branch Dashboard
                            </p>


                            <SidebarLink
                                icon="bi-grid-1x2-fill"
                                label="Dashboard"
                                active={isActive("/branch-dashboard")}
                                onClick={() =>
                                    goTo("/branch-dashboard")
                                }
                            />


                            <SidebarLink
                                icon="bi-people-fill"
                                label="Customers"
                                active={isActive("/customers")}
                                onClick={() =>
                                    goTo("/customers")
                                }
                            />


                            <SidebarLink
                                icon="bi-bag-check-fill"
                                label="Orders"
                                active={isActive("/orders")}
                                onClick={() =>
                                    goTo("/orders")
                                }
                            />


                            <SidebarLink
                                icon="bi-scissors"
                                label="Alterations"
                                active={isActive("/alterations")}
                                onClick={() =>
                                    goTo("/alterations")
                                }
                            />


                            <SidebarLink
                                icon="bi-person-badge-fill"
                                label="Employees"
                                active={isActive("/employees")}
                                onClick={() =>
                                    goTo("/employees")
                                }
                            />


                            <SidebarLink
                                icon="bi-gear-wide-connected"
                                label="Production"
                                active={isActive("/production")}
                                onClick={() =>
                                    goTo("/production")
                                }
                            />


                            <SidebarLink
                                icon="bi-journal-bookmark-fill"
                                label="Day Book"
                                active={isActive("/daybook")}
                                onClick={() =>
                                    goTo("/daybook")
                                }
                            />


                            <p className="menu-section-title">
                                Store & Sales
                            </p>


                            <SidebarLink
                                icon="bi-boxes"
                                label="My Stock"
                                active={isActive("/branch-stock")}
                                onClick={() =>
                                    goTo("/branch-stock")
                                }
                            />


                            <SidebarLink
                                icon="bi-bar-chart-line-fill"
                                label="Stock Report"
                                active={isActive("/stock-report")}
                                onClick={() =>
                                    goTo("/stock-report")
                                }
                            />


                            <SidebarLink
                                icon="bi-cart-plus-fill"
                                label="New Sale"
                                active={isActive("/new-sale")}
                                onClick={() =>
                                    goTo("/new-sale")
                                }
                            />


                            <SidebarLink
                                icon="bi-receipt"
                                label="Sales"
                                active={isActive("/sales")}
                                onClick={() =>
                                    goTo("/sales")
                                }
                            />


                            <SidebarLink
                                icon="bi-graph-up-arrow"
                                label="Sales Report"
                                active={isActive("/sales-report")}
                                onClick={() =>
                                    goTo("/sales-report")
                                }
                            />

                        </>
                    )}

                </div>


                {/* =================================================
                    SIDEBAR FOOTER
                ================================================= */}

                <div className="sidebar-footer">

                    <button
                        className="sidebar-nav-link logout-link"
                        onClick={logout}
                    >

                        <i className="bi bi-box-arrow-right"></i>

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </aside>


            {/* =================================================
                MAIN
            ================================================= */}

            <div className="app-main">


                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="app-header">


                    {/* LEFT */}

                    <div className="header-left">

                        <button
                            type="button"
                            className="sidebar-toggle"
                            onClick={() =>
                                setSidebarOpen(true)
                            }
                        >

                            <i className="bi bi-list"></i>

                        </button>


                        <div className="page-title-wrapper">

                            <h5>
                                {getPageTitle(
                                    location.pathname
                                )}
                            </h5>

                        </div>

                    </div>


                    {/* RIGHT */}

                    <div className="header-right">

                        <div className="user-profile-badge">


                            <div className="user-avatar-circle">

                                {user.username
                                    ?.slice(0, 1)
                                    .toUpperCase() || "A"}

                            </div>


                            <div className="header-user-info">

                                <div className="header-username">

                                    {user.username || "Admin"}

                                </div>


                                <span className="header-role">

                                    {user.role || "Administrator"}

                                </span>

                            </div>

                        </div>

                    </div>

                </header>


                {/* =================================================
                    PAGE CONTENT
                ================================================= */}

                <main className="app-content">

                    {children}

                </main>

            </div>

        </div>
    );
}


/* =========================================================
   SIDEBAR LINK
========================================================= */

function SidebarLink({
    icon,
    label,
    active,
    onClick,
}) {

    return (
        <button
            type="button"
            className={
                active
                    ? "sidebar-nav-link active"
                    : "sidebar-nav-link"
            }
            onClick={onClick}
        >

            <i className={`bi ${icon}`}></i>

            <span>
                {label}
            </span>

        </button>
    );
}


/* =========================================================
   PAGE TITLE
========================================================= */

function getPageTitle(path) {

    const titles = {
        "/dashboard": "Dashboard",
        "/branches": "Branches",
        "/customers": "Customers",
        "/orders": "Orders",
        "/alterations": "Alterations",
        "/employees": "Employees",
        "/production": "Production",
        "/daybook": "Day Book",
        "/categories": "Categories",
        "/products": "Products",
        "/stock-transfer": "Stock Transfer",
        "/branch-stock": "Branch Stock",
        "/stock-report": "Stock Report",
        "/sales": "POS Sales",
        "/sales-report": "Sales Report",
        "/new-sale": "New Sale",
        "/branch-dashboard": "Dashboard",
    };

    return titles[path] || "Stitching Pro";
}


export default Layout;