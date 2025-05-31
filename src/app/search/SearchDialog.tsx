"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SearchDialogProps {
  error?: string;
  q?: string;
}

export default function SearchDialog({ error, q }: SearchDialogProps) {
  const [query, setQuery] = useState(q || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Reset submitting state when component mounts or when there's an error
  useEffect(() => {
    setIsSubmitting(false);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSubmitting(true);

    // Redirect to the same page with query parameter (without error param)
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Search</AlertDialogTitle>
          <AlertDialogDescription>
            Search for a box by name.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className=" text-sm p-2 border border-maroon rounded bg-maroon/10 text-maroon">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="query" className="text-sm font-medium">
              Query
            </label>
            <Input
              id="query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a box"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push("/")}>
              Go back home
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={!query.trim() || isSubmitting}
            >
              {isSubmitting ? "Searching..." : "Search"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
