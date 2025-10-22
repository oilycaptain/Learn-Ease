import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api"; // Your axios instance

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); 
    setMessage(""); 
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
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
          Forgot Password
        </h1>
        <p style={{ textAlign: "center", color: "#444", marginTop: 8, marginBottom: 18 }}>
          Enter your email to receive a password reset link
        </p>

        {message && <div style={{ background: "#d1fae5", padding: 10, borderRadius: 8, marginBottom: 12 }}>{message}</div>}
        {error && <div style={{ background: "#fff1f0", padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "none", background: "#4f46e5", color: "white", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 13 }}>
          <Link to="/login" style={{ color: "#4f46e5" }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
