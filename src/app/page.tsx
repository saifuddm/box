import { MenuNav } from "@/components/MenuDrawer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* <MenuDrawer /> */}
      <MenuNav />
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start font-[family-name:var(--font-geist-mono)]">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <h1 className="text-4xl font-bold">Welcome to Box</h1>
          <h2 className="text-lg text-muted-foreground">
            Create short lived boxes to pass information between devices.
          </h2>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row w-full justify-center">
          <Button asChild variant="default">
            <Link href="/create">Create Box</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">Search Box</Link>
          </Button>
        </div>

        <div className="flex flex-col gap-2 text-center sm:text-left">
          <p className="text-sm text-muted-foreground opacity-50">
            For a tutorial on how to use Box, click on{" "}
            <span className="border px-2 py-1 rounded-md">Search Box</span> and
            search for &quot;Tutorial&quot;.
          </p>
        </div>
      </main>
      <footer className="row-start-3 flex items-center gap-2">
        <p className="text-muted-foreground">Made with ❤️ by</p>

        <Button asChild variant="outline">
          <Link href="https://github.com/saifuddm">saifuddm</Link>
        </Button>
      </footer>
    </div>
  );
}
