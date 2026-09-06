import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

import Branches from "./pages/Branches";
import CreateBranch from "./pages/CreateBranch";
import BranchPerformance from "./pages/BranchPerformance";

import Customers from "./pages/Customers";
import CustomerCreate from "./pages/CustomerCreate";
import CustomerDetail from "./pages/CustomerDetail";
import CustomerEdit from "./pages/CustomerEdit";
import MeasurementEdit from "./pages/MeasurementEdit";
import CustomerLedger from "./pages/CustomerLedger";

import Orders from "./pages/Orders";
import OrderCreate from "./pages/OrderCreate";
import OrderDetail from "./pages/OrderDetail";
import OrderEdit from "./pages/OrderEdit";
import OrderPayment from "./pages/OrderPayment";
import OrderStatus from "./pages/OrderStatus";
import OrderDelivery from "./pages/OrderDelivery";

import Products from "./pages/Products/Products";
import ProductCreate from "./pages/Products/ProductCreate";
import ProductEdit from "./pages/Products/ProductEdit";

import StockTransfer from "./pages/inventory/StockTransfer";
import BranchStock from "./pages/inventory/BranchStock";

import SalesReport from "./pages/reports/SalesReport";
import StockReport from "./pages/reports/StockReport";

import Categories from "./pages/categories/Categories";
import CategoryCreate from "./pages/categories/CategoryCreate";
import CategoryEdit from "./pages/categories/CategoryEdit";

import Sales from "./pages/sales/Sales";
import SaleCreate from "./pages/sales/SaleCreate";

import Employees from "./pages/Employees";
import EmployeeCreate from "./pages/EmployeeCreate";
import EmployeeEdit from "./pages/EmployeeEdit";
import EmployeePerformance from "./pages/EmployeePerformance";

import Production from "./pages/Production";
import ProductionCreate from "./pages/ProductionCreate";

import DayBook from "./pages/DayBook";

import Alterations from "./pages/Alterations";
import AlterationCreate from "./pages/AlterationCreate";
import AlterationEdit from "./pages/AlterationEdit";

import Layout from "./components/Layout/Layout";


/* =========================================================
   PROTECTED LAYOUT
========================================================= */

function ProtectedLayout({ children }) {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Layout>
            {children}
        </Layout>
    );
}


/* =========================================================
   APP
========================================================= */

function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* =====================================================
                    PUBLIC
                ===================================================== */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* =====================================================
                    DASHBOARD
                ===================================================== */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedLayout>
                            <Dashboard />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    BRANCHES
                ===================================================== */}

                <Route
                    path="/branches"
                    element={
                        <ProtectedLayout>
                            <Branches />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/branches/create"
                    element={
                        <ProtectedLayout>
                            <CreateBranch />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/branches/:id/performance"
                    element={
                        <ProtectedLayout>
                            <BranchPerformance />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    CUSTOMERS
                ===================================================== */}

                <Route
                    path="/customers"
                    element={
                        <ProtectedLayout>
                            <Customers />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/customers/create"
                    element={
                        <ProtectedLayout>
                            <CustomerCreate />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/customers/:id"
                    element={
                        <ProtectedLayout>
                            <CustomerDetail />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/customers/:id/edit"
                    element={
                        <ProtectedLayout>
                            <CustomerEdit />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/customers/:id/measurements"
                    element={
                        <ProtectedLayout>
                            <MeasurementEdit />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/customers/:id/ledger"
                    element={
                        <ProtectedLayout>
                            <CustomerLedger />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    ORDERS
                ===================================================== */}

                <Route
                    path="/orders"
                    element={
                        <ProtectedLayout>
                            <Orders />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/orders/create"
                    element={
                        <ProtectedLayout>
                            <OrderCreate />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/orders/:id"
                    element={
                        <ProtectedLayout>
                            <OrderDetail />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/orders/:id/edit"
                    element={
                        <ProtectedLayout>
                            <OrderEdit />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/orders/:id/payment"
                    element={
                        <ProtectedLayout>
                            <OrderPayment />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/orders/:id/status"
                    element={
                        <ProtectedLayout>
                            <OrderStatus />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/orders/:id/delivery"
                    element={
                        <ProtectedLayout>
                            <OrderDelivery />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    PRODUCTS
                ===================================================== */}

                <Route
                    path="/products"
                    element={
                        <ProtectedLayout>
                            <Products />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/products/create"
                    element={
                        <ProtectedLayout>
                            <ProductCreate />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/products/:id/edit"
                    element={
                        <ProtectedLayout>
                            <ProductEdit />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    INVENTORY
                ===================================================== */}

                <Route
                    path="/stock-transfer"
                    element={
                        <ProtectedLayout>
                            <StockTransfer />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/branch-stock"
                    element={
                        <ProtectedLayout>
                            <BranchStock />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    PRODUCT CATEGORIES
                ===================================================== */}

                <Route
                    path="/categories"
                    element={
                        <ProtectedLayout>
                            <Categories />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/categories/create"
                    element={
                        <ProtectedLayout>
                            <CategoryCreate />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/categories/:id/edit"
                    element={
                        <ProtectedLayout>
                            <CategoryEdit />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    EMPLOYEES
                ===================================================== */}

                <Route
                    path="/employees"
                    element={
                        <ProtectedLayout>
                            <Employees />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/employees/create"
                    element={
                        <ProtectedLayout>
                            <EmployeeCreate />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/employees/:id/edit"
                    element={
                        <ProtectedLayout>
                            <EmployeeEdit />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/employees/:id/performance"
                    element={
                        <ProtectedLayout>
                            <EmployeePerformance />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    PRODUCTION
                ===================================================== */}

                <Route
                    path="/production"
                    element={
                        <ProtectedLayout>
                            <Production />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/production/create"
                    element={
                        <ProtectedLayout>
                            <ProductionCreate />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    DAYBOOK
                ===================================================== */}

                <Route
                    path="/daybook"
                    element={
                        <ProtectedLayout>
                            <DayBook />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    SALES / POS
                ===================================================== */}

                <Route
                    path="/sales"
                    element={
                        <ProtectedLayout>
                            <Sales />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/sales/create"
                    element={
                        <ProtectedLayout>
                            <SaleCreate />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    ALTERATIONS
                ===================================================== */}

                <Route
                    path="/alterations"
                    element={
                        <ProtectedLayout>
                            <Alterations />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/alterations/create"
                    element={
                        <ProtectedLayout>
                            <AlterationCreate />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/alterations/:id/edit"
                    element={
                        <ProtectedLayout>
                            <AlterationEdit />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    REPORTS
                ===================================================== */}

                <Route
                    path="/reports"
                    element={
                        <ProtectedLayout>
                            <div
                                style={{
                                    padding: "30px",
                                }}
                            >
                                <h2>
                                    Reports
                                </h2>

                                <p>
                                    Reports module
                                    is available.
                                </p>

                                <div
                                    style={{
                                        marginTop: "20px",
                                    }}
                                >
                                    <a
                                        href="/sales-report"
                                        style={{
                                            marginRight: "20px",
                                        }}
                                    >
                                        Sales Report
                                    </a>

                                    <a
                                        href="/stock-report"
                                    >
                                        Stock Report
                                    </a>
                                </div>
                            </div>
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/sales-report"
                    element={
                        <ProtectedLayout>
                            <SalesReport />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/stock-report"
                    element={
                        <ProtectedLayout>
                            <StockReport />
                        </ProtectedLayout>
                    }
                />


                {/* =====================================================
                    UNKNOWN ROUTES
                ===================================================== */}

                <Route
                    path="*"
                    element={
                        <ProtectedLayout>
                            <div
                                style={{
                                    padding: "30px",
                                }}
                            >
                                <h3>
                                    Page Coming Soon
                                </h3>

                                <p>
                                    This module will be
                                    connected to the
                                    Django API next.
                                </p>
                            </div>
                        </ProtectedLayout>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;
