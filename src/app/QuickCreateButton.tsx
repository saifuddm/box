"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function QuickCreateButton() {
  const router = useRouter();
  const [loadingType, setLoadingType] = useState<"public" | "password" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleQuickCreate = async (passwordProtected: boolean) => {
    setLoadingType(passwordProtected ? "password" : "public");
    setError(null);

    try {
      const formData = new FormData();

      if (passwordProtected) {
        formData.append("generatePassword", "true");
        formData.append("includePasswordContent", "true");
      }

      const response = await fetch("/api/quick-box", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error || "Failed to create box. Please try again.");
        return;
      }

      const boxId = payload?.data?.boxId;
      if (!boxId) {
        setError("Box created but no ID returned");
        return;
      }

      router.push(`/${boxId}`);
    } catch (err) {
      console.error("Error creating box:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoadingType(null);
    }
  };

  const isLoading = loadingType !== null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleQuickCreate(false)}
          disabled={isLoading}
          className="cursor-pointer"
        >
          {loadingType === "public" ? "Creating..." : "Quick Create"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleQuickCreate(true)}
          disabled={isLoading}
          className="cursor-pointer"
        >
          {loadingType === "password"
            ? "Creating..."
            : "Quick Create Protected"}
        </Button>
      </div>
      {error && (
        <p className="max-w-xs text-center text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
