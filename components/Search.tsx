"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Search as SearchIcon,
} from "lucide-react";

import {
  usePathname,
  useRouter,
} from "next/navigation";


export default function Search() {

  const router = useRouter();

  const pathname = usePathname();


  const [
    query,
    setQuery,
  ] = useState("");



  useEffect(() => {

    setQuery("");

  }, [pathname]);



  function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();


    const value =
      query.trim();


    if (!value) {
      return;
    }


    router.push(
      `/search?q=${encodeURIComponent(value)}`
    );

  }



  return (

    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-md"
    >

      <input

        type="text"

        value={query}

        onChange={(e) =>
          setQuery(
            e.target.value
          )
        }

        placeholder="Search jewellery..."

        className="
          w-full
          rounded-full
          border
          border-[#E8DDD3]
          bg-white
          px-5
          py-3
          pr-12
          text-[#4B2E2E]
          outline-none
          transition
          focus:border-[#5A2D2D]
        "

      />



      <button

        type="submit"

        className="
          absolute
          right-4
          top-1/2
          -translate-y-1/2
        "

        aria-label="Search"

      >

        <SearchIcon

          size={20}

          className="text-[#5A2D2D]"

        />

      </button>


    </form>

  );

}