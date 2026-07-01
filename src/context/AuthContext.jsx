import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] =
    useState(null);

  const [user, setUser] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(false);

  const loadProfile = useCallback(
    async (userId) => {
      if (!userId) {
        setProfile(null);
        setProfileLoading(false);
        return null;
      }

      setProfileLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .from("profiles")
          .select(
            `
              id,
              email,
              full_name,
              plan,
              subscription_status,
              current_period_end,
              created_at,
              updated_at
            `
          )
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        setProfile(data ?? null);

        return data ?? null;
      } catch (error) {
        console.error(
          "Unable to load user profile:",
          error
        );

        setProfile(null);

        return null;
      } finally {
        setProfileLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const {
        data: { session },
        error,
      } =
        await supabase.auth.getSession();

      if (error) {
        console.error(
          "Unable to load Supabase session:",
          error.message
        );
      }

      if (isMounted) {
        setSession(session);
        setUser(
          session?.user ?? null
        );
        setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession);
          setUser(
            newSession?.user ?? null
          );
          setLoading(false);
        }
      );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    loadProfile(user.id);
  }, [
    user?.id,
    loadProfile,
  ]);

  async function signUp({
    fullName,
    email,
    password,
  }) {
    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo:
          window.location.origin,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signIn({
    email,
    password,
  }) {
    const {
      data,
      error,
    } =
      await supabase.auth
        .signInWithPassword({
          email,
          password,
        });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signInWithGoogle() {
    const {
      data,
      error,
    } =
      await supabase.auth
        .signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              window.location.origin,
          },
        });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signOut() {
    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setProfile(null);
  }

  async function refreshProfile() {
    if (!user?.id) {
      return null;
    }

    return loadProfile(user.id);
  }

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      profileLoading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      loading,
      profileLoading,
      loadProfile,
    ]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}