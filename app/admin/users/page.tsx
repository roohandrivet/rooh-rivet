"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Crown,
  Mail,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type AdminRecord = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  active: boolean;
  created_at: string;
  updated_at: string | null;
};

type AdminForm = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
};

const EMPTY_FORM: AdminForm = {
  userId: "",
  email: "",
  fullName: "",
  role: "admin",
  active: true,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function formatRole(role: string): string {
  return role
    .split("_")
    .map((word) => {
      return (
        word.charAt(0).toUpperCase() +
        word.slice(1)
      );
    })
    .join(" ");
}

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<
    AdminRecord[]
  >([]);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">(
      "all"
    );

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);
  const [editingAdmin, setEditingAdmin] =
    useState<AdminRecord | null>(null);
  const [form, setForm] =
    useState<AdminForm>(EMPTY_FORM);

  const fetchAdmins = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setCurrentUserId(user?.id ?? null);

        const {
          data,
          error: fetchError,
        } = await supabase
          .from("admins")
          .select(
            "id, user_id, email, full_name, role, active, created_at, updated_at"
          )
          .order("created_at", {
            ascending: false,
          });

        if (fetchError) {
          throw fetchError;
        }

        setAdmins(
          (data ?? []) as AdminRecord[]
        );
      } catch (fetchError) {
        setAdmins([]);
        setError(
          getErrorMessage(fetchError)
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timeout = window.setTimeout(
      () => {
        setSuccess("");
      },
      4000
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [success]);

  const filteredAdmins = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return admins.filter((admin) => {
      const matchesSearch =
        !normalizedSearch ||
        admin.email
          .toLowerCase()
          .includes(normalizedSearch) ||
        (admin.full_name ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        admin.role
          .toLowerCase()
          .includes(normalizedSearch) ||
        admin.user_id
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          admin.active) ||
        (statusFilter === "inactive" &&
          !admin.active);

      return (
        matchesSearch && matchesStatus
      );
    });
  }, [admins, search, statusFilter]);

  const activeCount = useMemo(() => {
    return admins.filter(
      (admin) => admin.active
    ).length;
  }, [admins]);

  const inactiveCount = useMemo(() => {
    return admins.filter(
      (admin) => !admin.active
    ).length;
  }, [admins]);

  const superAdminCount = useMemo(() => {
    return admins.filter((admin) => {
      return (
        admin.role.toLowerCase() ===
        "super_admin"
      );
    }).length;
  }, [admins]);

  function updateFormField<
    Key extends keyof AdminForm
  >(
    field: Key,
    value: AdminForm[Key]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function openCreateModal() {
    setEditingAdmin(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(
    admin: AdminRecord
  ) {
    setEditingAdmin(admin);
    setForm({
      userId: admin.user_id,
      email: admin.email,
      fullName: admin.full_name ?? "",
      role: admin.role,
      active: admin.active,
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingAdmin(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedUserId =
      form.userId.trim();
    const normalizedEmail = form.email
      .trim()
      .toLowerCase();
    const normalizedFullName =
      form.fullName.trim();
    const normalizedRole =
      form.role.trim();

    if (!normalizedUserId) {
      setError(
        "Supabase User ID is required."
      );
      return;
    }

    if (!normalizedEmail) {
      setError(
        "Admin email address is required."
      );
      return;
    }

    if (!normalizedFullName) {
      setError(
        "Administrator name is required."
      );
      return;
    }

    if (!normalizedRole) {
      setError(
        "Administrator role is required."
      );
      return;
    }

    if (
      editingAdmin?.user_id ===
        currentUserId &&
      !form.active
    ) {
      setError(
        "You cannot deactivate your own administrator account."
      );
      return;
    }

    setSaving(true);

    try {
      if (editingAdmin) {
        const {
          data,
          error: updateError,
        } = await supabase
          .from("admins")
          .update({
            user_id: normalizedUserId,
            email: normalizedEmail,
            full_name:
              normalizedFullName,
            role: normalizedRole,
            active: form.active,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", editingAdmin.id)
          .select(
            "id, user_id, email, full_name, role, active, created_at, updated_at"
          )
          .single();

        if (updateError) {
          throw updateError;
        }

        const updatedAdmin =
          data as AdminRecord;

        setAdmins((previous) => {
          return previous.map((admin) => {
            return admin.id ===
              updatedAdmin.id
              ? updatedAdmin
              : admin;
          });
        });

        setSuccess(
          "Administrator updated successfully."
        );
      } else {
        const {
          data,
          error: insertError,
        } = await supabase
          .from("admins")
          .insert({
            user_id: normalizedUserId,
            email: normalizedEmail,
            full_name:
              normalizedFullName,
            role: normalizedRole,
            active: form.active,
          })
          .select(
            "id, user_id, email, full_name, role, active, created_at, updated_at"
          )
          .single();

        if (insertError) {
          throw insertError;
        }

        const createdAdmin =
          data as AdminRecord;

        setAdmins((previous) => [
          createdAdmin,
          ...previous,
        ]);

        setSuccess(
          "Administrator added successfully."
        );
      }

      setModalOpen(false);
      setEditingAdmin(null);
      setForm(EMPTY_FORM);
    } catch (saveError) {
      const message =
        getErrorMessage(saveError);

      if (
        message
          .toLowerCase()
          .includes("duplicate")
      ) {
        setError(
          "An administrator with this email or Supabase User ID already exists."
        );
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    admin: AdminRecord
  ) {
    if (
      admin.user_id === currentUserId
    ) {
      setError(
        "You cannot remove your own administrator account."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Remove ${
          admin.full_name || admin.email
        } from the admin portal?`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(admin.id);
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } =
        await supabase
          .from("admins")
          .delete()
          .eq("id", admin.id);

      if (deleteError) {
        throw deleteError;
      }

      setAdmins((previous) => {
        return previous.filter(
          (item) =>
            item.id !== admin.id
        );
      });

      setSuccess(
        "Administrator removed successfully."
      );
    } catch (deleteError) {
      setError(
        getErrorMessage(deleteError)
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleAdminStatus(
    admin: AdminRecord
  ) {
    if (
      admin.user_id === currentUserId &&
      admin.active
    ) {
      setError(
        "You cannot deactivate your own administrator account."
      );
      return;
    }

    setError("");
    setSuccess("");

    try {
      const newStatus = !admin.active;

      const {
        data,
        error: updateError,
      } = await supabase
        .from("admins")
        .update({
          active: newStatus,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", admin.id)
        .select(
          "id, user_id, email, full_name, role, active, created_at, updated_at"
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedAdmin =
        data as AdminRecord;

      setAdmins((previous) => {
        return previous.map((item) => {
          return item.id ===
            updatedAdmin.id
            ? updatedAdmin
            : item;
        });
      });

      setSuccess(
        newStatus
          ? "Administrator activated successfully."
          : "Administrator deactivated successfully."
      );
    } catch (updateError) {
      setError(
        getErrorMessage(updateError)
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9A7765]">
              Rooh &amp; Rivet Admin
            </p>

            <h1 className="mt-3 font-serif text-4xl text-[#4B2E2E] sm:text-5xl">
              Admin Users
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#7A6464] sm:text-base">
              Add, manage and remove
              authorised administrators for
              the Rooh &amp; Rivet admin
              portal.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                void fetchAdmins()
              }
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCCEC4] bg-white px-5 py-3 text-sm font-semibold text-[#5A2D2D] transition hover:bg-[#F5EEE8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5A2D2D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#482323]"
            >
              <UserPlus size={18} />
              Add Administrator
            </button>
          </div>
        </section>

        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0"
            />
            <p>{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />
            <p>{success}</p>
          </div>
        ) : null}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-[#E9DED6] bg-white p-6 shadow-[0_16px_50px_rgba(75,46,46,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B7469]">
                  Total Admins
                </p>

                <p className="mt-2 font-serif text-3xl text-[#4B2E2E]">
                  {admins.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2EAE4] text-[#5A2D2D]">
                <Users size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E9DED6] bg-white p-6 shadow-[0_16px_50px_rgba(75,46,46,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B7469]">
                  Active
                </p>

                <p className="mt-2 font-serif text-3xl text-[#4B2E2E]">
                  {activeCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <UserCheck size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E9DED6] bg-white p-6 shadow-[0_16px_50px_rgba(75,46,46,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B7469]">
                  Inactive
                </p>

                <p className="mt-2 font-serif text-3xl text-[#4B2E2E]">
                  {inactiveCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                <UserX size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E9DED6] bg-white p-6 shadow-[0_16px_50px_rgba(75,46,46,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B7469]">
                  Super Admins
                </p>

                <p className="mt-2 font-serif text-3xl text-[#4B2E2E]">
                  {superAdminCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Crown size={22} />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-[#E9DED6] bg-white p-5 shadow-[0_16px_50px_rgba(75,46,46,0.05)]">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A8479]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by name, email, role or user ID..."
                className="w-full rounded-2xl border border-[#E2D6CD] bg-[#FCFAF8] py-3 pl-12 pr-4 text-sm text-[#4B2E2E] outline-none transition placeholder:text-[#AA958A] focus:border-[#8B6B5B] focus:ring-2 focus:ring-[#8B6B5B]/10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                const value =
                  event.target.value;

                if (
                  value === "all" ||
                  value === "active" ||
                  value === "inactive"
                ) {
                  setStatusFilter(value);
                }
              }}
              className="rounded-2xl border border-[#E2D6CD] bg-[#FCFAF8] px-4 py-3 text-sm text-[#4B2E2E] outline-none transition focus:border-[#8B6B5B] focus:ring-2 focus:ring-[#8B6B5B]/10 md:min-w-48"
            >
              <option value="all">
                All administrators
              </option>
              <option value="active">
                Active only
              </option>
              <option value="inactive">
                Inactive only
              </option>
            </select>
          </div>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-[#E9DED6] bg-white px-6 py-20 text-center shadow-[0_16px_50px_rgba(75,46,46,0.05)]">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#E7DCD4] border-t-[#5A2D2D]" />

            <p className="mt-5 text-sm text-[#7A6464]">
              Loading administrators...
            </p>
          </section>
        ) : filteredAdmins.length === 0 ? (
          <section className="rounded-3xl border border-[#E9DED6] bg-white px-6 py-20 text-center shadow-[0_16px_50px_rgba(75,46,46,0.05)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F3ECE7] text-[#5A2D2D]">
              <ShieldCheck size={28} />
            </div>

            <h2 className="mt-5 font-serif text-2xl text-[#4B2E2E]">
              No administrators found
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#7A6464]">
              Add an administrator or adjust
              the current search and status
              filters.
            </p>
          </section>
        ) : (
          <>
            <section className="hidden overflow-hidden rounded-3xl border border-[#E9DED6] bg-white shadow-[0_16px_50px_rgba(75,46,46,0.05)] lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#F5EFEA]">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#7D6257]">
                      <th className="px-6 py-5">
                        Administrator
                      </th>
                      <th className="px-6 py-5">
                        Role
                      </th>
                      <th className="px-6 py-5">
                        Status
                      </th>
                      <th className="px-6 py-5">
                        Added
                      </th>
                      <th className="px-6 py-5 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#F0E7E1]">
                    {filteredAdmins.map(
                      (admin) => {
                        const isCurrentAdmin =
                          admin.user_id ===
                          currentUserId;

                        return (
                          <tr
                            key={admin.id}
                            className="transition hover:bg-[#FCFAF8]"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F0E6DF] font-serif text-lg font-semibold text-[#5A2D2D]">
                                  {(
                                    admin.full_name ||
                                    admin.email
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate font-semibold text-[#4B2E2E]">
                                      {admin.full_name ||
                                        "Unnamed administrator"}
                                    </p>

                                    {isCurrentAdmin ? (
                                      <span className="rounded-full bg-[#5A2D2D] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                                        You
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="mt-1 flex items-center gap-2 text-sm text-[#806A60]">
                                    <Mail
                                      size={14}
                                    />
                                    <span className="truncate">
                                      {
                                        admin.email
                                      }
                                    </span>
                                  </div>

                                  <p className="mt-1 max-w-xs truncate font-mono text-[11px] text-[#AA958A]">
                                    {
                                      admin.user_id
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <span className="inline-flex items-center gap-2 rounded-full bg-[#F2E9E3] px-3 py-1.5 text-xs font-semibold text-[#5A2D2D]">
                                <ShieldCheck
                                  size={14}
                                />
                                {formatRole(
                                  admin.role
                                )}
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <button
                                type="button"
                                onClick={() =>
                                  void toggleAdminStatus(
                                    admin
                                  )
                                }
                                disabled={
                                  isCurrentAdmin &&
                                  admin.active
                                }
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                  admin.active
                                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                                    : "bg-red-50 text-red-700 hover:bg-red-100"
                                }`}
                              >
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    admin.active
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                />

                                {admin.active
                                  ? "Active"
                                  : "Inactive"}
                              </button>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2 text-sm text-[#806A60]">
                                <CalendarDays
                                  size={15}
                                />
                                {formatDate(
                                  admin.created_at
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      admin
                                    )
                                  }
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDD0C7] text-[#5A2D2D] transition hover:bg-[#F2E9E3]"
                                  aria-label={`Edit ${admin.email}`}
                                >
                                  <Pencil
                                    size={17}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDelete(
                                      admin
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                      admin.id ||
                                    isCurrentAdmin
                                  }
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label={`Remove ${admin.email}`}
                                >
                                  {deletingId ===
                                  admin.id ? (
                                    <RefreshCw
                                      size={
                                        17
                                      }
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2
                                      size={
                                        17
                                      }
                                    />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-4 lg:hidden">
              {filteredAdmins.map(
                (admin) => {
                  const isCurrentAdmin =
                    admin.user_id ===
                    currentUserId;

                  return (
                    <article
                      key={admin.id}
                      className="rounded-3xl border border-[#E9DED6] bg-white p-5 shadow-[0_16px_50px_rgba(75,46,46,0.05)]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F0E6DF] font-serif text-xl font-semibold text-[#5A2D2D]">
                          {(
                            admin.full_name ||
                            admin.email
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold text-[#4B2E2E]">
                              {admin.full_name ||
                                "Unnamed administrator"}
                            </h2>

                            {isCurrentAdmin ? (
                              <span className="rounded-full bg-[#5A2D2D] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                                You
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 break-all text-sm text-[#806A60]">
                            {admin.email}
                          </p>

                          <p className="mt-2 break-all font-mono text-[11px] text-[#AA958A]">
                            {admin.user_id}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-[#F8F4EF] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9A8479]">
                            Role
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#5A2D2D]">
                            {formatRole(
                              admin.role
                            )}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#F8F4EF] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9A8479]">
                            Added
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#5A2D2D]">
                            {formatDate(
                              admin.created_at
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            void toggleAdminStatus(
                              admin
                            )
                          }
                          disabled={
                            isCurrentAdmin &&
                            admin.active
                          }
                          className={`rounded-full px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                            admin.active
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {admin.active
                            ? "Active"
                            : "Inactive"}
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                admin
                              )
                            }
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDD0C7] text-[#5A2D2D]"
                            aria-label={`Edit ${admin.email}`}
                          >
                            <Pencil
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(
                                admin
                              )
                            }
                            disabled={
                              deletingId ===
                                admin.id ||
                              isCurrentAdmin
                            }
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Remove ${admin.email}`}
                          >
                            {deletingId ===
                            admin.id ? (
                              <RefreshCw
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={17}
                              />
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </section>
          </>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A1717]/60 px-4 py-8 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
            className="max-h-full w-full max-w-xl overflow-y-auto rounded-[32px] border border-[#E8DDD4] bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[#EEE5DE] px-6 py-5 sm:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9A7765]">
                  Rooh &amp; Rivet
                </p>

                <h2
                  id="admin-modal-title"
                  className="mt-2 font-serif text-3xl text-[#4B2E2E]"
                >
                  {editingAdmin
                    ? "Edit Administrator"
                    : "Add Administrator"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#7A6464] transition hover:bg-[#F3ECE7] hover:text-[#4B2E2E] disabled:opacity-50"
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 px-6 py-6 sm:px-8 sm:py-8"
            >
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
                The administrator must already
                exist in Supabase Authentication.
                Copy their User ID from Supabase
                Dashboard → Authentication →
                Users.
              </div>

              <div>
                <label
                  htmlFor="admin-user-id"
                  className="mb-2 block text-sm font-semibold text-[#4B2E2E]"
                >
                  Supabase User ID
                </label>

                <input
                  id="admin-user-id"
                  type="text"
                  required
                  value={form.userId}
                  onChange={(event) =>
                    updateFormField(
                      "userId",
                      event.target.value
                    )
                  }
                  placeholder="Enter the authentication user UUID"
                  className="w-full rounded-2xl border border-[#DED0C5] bg-[#FCFAF8] px-4 py-3.5 font-mono text-sm text-[#4B2E2E] outline-none transition placeholder:font-sans placeholder:text-[#AE9B90] focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-full-name"
                  className="mb-2 block text-sm font-semibold text-[#4B2E2E]"
                >
                  Full Name
                </label>

                <input
                  id="admin-full-name"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(event) =>
                    updateFormField(
                      "fullName",
                      event.target.value
                    )
                  }
                  placeholder="Administrator full name"
                  className="w-full rounded-2xl border border-[#DED0C5] bg-[#FCFAF8] px-4 py-3.5 text-sm text-[#4B2E2E] outline-none transition placeholder:text-[#AE9B90] focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-semibold text-[#4B2E2E]"
                >
                  Email Address
                </label>

                <input
                  id="admin-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    updateFormField(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="admin@example.com"
                  className="w-full rounded-2xl border border-[#DED0C5] bg-[#FCFAF8] px-4 py-3.5 text-sm text-[#4B2E2E] outline-none transition placeholder:text-[#AE9B90] focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-role"
                  className="mb-2 block text-sm font-semibold text-[#4B2E2E]"
                >
                  Role
                </label>

                <select
                  id="admin-role"
                  value={form.role}
                  onChange={(event) =>
                    updateFormField(
                      "role",
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-[#DED0C5] bg-[#FCFAF8] px-4 py-3.5 text-sm text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
                >
                  <option value="super_admin">
                    Super Admin
                  </option>
                  <option value="admin">
                    Admin
                  </option>
                  <option value="editor">
                    Editor
                  </option>
                </select>
              </div>

              <div className="rounded-2xl border border-[#E5D9D0] bg-[#FCFAF8] p-4">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#4B2E2E]">
                      Active access
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#806A60]">
                      Inactive administrators
                      cannot enter the admin
                      portal.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.active}
                    disabled={
                      editingAdmin?.user_id ===
                      currentUserId
                    }
                    onChange={(event) =>
                      updateFormField(
                        "active",
                        event.target.checked
                      )
                    }
                    className="h-5 w-5 rounded border-[#CDBCB0] accent-[#5A2D2D]"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#EEE5DE] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-2xl border border-[#DCCEC4] px-5 py-3 text-sm font-semibold text-[#5A2D2D] transition hover:bg-[#F5EEE8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5A2D2D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#482323] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : editingAdmin ? (
                    <>
                      <Pencil size={17} />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Add Administrator
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}