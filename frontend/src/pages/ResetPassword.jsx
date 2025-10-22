import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); 
    setMessage(""); 

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { newPassword: password });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/imgs/mybg.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "250px",
        backgroundPosition: "center",
      }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)" }}></div>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "min(92%, 420px)",
          background: "rgba(255,255,255,0.95)",
          padding: "28px",
          borderRadius: "18px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        }}
      >
        <h1 style={{ textAlign: "center", fontSize: "28px", margin: 0 }} className="text-3xl font-extrabold text-indigo-600">
          Reset Password
        </h1>
        <p style={{ textAlign: "center", color: "#444", marginTop: 8, marginBottom: 18 }}>
          Enter your new password
        </p>

        {message && <div style={{ background: "#d1fae5", padding: 10, borderRadius: 8, marginBottom: 12 }}>{message}</div>}
        {error && <div style={{ background: "#fff1f0", padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "none", background: "#4f46e5", color: "white", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 13 }}>
          <Link to="/login" style={{ color: "#4f46e5" }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
