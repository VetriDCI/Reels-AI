import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const C = createContext();

// Demo user: lets /login work without a real Supabase account.
// Purely local (sessionStorage) — never touches the database.
export const DEMO_USER = {
  email: "demo@reelsra.demo",
  password: "Demo@12345"
};

const DEMO_KEY = "reelsra_demo_user";

function fakeSessionFromDemo() {
  return {
    user: {
      id: "demo-user-0000-0000-0000-000000000000",
      email: DEMO_USER.email
    }
  };
}

function fakeProfileFromDemo() {
  return {
    id: "demo-user-0000-0000-0000-000000000000",
    username: "demo_creator",
    display_name: "Demo Creator",
    avatar_url: null,
    role: "user"
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const load = async (id) => {
    if (!supabase) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    setProfile(data);
  };

  useEffect(() => {
    // Demo user bypass — checked first, works even without Supabase configured.
    if (sessionStorage.getItem(DEMO_KEY) === "1") {
      setSession(fakeSessionFromDemo());
      setProfile(fakeProfileFromDemo());
      setIsDemo(true);
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) load(data.session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (s) load(s.user.id);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loginAsDemo = () => {
    sessionStorage.setItem(DEMO_KEY, "1");
    setSession(fakeSessionFromDemo());
    setProfile(fakeProfileFromDemo());
    setIsDemo(true);
  };

  const logout = async () => {
    if (isDemo) {
      sessionStorage.removeItem(DEMO_KEY);
      setSession(null);
      setProfile(null);
      setIsDemo(false);
      return;
    }
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <C.Provider value={{
      user: session?.user,
      profile,
      loading,
      isDemo,
      loginAsDemo,
      logout,
      refreshProfile: () => session?.user?.id && !isDemo && load(session.user.id)
    }}>
      {children}
    </C.Provider>
  );
}

export const useAuth = () => useContext(C);
