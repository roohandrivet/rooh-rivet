import { supabase } from "@/lib/supabase";

import { ADMIN_EMAILS } from "@/lib/admin";

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

export function isAdmin(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  return ADMIN_EMAILS.some(
    (adminEmail) =>
      adminEmail.toLowerCase() ===
      email.toLowerCase()
  );
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authenticated: false,
      authorized: false,
      user: null,
    };
  }

  const authorized = isAdmin(user.email);

  return {
    authenticated: true,
    authorized,
    user,
  };
}