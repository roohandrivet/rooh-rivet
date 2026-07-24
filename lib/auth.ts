import { supabase } from "@/lib/supabase";

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
}

export async function signIn(
  email: string,
  password: string
) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function isAdmin(
  userId?: string | null
): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const { data, error } = await supabase
    .from("admins")
    .select("role, active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!data;
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authenticated: false,
      authorized: false,
      user: null,
      admin: null,
    };
  }

  const { data: admin, error } = await supabase
    .from("admins")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    authenticated: true,
    authorized: !!admin,
    user,
    admin,
  };
}