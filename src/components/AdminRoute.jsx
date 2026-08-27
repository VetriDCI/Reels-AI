import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function AdminRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;
    async function check() {
      if (authLoading) return;
      if (sessionStorage.getItem("reelsra_demo_admin") === "1") {
        if (alive) { setAllowed(true); setChecking(false); }
        return;
      }
      if (!user || !supabase) {
        if (alive) { setAllowed(false); setChecking(false); }
        return;
      }

      // Optional bootstrap email. This is only a UI gate; keep real admin
      // permissions in Supabase RLS using the profiles.role column.
      const configuredAdmin = (import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase();
      if (configuredAdmin && user.email?.toLowerCase() === configuredAdmin) {
        if (alive) { setAllowed(true); setChecking(false); }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (alive) {
        setAllowed(!error && data?.role === "admin");
        setChecking(false);
      }
    }
    check();
    return () => { alive = false; };
  }, [user, authLoading]);

  if (authLoading || checking) {
    return <main className="auth"><p>Checking admin access...</p></main>;
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (!allowed) return <Navigate to="/app" replace />;
  return children;
}
