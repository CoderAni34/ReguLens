import React, { useState } from "react";
import { LogIn, UserPlus, ShieldCheck, AlertCircle, CheckCircle2, Lock, Mail, User, Sparkles } from "lucide-react";
import { loginUser, registerUser, setAuthSession } from "../services/api";

function Login({ onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Compliance Officer");
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email || !password) {
      setError("Please fill in all required credentials.");
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        const response = await registerUser({
          email,
          password,
          full_name: fullName || "Compliance Officer",
          role,
        });

        setAuthSession(response.access_token, response.user, rememberMe);
        if (onLoginSuccess) {
          onLoginSuccess(response.access_token, response.user, rememberMe);
        }
      } else {
        const response = await loginUser({
          email,
          password,
        });

        setAuthSession(response.access_token, response.user, rememberMe);
        if (onLoginSuccess) {
          onLoginSuccess(response.access_token, response.user, rememberMe);
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed. Please check your credentials and backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setIsRegisterMode(false);
    setEmail("admin@regulens.ai");
    setPassword("Admin@123");
    setError("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#070b10",
      padding: "24px",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "460px",
        background: "#0e141c",
        border: "1px solid #1c2736",
        borderRadius: "14px",
        padding: "36px 32px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
      }}>
        {/* BRAND LOGO & HEADER */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(229, 166, 9, 0.15)",
              border: "1px solid rgba(229, 166, 9, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#e5a609",
              fontSize: "22px",
              fontWeight: "700",
            }}>
              ⬡
            </div>
            <span style={{
              color: "#ffffff",
              fontSize: "22px",
              fontWeight: "700",
              letterSpacing: "-0.4px",
            }}>
              ReguLens
            </span>
          </div>

          <div style={{
            display: "inline-block",
            color: "#e5a609",
            background: "rgba(229, 166, 9, 0.1)",
            border: "1px solid rgba(229, 166, 9, 0.2)",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "600",
            letterSpacing: "0.5px",
            marginBottom: "14px",
          }}>
            ✦ AI REGULATORY INTELLIGENCE
          </div>

          <h2 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "600", marginBottom: "6px" }}>
            {isRegisterMode ? "Create Compliance Account" : "Sign In to Workspace"}
          </h2>
          <p style={{ color: "#7e8997", fontSize: "13px", margin: 0 }}>
            {isRegisterMode
              ? "Register to begin automated obligation analysis"
              : "Enter your credentials to access regulatory workflows"
            }
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div style={{
          display: "flex",
          background: "#080c10",
          borderRadius: "8px",
          padding: "4px",
          marginBottom: "24px",
          border: "1px solid #1a232f",
        }}>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setError(""); }}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: !isRegisterMode ? "#1c2635" : "transparent",
              color: !isRegisterMode ? "#ffffff" : "#8996a6",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setError(""); }}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: isRegisterMode ? "#1c2635" : "transparent",
              color: isRegisterMode ? "#ffffff" : "#8996a6",
            }}
          >
            Create Account
          </button>
        </div>

        {/* ERROR / SUCCESS ALERTS */}
        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#f87171",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "18px",
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            color: "#34d399",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "18px",
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{successMsg}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {isRegisterMode && (
            <div>
              <label style={{ display: "block", color: "#9ca7b5", fontSize: "12px", marginBottom: "6px", fontWeight: "500" }}>
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    background: "#080c10",
                    border: "1px solid #222d3d",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", color: "#9ca7b5", fontSize: "12px", marginBottom: "6px", fontWeight: "500" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="email"
                required
                placeholder="officer@regulens.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  background: "#080c10",
                  border: "1px solid #222d3d",
                  borderRadius: "6px",
                  color: "#f8fafc",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", color: "#9ca7b5", fontSize: "12px", marginBottom: "6px", fontWeight: "500" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  background: "#080c10",
                  border: "1px solid #222d3d",
                  borderRadius: "6px",
                  color: "#f8fafc",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {isRegisterMode && (
            <div>
              <label style={{ display: "block", color: "#9ca7b5", fontSize: "12px", marginBottom: "6px", fontWeight: "500" }}>
                Role / Function
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#080c10",
                  border: "1px solid #222d3d",
                  borderRadius: "6px",
                  color: "#f8fafc",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="Compliance Officer">Compliance Officer</option>
                <option value="Internal Auditor">Internal Auditor</option>
                <option value="Legal & Regulatory Counsel">Legal & Regulatory Counsel</option>
                <option value="CISO / Security Lead">CISO / Security Lead</option>
                <option value="Department Administrator">Department Administrator</option>
              </select>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8d98a7", fontSize: "12px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: "#e5a609" }}
              />
              Remember me
            </label>

            {!isRegisterMode && (
              <button
                type="button"
                onClick={handleQuickDemoFill}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#e5a609",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Sparkles size={13} /> Demo Login
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              padding: "12px 20px",
              background: "#e5a609",
              color: "#070b10",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background 0.15s ease",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isRegisterMode ? (
              <>
                <UserPlus size={17} /> Create Account & Enter
              </>
            ) : (
              <>
                <LogIn size={17} /> Sign In to ReguLens
              </>
            )}
          </button>
        </form>

        {/* DEMO FOOTER BANNER */}
        <div style={{
          marginTop: "24px",
          padding: "12px 14px",
          background: "rgba(229, 166, 9, 0.04)",
          border: "1px dashed rgba(229, 166, 9, 0.25)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <ShieldCheck size={20} style={{ color: "#e5a609", flexShrink: 0 }} />
          <div style={{ fontSize: "11px", color: "#8d98a7", lineHeight: "1.4" }}>
            <strong style={{ color: "#d6dce4" }}>SIH Prototype Auth</strong>: Use demo user{" "}
            <code style={{ color: "#e5a609", background: "#131a23", padding: "1px 4px", borderRadius: "3px" }}>
              admin@regulens.ai
            </code>{" "}
            with password{" "}
            <code style={{ color: "#e5a609", background: "#131a23", padding: "1px 4px", borderRadius: "3px" }}>
              Admin@123
            </code>.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
