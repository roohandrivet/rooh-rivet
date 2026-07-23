"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  featured: boolean;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: PageProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [product, setProduct] = useState<Product>({
    id: "",
    name: "",
    description: "",
    price: 0,
    image: "",
    category: "",
    stock: 0,
    featured: false,
  });

  async function loadProduct() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setProduct(data);
    setLoading(false);
  }

  useEffect(() => {
    loadProduct();
  }, []);
  async function uploadImage(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("products")
      .getPublicUrl(fileName);

    setProduct((prev) => ({
      ...prev,
      image: publicUrl,
    }));
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const { error } = await supabase
      .from("products")
      .update({
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: product.stock,
        featured: product.featured,
      })
      .eq("id", params.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Product updated successfully!");

    router.push("/admin/products");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F8F4EF]">
        <h2 className="text-2xl text-[#5A2D2D]">
          Loading product...
        </h2>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] py-12 px-6">

      <div className="max-w-4xl mx-auto">

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden">

          <div className="bg-[#5A2D2D] px-10 py-8">

            <h1 className="text-4xl font-serif text-white">
              Edit Product
            </h1>

            <p className="mt-2 text-[#E8D7C5]">
              Update your jewellery collection.
            </p>

          </div>

          <form
            onSubmit={saveProduct}
            className="p-10 space-y-8"
          >
                        <div>

<label className="block mb-2 font-medium text-[#4B2E2E]">
  Product Name
</label>

<input
  type="text"
  value={product.name}
  onChange={(e) =>
    setProduct({
      ...product,
      name: e.target.value,
    })
  }
  className="w-full rounded-xl border border-[#D8C4A8] p-4"
/>

</div>

<div>

<label className="block mb-2 font-medium text-[#4B2E2E]">
  Description
</label>

<textarea
  rows={5}
  value={product.description}
  onChange={(e) =>
    setProduct({
      ...product,
      description: e.target.value,
    })
  }
  className="w-full rounded-xl border border-[#D8C4A8] p-4"
/>

</div>

<div className="grid md:grid-cols-2 gap-6">

<div>

  <label className="block mb-2 font-medium text-[#4B2E2E]">
    Price
  </label>

  <input
    type="number"
    value={product.price}
    onChange={(e) =>
      setProduct({
        ...product,
        price: Number(e.target.value),
      })
    }
    className="w-full rounded-xl border border-[#D8C4A8] p-4"
  />

</div>

<div>

  <label className="block mb-2 font-medium text-[#4B2E2E]">
    Stock
  </label>

  <input
    type="number"
    value={product.stock}
    onChange={(e) =>
      setProduct({
        ...product,
        stock: Number(e.target.value),
      })
    }
    className="w-full rounded-xl border border-[#D8C4A8] p-4"
  />

</div>

</div>

<div>

<label className="block mb-2 font-medium text-[#4B2E2E]">
  Category
</label>

<select
  value={product.category}
  onChange={(e) =>
    setProduct({
      ...product,
      category: e.target.value,
    })
  }
  className="w-full rounded-xl border border-[#D8C4A8] p-4"
>

  <option>Necklaces</option>
  <option>Earrings</option>
  <option>Bracelets</option>
  <option>Rings</option>

</select>

</div>

<div>

<label className="block mb-2 font-medium text-[#4B2E2E]">
  Replace Image
</label>

<input
  type="file"
  accept="image/*"
  onChange={uploadImage}
/>

{product.image && (

  <div className="mt-6">

    <Image
      src={product.image}
      alt={product.name}
      width={250}
      height={250}
      className="rounded-2xl border shadow-lg object-cover"
    />

  </div>

)}

</div>

<div className="flex items-center justify-between bg-[#FAF7F3] rounded-2xl p-5">

<div>

  <h3 className="font-semibold text-[#4B2E2E]">
    Featured Product
  </h3>

  <p className="text-sm text-[#8B6B5B]">
    Show this product on the homepage.
  </p>

</div>

<input
  type="checkbox"
  checked={product.featured}
  onChange={(e) =>
    setProduct({
      ...product,
      featured: e.target.checked,
    })
  }
  className="w-6 h-6 accent-[#5A2D2D]"
/>

</div>

<div className="flex gap-4 pt-6">

<button
  type="button"
  onClick={() => router.push("/admin/products")}
  className="flex-1 border-2 border-[#5A2D2D] text-[#5A2D2D] py-4 rounded-xl hover:bg-[#F5E7E0]"
>
  Cancel
</button>

<button
  type="submit"
  disabled={saving}
  className="flex-1 bg-[#5A2D2D] text-white py-4 rounded-xl hover:bg-[#432121] disabled:opacity-50"
>
  {saving ? "Saving..." : "Save Changes"}
</button>

</div>

</form>

</div>

</div>

</main>
);
}