import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [pin, setPin] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("forgot-password/", {
                username,
                pin,
                new_password: newPassword,
            });

            setMessage(
                response.data.message ||
                "Password changed successfully."
            );

            setUsername("");
            setPin("");
            setNewPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (err) {
            setError(
                err.response?.data?.error ||
                "Unable to reset password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>

                <div style={styles.logo}>
                    <i className="bi bi-key-fill"></i>
                </div>

                <h2 style={styles.title}>
                    Forgot Password?
                </h2>

                <p style={styles.subtitle}>
                    Reset your password using the Admin reset PIN.
                </p>

                {error && (
                    <div style={styles.error}>
                        <i className="bi bi-exclamation-circle"></i>
                        {error}
                    </div>
                )}

                {message && (
                    <div style={styles.success}>
                        <i className="bi bi-check-circle"></i>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <label style={styles.label}>
                        Username
                    </label>

                    <div style={styles.inputWrapper}>
                        <i
                            className="bi bi-person"
                            style={styles.icon}
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

                    <label style={styles.label}>
                        Reset PIN
                    </label>

                    <div style={styles.inputWrapper}>
                        <i
                            className="bi bi-shield-lock"
                            style={styles.icon}
                        ></i>

                        <input
                            type="password"
                            placeholder="Enter reset PIN"
                            value={pin}
                            onChange={(e) =>
                                setPin(e.target.value)
                            }
                            required
                            style={styles.input}
                        />
                    </div>

                    <label style={styles.label}>
                        New Password
                    </label>

                    <div style={styles.inputWrapper}>
                        <i
                            className="bi bi-lock"
                            style={styles.icon}
                        ></i>

                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(e.target.value)
                            }
                            required
                            style={styles.input}
                        />
                    </div>

                    <label style={styles.label}>
                        Confirm Password
                    </label>

                    <div style={styles.inputWrapper}>
                        <i
                            className="bi bi-lock-fill"
                            style={styles.icon}
                        ></i>

                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            required
                            style={styles.input}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading ? (
                            "Resetting..."
                        ) : (
                            <>
                                <i className="bi bi-check2-circle me-2"></i>
                                Reset Password
                            </>
                        )}
                    </button>

                </form>

                <button
                    onClick={() => navigate("/login")}
                    style={styles.backButton}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Login
                </button>

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
            "linear-gradient(135deg, #0f172a, #1e293b, #334155)",
        padding: "20px",
    },

    card: {
        width: "100%",
        maxWidth: "430px",
        background: "#fff",
        borderRadius: "20px",
        padding: "40px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
    },

    logo: {
        width: "64px",
        height: "64px",
        margin: "0 auto 18px",
        borderRadius: "16px",
        background: "#0f172a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
    },

    title: {
        textAlign: "center",
        color: "#0f172a",
        fontWeight: "700",
        marginBottom: "8px",
    },

    subtitle: {
        textAlign: "center",
        color: "#64748b",
        fontSize: "14px",
        marginBottom: "25px",
    },

    label: {
        display: "block",
        marginTop: "15px",
        marginBottom: "7px",
        fontWeight: "600",
        fontSize: "14px",
        color: "#334155",
    },

    inputWrapper: {
        position: "relative",
    },

    icon: {
        position: "absolute",
        left: "15px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "#64748b",
    },

    input: {
        width: "100%",
        height: "48px",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        padding: "0 15px 0 43px",
        fontSize: "15px",
        boxSizing: "border-box",
        outline: "none",
    },

    button: {
        width: "100%",
        height: "50px",
        marginTop: "25px",
        border: "none",
        borderRadius: "10px",
        background: "#0f172a",
        color: "#fff",
        fontWeight: "600",
        fontSize: "15px",
        cursor: "pointer",
    },

    backButton: {
        width: "100%",
        marginTop: "15px",
        padding: "10px",
        border: "none",
        background: "transparent",
        color: "#475569",
        cursor: "pointer",
    },

    error: {
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#dc2626",
        padding: "11px",
        borderRadius: "8px",
        fontSize: "14px",
    },

    success: {
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        color: "#16a34a",
        padding: "11px",
        borderRadius: "8px",
        fontSize: "14px",
    },
};

export default ForgotPassword;