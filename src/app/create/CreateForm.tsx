"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function CreateForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.target as HTMLFormElement);
    const boxName = formData.get("boxName");
    const boxPassword = formData.get("boxPassword");

    try {
      console.log(boxName, boxPassword);

      // Call the edge function instead of direct database insert
      const { data: createBoxData, error: createBoxError } =
        await supabase.functions.invoke("create-box", {
          body: {
            name: boxName as string,
            password: (boxPassword as string) || null,
          },
        });

      if (createBoxError) {
        console.error("Edge function error:", createBoxError);
        setError("Failed to create box. Please try again.");
        return;
      }

      // Navigate to the created box
      if (createBoxData?.data?.id) {
        router.push(`/${createBoxData.data.id}`);
      } else {
        setError("Box created but no ID returned");
      }
    } catch (err) {
      console.error("Error creating box:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form
      method="post"
      className="row-span-2 h-full grid grid-rows-subgrid w-full items-center justify-items-center sm:justify-items-start"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col space-y-2 w-full md:w-fit h-fit">
        {error && (
          <div className="text-red-500 text-sm mb-4 p-2 border border-red-300 rounded bg-red-50">
            {error}
          </div>
        )}
        <label htmlFor="boxName" className="text-foreground">
          Box Name
        </label>
        <input
          type="text"
          name="boxName"
          placeholder="my-cool-box"
          className="border-b-2 border-primary bg-transparent outline-none mb-6 text-foreground placeholder:text-muted-foreground placeholder:opacity-50"
          required
          disabled={isLoading}
        />
        <label htmlFor="boxPassword" className="text-foreground">
          Box Password (optional)
        </label>
        <input
          type="password"
          name="boxPassword"
          id="boxPassword"
          placeholder="Password"
          className="border-b-2 border-primary bg-transparent outline-none text-foreground placeholder:text-muted-foreground placeholder:opacity-50"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="cursor-pointer" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Box"}
      </Button>
    </form>
  );
}
