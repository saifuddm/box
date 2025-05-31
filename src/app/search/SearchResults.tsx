import { Button } from "@/components/ui/button";
import { Database } from "@/lib/supabase/database.types";
import { ArrowRightCircle, LockIcon } from "lucide-react";
import Link from "next/link";

interface SearchResultsProps {
  boxSearchResults: Database["public"]["Views"]["PublicBox"]["Row"][];
}
export default function SearchResults({
  boxSearchResults,
}: SearchResultsProps) {
  return (
    <div className="grid grid-rows-[1.5rem_1fr_0.1fr] md:grid-rows-[1.5rem_1fr_0.1fr] md:grid-cols-[1fr_0.2fr] items-center justify-items-center md:justify-items-start min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-mono)] ">
      <h2 className="text-2xl">Search Results</h2>
      <p className="text-sm hidden md:block text-muted-foreground">
        Count: {boxSearchResults.length}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 self-start">
        {boxSearchResults.map((box) => (
          <Button
            key={box.id}
            variant="outline"
            asChild
            className="hover:border-mauve"
          >
            <Link href={`/${box.id}`} className="flex items-end gap-4 h-fit">
              <div className="flex flex-col gap-2">
                <p className="inline-flex items-center gap-2 text-lg">
                  {box.name}
                  {box.password_protected && (
                    <span className=" text-muted-foreground">
                      <LockIcon className="w-4 h-4" />
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {box.created_at
                    ? new Date(box.created_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
              <ArrowRightCircle className="text-mauve w-8 h-8" />
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
