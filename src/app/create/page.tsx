"use client";
import { Button } from "@/components/ui/button";
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
    <div className="grid grid-rows-[1.5rem_1fr_0.1fr] md:grid-rows-[1.5rem_1fr_0.1fr] md:grid-cols-[1fr_0.2fr] items-center justify-items-center md:justify-items-start min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-mono)] ">
      <h2 className="text-2xl">Create a new Box</h2>
      <p className="text-sm hidden md:block text-muted-foreground">Options</p>
      <form
        method="post"
        className="row-span-2 h-full grid grid-rows-subgrid w-full items-center justify-items-center sm:justify-items-start"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col space-y-2 w-full md:w-fit h-fit">
          <label htmlFor="boxName" className="text-foreground">
            Box Name
          </label>
          <input
            type="text"
            name="boxName"
            placeholder="my-cool-box"
            className="border-b-2 border-primary bg-transparent outline-none mb-6 text-foreground placeholder:text-muted-foreground placeholder:opacity-50"
            required
          />
          <label htmlFor="boxPassword" className="text-foreground">
            Box Password (optional)
          </label>
          <input
            type="text"
            name="password"
            id="password"
            placeholder="Password"
            className="border-b-2 border-primary bg-transparent outline-none text-foreground placeholder:text-muted-foreground placeholder:opacity-50"
          />
        </div>

        <Button type="submit" className="cursor-pointer">
          Create Box
        </Button>
      </form>
      <div className="text-sm self-start text-muted-foreground">
        <p className="md:hidden">Options</p>
        <p>TTL: 1h</p>
      </div>
    </div>
  );
}
