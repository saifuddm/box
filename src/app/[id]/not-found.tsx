import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8 font-[family-name:var(--font-geist-mono)]">
      <section className="flex max-w-md flex-col items-center gap-5 text-center">
        <div className="rounded-full border px-3 py-1 text-sm text-muted-foreground">
          Box not found
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">This box is not available.</h1>
          <p className="text-sm text-muted-foreground">
            It may have expired, been deleted, or the link may be incorrect.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/create">Create a new box</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">Search boxes</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
