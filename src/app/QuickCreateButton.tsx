"use client";

import { Button } from "@/components/ui/button";
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

export default function QuickCreateButton() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickCreate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: createBoxData, error: createBoxError } =
        await supabase.functions.invoke("create-box", {
          body: {
            name: generateBoxName(),
            password: null,
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
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={handleQuickCreate}
        disabled={isLoading}
        className="cursor-pointer"
      >
        {isLoading ? "Creating..." : "Quick Create"}
      </Button>
      {error && (
        <p className="max-w-xs text-center text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
