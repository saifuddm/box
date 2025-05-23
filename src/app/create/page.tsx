"use client";
import { useRouter } from "next/navigation";
import React from "react";

export default function CreateBoxPage() {
  const router = useRouter();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const boxName = formData.get("boxName");
    const boxPassword = formData.get("boxPassword");
    console.log(boxName, boxPassword);
    router.push(`/${boxName}`);
  };
  return (
    <div className="grid grid-rows-[1.5rem_1fr_0.1fr] grid-cols-[1fr_0.2fr] items-center justify-items-center sm:justify-items-start min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-mono)] ">
      <h2 className="text-2xl">Create a new Box</h2>
      <p className="text-sm">Options</p>
      <form
        action=""
        method="post"
        className="row-span-2 h-full grid grid-rows-subgrid w-full items-center justify-items-center sm:justify-items-start"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col space-y-2 w-fit h-fit">
          <label htmlFor="boxName">Box Name</label>
          <input
            type="text"
            name="boxName"
            placeholder="my-cool-box"
            className="border-b-2  border-sapphire outline-none mb-6"
            required
          />
          <label htmlFor="boxPassword">Box Password (optional)</label>
          <input
            type="text"
            name="password"
            id="password"
            placeholder="Password"
            className="border-b-2  border-sapphire outline-none"
          />
        </div>
        <button
          type="submit"
          className=" hover:cursor-pointer bg-surface0 text-base font-bold rounded-md px-4 py-2 hover:border-sapphire border-2 border-transparent"
        >
          Create Box
        </button>
      </form>
      <div className="text-sm self-start">
        <p>TTL: 1h</p>
      </div>
    </div>
  );
}
