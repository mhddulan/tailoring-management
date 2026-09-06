import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response = await api.post("login/", {
                username: username.trim(),
                password: password,
            });


            /*
            =========================================================
            SAVE TOKEN
            =========================================================
            */

            const token = response.data.token;

            if (!token) {
                throw new Error("Login token was not returned by server.");
            }

            localStorage.setItem("token", token);


            /*
            =========================================================
            SAVE USER INFORMATION
            =========================================================
            */

            if (response.data.user) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(response.data.user)
                );

            }


            /*
            =========================================================
            REDIRECT
            =========================================================
            */

            const user = response.data.user;

            if (
                user?.role === "Branch" ||
                user?.role === "Branch Manager"
            ) {

                navigate("/dashboard", {
                    replace: true,
                });

            } else {

                navigate("/dashboard", {
                    replace: true,
                });

            }

        } catch (err) {

            console.error("Login error:", err);

            if (err.response) {

                const data = err.response.data;

                setError(
                    data.error ||
                    data.detail ||
                    "Invalid username or password."
                );

            } else {

                setError(
                    "Unable to connect to the server. Please try again."
                );

            }

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="login-page">

            <div className="login-card">


                {/* =====================================================
                    BRAND
                ===================================================== */}

                <div className="login-brand">

                    <div className="login-brand-icon">

                        <i className="bi bi-scissors"></i>

                    </div>

                    <div>

                        <h2 className="login-brand-title">
                            Stitching Pro
                        </h2>

                        <span
                            className="badge bg-primary-subtle text-primary fw-semibold"
                            style={{
                                fontSize: "0.75rem",
                            }}
                        >
                            TAILORING ERP
                        </span>

                    </div>

                </div>


                {/* =====================================================
                    SUBTITLE
                ===================================================== */}

                <p className="login-subtitle">

                    Sign in to manage orders, branch performance,
                    and financial reports

                </p>


                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (

                    <div className="alert alert-danger mb-4">

                        <i className="bi bi-exclamation-circle-fill me-2"></i>

                        {error}

                    </div>

                )}


                {/* =====================================================
                    LOGIN FORM
                ===================================================== */}

                <form onSubmit={handleSubmit}>


                    {/* USERNAME */}

                    <div className="mb-3">

                        <label className="form-label fw-semibold text-dark mb-1">

                            Username

                        </label>

                        <div className="input-group">

                            <span className="input-group-text bg-light border-end-0">

                                <i className="bi bi-person text-muted"></i>

                            </span>

                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(e.target.value)
                                }
                                required
                                autoFocus
                            />

                        </div>

                    </div>


                    {/* PASSWORD */}

                    <div className="mb-4">

                        <label className="form-label fw-semibold text-dark mb-1">

                            Password

                        </label>

                        <div className="input-group">

                            <span className="input-group-text bg-light border-end-0">

                                <i className="bi bi-lock text-muted"></i>

                            </span>

                            <input
                                type="password"
                                className="form-control border-start-0"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />

                        </div>

                    </div>


                    {/* LOGIN BUTTON */}

                    <button
                        type="submit"
                        className="btn btn-login d-flex align-items-center justify-content-center gap-2"
                        disabled={loading}
                    >

                        {loading ? (

                            <>
                                <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                ></span>

                                <span>
                                    Signing In...
                                </span>
                            </>

                        ) : (

                            <>
                                <span>
                                    Sign In
                                </span>

                                <i className="bi bi-arrow-right"></i>
                            </>

                        )}

                    </button>

                </form>


                {/* =====================================================
                    FOOTER
                ===================================================== */}

                <div className="login-footer">

                    &copy; 2026 Stitching Pro &bull;
                    Tailoring Management ERP

                </div>

            </div>

        </div>

    );

}


export default Login;