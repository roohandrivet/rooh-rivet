import AdminStats from "@/components/AdminStats";
import AdminRecentOrders from "@/components/AdminRecentOrders";
import AdminLowStock from "@/components/AdminLowStock";
import AdminQuickActions from "@/components/AdminQuickActions";

export default function AdminPage() {
  return (
    <div>
      <div>
        <h1 className="font-serif text-5xl text-[#5A2D2D]">
          Dashboard
        </h1>

        <p className="mt-2 text-[#8B6B5B]">
          Welcome back to Rooh & Rivet.
        </p>
      </div>

      <div className="mt-10">
        <AdminStats />
      </div>

      <div className="mt-10">
        <AdminRecentOrders />
      </div>

      <div className="mt-10">
        <AdminLowStock />
      </div>

      <div className="mt-10">
        <AdminQuickActions />
      </div>
    </div>
  );
}