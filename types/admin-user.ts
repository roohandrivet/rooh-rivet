export type AdminRole = "admin" | "user";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AdminRole;
  created_at: string;
  last_sign_in_at: string | null;
}