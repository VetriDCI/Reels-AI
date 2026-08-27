import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../lib/supabase";

const DEMO_ADMIN = {
  name: "Admin Demo",
  email: "admin@reelsra.demo",
  password: "Admin@12345"
};

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErrorText("");
    // Demo account is intentionally local-only for testing the Admin UI.
    if (email.trim().toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
      sessionStorage.setItem("reelsra_demo_admin", "1");
      navigate("/admin", { replace: true });
      return;
    }
    if (!supabase) {
      setErrorText("Supabase configuration is missing. Use the Demo Admin account below, or add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Render.");
      return;
    }
    if (!email.trim() || !password) {
      setErrorText("Enter admin email and password.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) throw error;

      const configuredAdmin = (import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase();
      let isAdmin = !!configuredAdmin && data.user?.email?.toLowerCase() === configuredAdmin;

      if (!isAdmin && data.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        if (!profileError && profile?.role === "admin") isAdmin = true;
      }

      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account is not an admin account. Set profiles.role = 'admin' for this user.");
      }

      navigate(location.state?.from || "/admin", { replace: true });
    } catch (err) {
      setErrorText(err?.message || "Admin login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <form onSubmit={submit}>
        <h1>Reels RA</h1>
        <h2>Admin Login</h2>
        <input
          placeholder="Admin email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          minLength={6}
          required
        />
        {errorText && (
          <p style={{ color: "#b00020", background: "#ffe6e6", padding: 10, borderRadius: 8 }}>
            {errorText}
          </p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Admin Login"}
        </button>
        <div style={{ marginTop: 14, padding: 12, border: "1px solid #ddd", borderRadius: 10, fontSize: 13 }}>
          <strong>Demo Admin Account</strong><br/>
          Name: {DEMO_ADMIN.name}<br/>
          Email: <code>{DEMO_ADMIN.email}</code><br/>
          Password: <code>{DEMO_ADMIN.password}</code>
        </div>
        <Link to="/login">Back to user login</Link>
      </form>
    </main>
  );
}
