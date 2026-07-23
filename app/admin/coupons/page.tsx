"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order: number | null;
  expiry_date: string | null;
  maximum_uses: number | null;
  usage_count: number;
  active: boolean;
  created_at?: string;
}

interface CouponForm {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  minimum_order: string;
  expiry_date: string;
  maximum_uses: string;
  active: boolean;
}

const initialForm: CouponForm = {
  code: "",
  discount_type: "percentage",
  discount_value: "",
  minimum_order: "",
  expiry_date: "",
  maximum_uses: "",
  active: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(initialForm);

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCoupons((data ?? []) as Coupon[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  }

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) =>
      coupon.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [coupons, search]);

  function openCreate() {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      minimum_order:
        coupon.minimum_order !== null ? String(coupon.minimum_order) : "",
      expiry_date: coupon.expiry_date
        ? coupon.expiry_date.slice(0, 10)
        : "",
      maximum_uses:
        coupon.maximum_uses !== null ? String(coupon.maximum_uses) : "",
      active: coupon.active,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(initialForm);
  }

  async function saveCoupon() {
    if (!form.code.trim()) {
      alert("Coupon code is required.");
      return;
    }

    if (!form.discount_value.trim()) {
      alert("Discount value is required.");
      return;
    }

    setSaving(true);

    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      minimum_order: form.minimum_order
        ? Number(form.minimum_order)
        : null,
      expiry_date: form.expiry_date || null,
      maximum_uses: form.maximum_uses
        ? Number(form.maximum_uses)
        : null,
      active: form.active,
    };

    try {
      if (editing) {
        const { data, error } = await supabase
          .from("coupons")
          .update(payload)
          .eq("id", editing.id)
          .select()
          .single();

        if (error) throw error;

        setCoupons((prev) =>
          prev.map((coupon) =>
            coupon.id === editing.id ? (data as Coupon) : coupon
          )
        );
      } else {
        const { data, error } = await supabase
          .from("coupons")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        setCoupons((prev) => [data as Coupon, ...prev]);
      }

      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleCoupon(coupon: Coupon) {
    const previous = [...coupons];

    setCoupons((prev) =>
      prev.map((item) =>
        item.id === coupon.id
          ? { ...item, active: !item.active }
          : item
      )
    );

    const { error } = await supabase
      .from("coupons")
      .update({ active: !coupon.active })
      .eq("id", coupon.id);

    if (error) {
      setCoupons(previous);
      alert(error.message);
    }
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Delete this coupon?")) return;

    const previous = [...coupons];
    setCoupons((prev) => prev.filter((coupon) => coupon.id !== id));

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", id);

    if (error) {
      setCoupons(previous);
      alert(error.message);
    }
  }

  function getStatus(coupon: Coupon) {
    if (!coupon.active) return "Disabled";

    if (
      coupon.expiry_date &&
      new Date(coupon.expiry_date) < new Date()
    ) {
      return "Expired";
    }

    return "Active";
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-serif text-[#4B2E2E]">
            Coupons
          </h1>
          <p className="mt-1 text-[#8B6B5B]">
            Manage discount codes.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="rounded-xl bg-[#4B2E2E] px-5 py-3 text-white transition hover:bg-[#3b2323]"
        >
          Create Coupon
        </button>
      </div>

      <div className="rounded-2xl border border-[#E8DDD3] bg-white p-5 shadow-sm">
        <input
          type="text"
          placeholder="Search coupon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#DDD] px-4 py-3 outline-none focus:border-[#4B2E2E]"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          Loading coupons...
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 p-10 text-center text-red-600">
          {error}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          No coupons found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-[#F8F4EF]">
              <tr className="text-left text-sm text-[#4B2E2E]">
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Discount Type</th>
                <th className="px-5 py-4">Discount Value</th>
                <th className="px-5 py-4">Minimum Order</th>
                <th className="px-5 py-4">Expiry Date</th>
                <th className="px-5 py-4">Usage Count</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCoupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className="border-t border-[#EEE]"
                >
                  <td className="px-5 py-4 font-medium">
                    {coupon.code}
                  </td>

                  <td className="px-5 py-4 capitalize">
                    {coupon.discount_type === "percentage"
                      ? "Percentage"
                      : "Fixed"}
                  </td>

                  <td className="px-5 py-4">
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%`
                      : `₹${coupon.discount_value}`}
                  </td>

                  <td className="px-5 py-4">
                    ₹{coupon.minimum_order ?? 0}
                  </td>

                  <td className="px-5 py-4">
                    {coupon.expiry_date
                      ? new Date(
                          coupon.expiry_date
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-5 py-4">
                    {coupon.usage_count}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#F4ECE5] px-3 py-1 text-xs">
                      {getStatus(coupon)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEdit(coupon)}
                        className="rounded-lg border px-3 py-1 text-sm"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => toggleCoupon(coupon)}
                        className="rounded-lg border px-3 py-1 text-sm"
                      >
                        {coupon.active ? "Disable" : "Enable"}
                      </button>

                      <button
                        onClick={() => deleteCoupon(coupon.id)}
                        className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8">
            <h2 className="mb-6 text-2xl font-serif text-[#4B2E2E]">
              {editing ? "Edit Coupon" : "Create Coupon"}
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <input
                type="text"
                placeholder="Coupon Code"
                value={form.code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="rounded-xl border p-3"
              />

              <select
                value={form.discount_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discount_type: e.target.value as
                      | "percentage"
                      | "fixed",
                  })
                }
                className="rounded-xl border p-3"
              >
                <option value="percentage">
                  Percentage
                </option>
                <option value="fixed">Fixed</option>
              </select>

              <input
                type="number"
                placeholder="Discount Value"
                value={form.discount_value}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discount_value: e.target.value,
                  })
                }
                className="rounded-xl border p-3"
              />

              <input
                type="number"
                placeholder="Minimum Order Amount"
                value={form.minimum_order}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minimum_order: e.target.value,
                  })
                }
                className="rounded-xl border p-3"
              />

              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    expiry_date: e.target.value,
                  })
                }
                className="rounded-xl border p-3"
              />

              <input
                type="number"
                placeholder="Maximum Uses"
                value={form.maximum_uses}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maximum_uses: e.target.value,
                  })
                }
                className="rounded-xl border p-3"
              />

              <label className="flex items-center gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      active: e.target.checked,
                    })
                  }
                />
                Active
              </label>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-xl border px-5 py-3"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                onClick={saveCoupon}
                className="rounded-xl bg-[#4B2E2E] px-5 py-3 text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}