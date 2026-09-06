import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post("login/", {
                username,
                password,
            });

            if (response.data.token) {
                localStorage.setItem("token", response.data.token);

                if (response.data.user) {
                    localStorage.setItem(
                        "user",
                        JSON.stringify(response.data.user)
                    );
                }

                navigate("/dashboard", { replace: true });
            } else {
                setError("Login token was not returned.");
            }
        } catch (err) {
            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                "Invalid username or password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>

                <div style={styles.logo}>
                    <i className="bi bi-scissors"></i>
                </div>

                <h1 style={styles.title}>
                    Tailoring Management
                </h1>

                <p style={styles.subtitle}>
                    Sign in to your account
                </p>

                {error && (
                    <div style={styles.error}>
                        <i className="bi bi-exclamation-circle"></i>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Username
                        </label>

                        <div style={styles.inputWrapper}>
                            <i
                                className="bi bi-person"
                                style={styles.inputIcon}
                            ></i>

                            <input
                                type="text"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(e.target.value)
                                }
                                required
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Password
                        </label>

                        <div style={styles.inputWrapper}>
                            <i
                                className="bi bi-lock"
                                style={styles.inputIcon}
                            ></i>

                            <input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                ></span>
                                Signing in...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                Login
                            </>
                        )}
                    </button>

                </form>

                <div style={styles.footer}>
                    Tailoring Management System
                </div>

            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        padding: "20px",
        fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    },

    card: {
        width: "100%",
        maxWidth: "430px",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "40px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.30)",
    },

    logo: {
        width: "64px",
        height: "64px",
        margin: "0 auto 18px",
        borderRadius: "16px",
        background: "#0f172a",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
    },

    title: {
        textAlign: "center",
        margin: "0",
        color: "#0f172a",
        fontSize: "28px",
        fontWeight: "700",
    },

    subtitle: {
        textAlign: "center",
        marginTop: "8px",
        marginBottom: "30px",
        color: "#64748b",
        fontSize: "15px",
    },

    field: {
        marginBottom: "20px",
    },

    label: {
        display: "block",
        marginBottom: "8px",
        color: "#334155",
        fontWeight: "600",
        fontSize: "14px",
    },

    inputWrapper: {
        position: "relative",
    },

    inputIcon: {
        position: "absolute",
        left: "15px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "#64748b",
        fontSize: "17px",
    },

    input: {
        width: "100%",
        height: "50px",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        padding: "0 15px 0 45px",
        fontSize: "15px",
        outline: "none",
        boxSizing: "border-box",
    },

    button: {
        width: "100%",
        height: "50px",
        border: "none",
        borderRadius: "10px",
        background: "#0f172a",
        color: "#ffffff",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
        marginTop: "8px",
    },

    error: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#fef2f2",
        color: "#dc2626",
        border: "1px solid #fecaca",
        padding: "12px",
        borderRadius: "10px",
        marginBottom: "20px",
        fontSize: "14px",
    },

    footer: {
        textAlign: "center",
        marginTop: "28px",
        color: "#94a3b8",
        fontSize: "13px",
    },
};

export default Login;