import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Safe guard for missing context
  let login;
  try {
    ({ login } = useAuth());
  } catch (e) {
    console.warn("AuthContext not found — using mock login");
    login = async () => ({ success: true });
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) setError(result.message || "Login failed");
      else navigate("/dashboard"); // redirect after successful login
    } catch (err) {
      setError(err.message || "Login failed");
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
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)" }} />

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
        <h1
          style={{ textAlign: "center", fontSize: "28px", margin: 0 }}
          className="text-3xl font-extrabold text-indigo-600"
        >
          LearnEase
        </h1>
        <p style={{ textAlign: "center", color: "#444", marginTop: 8, marginBottom: 18 }}>
          Your Smart Study Companion
        </p>

        {error && (
          <div
            style={{
              background: "#fff1f0",
              border: "1px solid #f4c2c2",
              color: "#9b1b1b",
              padding: 10,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: 8,
              border: "none",
              background: "#4f46e5",
              color: "white",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 13 }}>
          <Link to="/forgot-password" style={{ color: "#4f46e5" }}>
            Forgot Password?
          </Link>
        </div>

        <p style={{ marginTop: 14, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
          Don’t have an account?{" "}
          <Link to="/signup" style={{ color: "#4f46e5", fontWeight: 600 }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
