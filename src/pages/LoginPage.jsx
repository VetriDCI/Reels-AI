import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth, DEMO_USER } from "../context/AuthContext";

export default function Login() {
  const n = useNavigate();
  const { loginAsDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [e, setE] = useState("");
  const [loading, setLoading] = useState(false);

  async function go(x) {
    x.preventDefault();
    if (loading) return;
    setE("");

    const typedEmail = email.trim().toLowerCase();
    const typedPassword = password.trim();

    // Demo user bypass — works with no Supabase setup at all.
    if (typedEmail === DEMO_USER.email && typedPassword === DEMO_USER.password) {
      loginAsDemo();
      n("/feed");
      return;
    }

    if (!email.trim() || !password) {
      return setE("Email & password fill pannu da");
    }

    if (!supabase) {
      return setE("Supabase keys missing. Demo account use pannu (keezha kudutha irukku), illa Render Environment la VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY add pannu.");
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) throw error;
      n("/feed");
    } catch (err) {
      console.error(err);
      if (err.status === 429 || err.message?.toLowerCase().includes('too many') || err.message?.includes('429')) {
        setE("Too many requests (429) - 5 nimisham wait pannu, apram try pannu da");
      } else if (err.message?.includes('Invalid login credentials')) {
        setE("Invalid email or password. New user na Create account click pannu, illa keezha kudutha Demo account use pannu.");
      } else if (err.message?.includes('Email not confirmed')) {
        setE("Email confirm pannala. Mail la link click pannu.");
      } else {
        setE(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <form onSubmit={go}>
        <h1>Reels RA</h1>
        <h2>Log in</h2>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={x => setEmail(x.target.value)}
          required
          autoComplete="email"
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={x => setPassword(x.target.value)}
          required
          minLength={6}
          autoComplete="current-password"
        />
        {e && <p style={{color:'red', background:'#ffe6e6', padding:8, borderRadius:8}}>{e}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : 'Log in'}
        </button>
        <div style={{ marginTop: 4, padding: 12, border: "1px solid #ddd", borderRadius: 10, fontSize: 13 }}>
          <strong>Demo Account (Supabase illama test pannalam)</strong><br/>
          Email: <code>{DEMO_USER.email}</code><br/>
          Password: <code>{DEMO_USER.password}</code>
        </div>
        <Link to="/register">Create account</Link>
        <Link to="/forgot-password">Forgot password?</Link>
        <Link to="/admin/login" style={{marginTop:8,fontWeight:600}}>Admin Login</Link>
      </form>
    </main>
  );
}
