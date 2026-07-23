
import {
    TrendingUp,
    ShoppingBag,
    IndianRupee,
    Users,
  } from "lucide-react";
  
  export default function AnalyticsPage() {
    const stats = [
      {
        title: "Total Revenue",
        value: "₹2,45,800",
        icon: IndianRupee,
      },
      {
        title: "Orders",
        value: "184",
        icon: ShoppingBag,
      },
      {
        title: "Customers",
        value: "126",
        icon: Users,
      },
      {
        title: "Growth",
        value: "+18%",
        icon: TrendingUp,
      },
    ];
  
    return (
      <div className="space-y-10">
  
        <div>
  
          <h1 className="font-serif text-5xl text-[#5A2D2D]">
            Analytics
          </h1>
  
          <p className="mt-2 text-[#8B6B5B]">
            Track your store's performance.
          </p>
  
        </div>
  
        {/* Stats */}
  
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
  
          {stats.map((stat) => {
            const Icon = stat.icon;
  
            return (
  
              <div
                key={stat.title}
                className="rounded-3xl border border-[#E8DDD3] bg-white p-8 shadow-sm"
              >
  
                <div className="flex items-center justify-between">
  
                  <div>
  
                    <p className="text-[#8B6B5B]">
                      {stat.title}
                    </p>
  
                    <h2 className="mt-3 text-4xl font-serif text-[#5A2D2D]">
                      {stat.value}
                    </h2>
  
                  </div>
  
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F4EF]">
  
                    <Icon
                      size={30}
                      className="text-[#5A2D2D]"
                    />
  
                  </div>
  
                </div>
  
              </div>
  
            );
          })}
  
        </div>
  
        {/* Revenue Chart Placeholder */}
  
        <div className="rounded-3xl border border-[#E8DDD3] bg-white p-10 shadow-sm">
  
          <h2 className="font-serif text-3xl text-[#5A2D2D]">
            Revenue Overview
          </h2>
  
          <div className="mt-8 flex h-80 items-center justify-center rounded-2xl border-2 border-dashed border-[#E8DDD3] bg-[#FCFAF8]">
  
            <p className="text-[#8B6B5B]">
              Sales chart will appear here.
            </p>
  
          </div>
  
        </div>
  
        {/* Best Sellers */}
  
        <div className="rounded-3xl border border-[#E8DDD3] bg-white p-10 shadow-sm">
  
          <h2 className="font-serif text-3xl text-[#5A2D2D]">
            Best Selling Products
          </h2>
  
          <div className="mt-8 space-y-5">
  
            <div className="flex items-center justify-between border-b border-[#F0E6DE] pb-4">
  
              <span className="text-[#5A2D2D]">
                Emerald Necklace
              </span>
  
              <span className="font-semibold text-[#5A2D2D]">
                42 Sold
              </span>
  
            </div>
  
            <div className="flex items-center justify-between border-b border-[#F0E6DE] pb-4">
  
              <span className="text-[#5A2D2D]">
                Pearl Earrings
              </span>
  
              <span className="font-semibold text-[#5A2D2D]">
                37 Sold
              </span>
  
            </div>
  
            <div className="flex items-center justify-between">
  
              <span className="text-[#5A2D2D]">
                Diamond Bracelet
              </span>
  
              <span className="font-semibold text-[#5A2D2D]">
                31 Sold
              </span>
  
            </div>
  
          </div>
  
        </div>
  
      </div>
    );
  }