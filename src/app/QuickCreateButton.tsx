"use client";

import { Button } from "@/components/ui/button";
import { uploadTextContent } from "@/utils/BoxContentHelper";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const adjectives = [
  "brave",
  "bright",
  "calm",
  "clever",
  "cozy",
  "curious",
  "gentle",
  "golden",
  "happy",
  "kind",
  "lucky",
  "merry",
  "nimble",
  "quiet",
  "rapid",
  "steady",
  "sunny",
  "tidy",
  "vivid",
  "wise",
] as const;

const nouns = [
  "anchor",
  "bridge",
  "cabin",
  "cloud",
  "comet",
  "forest",
  "harbor",
  "lantern",
  "meadow",
  "moon",
  "planet",
  "river",
  "rocket",
  "shell",
  "signal",
  "sparrow",
  "stone",
  "trail",
  "wave",
  "window",
] as const;

const objects = [
  "basket",
  "button",
  "circle",
  "garden",
  "island",
  "key",
  "map",
  "note",
  "paper",
  "pencil",
  "pocket",
  "ribbon",
  "sail",
  "seed",
  "spark",
  "ticket",
  "tower",
  "vessel",
  "wheel",
  "whistle",
] as const;

function randomItem<T>(items: readonly T[]) {
  const randomValue = new Uint32Array(1);
  crypto.getRandomValues(randomValue);

  return items[randomValue[0] % items.length];
}

function generateBoxName() {
  return `${randomItem(adjectives)}-${randomItem(nouns)}-${randomItem(objects)}`;
}

function generatePassword() {
  const randomValue = new Uint32Array(1);
  crypto.getRandomValues(randomValue);

  const suffix = String(randomValue[0] % 10000).padStart(4, "0");
  return `${randomItem(adjectives)}-${randomItem(nouns)}-${randomItem(objects)}-${suffix}`;
}

function buildPasswordContent(password: string) {
  return `Box password: ${password}`;
}

export default function QuickCreateButton() {
  const router = useRouter();
  const supabase = createClient();
  const [loadingType, setLoadingType] = useState<"public" | "password" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleQuickCreate = async (passwordProtected: boolean) => {
    setLoadingType(passwordProtected ? "password" : "public");
    setError(null);

    try {
      const password = passwordProtected ? generatePassword() : null;
      const { data: createBoxData, error: createBoxError } =
        await supabase.functions.invoke("create-box", {
          body: {
            name: generateBoxName(),
            password,
          },
        });

      if (createBoxError) {
        let errorMessage = "Failed to create box. Please try again.";

        try {
          const response = await createBoxError.context.json();
          if (response?.error) {
            errorMessage = response.error;
          }
        } catch {
          console.error("Edge function error:", createBoxError);
        }

        setError(errorMessage);
        return;
      }

      if (createBoxData?.data?.id) {
        const boxId = createBoxData.data.id as string;

        if (password) {
          const authResponse = await fetch("/api/box-auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              boxId,
              password,
              rememberPassword: true,
            }),
          });

          if (!authResponse.ok) {
            const response = await authResponse.json().catch(() => null);
            setError(
              response?.error ||
                "Box created but authentication failed. Please try again.",
            );
            return;
          }

          await uploadTextContent({
            boxId,
            textContent: buildPasswordContent(password),
          });
        }

        router.push(`/${boxId}`);
      } else {
        setError("Box created but no ID returned");
      }
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
      <Button
        type="button"
        variant="secondary"
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
        {loadingType === "password" ? "Creating..." : "Quick Create Protected"}
      </Button>
      {error && (
        <p className="max-w-xs text-center text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
