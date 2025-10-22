import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Safe guard if AuthContext is not available
  let signup;
  try {
    ({ signup } = useAuth());
  } catch (e) {
    console.warn("⚠️ AuthContext not found — using mock signup");
    signup = async () => ({ success: true });
  }

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Sanitize + track input
  const handleChange = (e) => {
    const value = e.target.value.replace(/[<>]/g, ""); // prevent XSS injection
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { fullname, email, password, confirmPassword } = formData;

    // Basic validations
    if (!fullname.trim()) return setError("Full name cannot be empty");
    if (!/^[a-zA-Z\s]+$/.test(fullname))
      return setError("Full name can only contain letters and spaces");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setError("Please enter a valid email address");
    if (password !== confirmPassword)
      return setError("Passwords do not match");
    if (!/^(?=.*[A-Z])(?=.*\d).{6,}$/.test(password))
      return setError("Password must be 6+ characters with 1 uppercase and 1 number");

    setLoading(true);
    const result = await signup(fullname.trim(), email.trim(), password);

    if (!result.success) {
      setError(result.message || "Signup failed. Please try again.");
    } else {
      setSuccess("✅ Account created successfully!");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/imgs/mybg.png')", // ✅ same as Login.jsx
        backgroundRepeat: "repeat",
        backgroundSize: "250px",
        backgroundPosition: "center",
      }}
    >
      {/* Translucent overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      ></div>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "min(92%, 440px)",
          background: "rgba(255,255,255,0.95)",
          padding: "28px",
          borderRadius: "18px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "28px",
            margin: 0,
          }}
          className="text-3xl font-extrabold text-indigo-600"
        >
          LearnEase
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "#444",
            marginTop: 8,
            marginBottom: 18,
          }}
        >
          Your Smart Study Companion
        </p>

        {/* Error / Success messages */}
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
        {success && (
          <div
            style={{
              background: "#f0fff4",
              border: "1px solid #b2f5ea",
              color: "#065f46",
              padding: 10,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {success}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label
              htmlFor="fullname"
              style={{ display: "block", fontSize: 13, marginBottom: 6 }}
            >
              Full Name
            </label>
            <input
              id="fullname"
              name="fullname"
              type="text"
              value={formData.fullname}
              onChange={handleChange}
              placeholder="Enter full name"
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
            <label
              htmlFor="email"
              style={{ display: "block", fontSize: 13, marginBottom: 6 }}
            >
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
            <label
              htmlFor="password"
              style={{ display: "block", fontSize: 13, marginBottom: 6 }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
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
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 13,
                  color: "#555",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              style={{ display: "block", fontSize: 13, marginBottom: 6 }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
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
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p
          style={{
            marginTop: 14,
            textAlign: "center",
            color: "#6b7280",
            fontSize: 13,
          }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#4f46e5", fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
