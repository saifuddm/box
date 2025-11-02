import { MenuNav } from "@/components/MenuDrawer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="box-bg box-bg-1">
          <Image
            src="/box.svg"
            alt=""
            width={120}
            height={120}
            className="opacity-[0.08] grayscale"
          />
        </div>
        <div className="box-bg box-bg-2">
          <Image
            src="/box.svg"
            alt=""
            width={80}
            height={80}
            className="opacity-[0.06] grayscale"
          />
        </div>
        <div className="box-bg box-bg-3">
          <Image
            src="/box.svg"
            alt=""
            width={150}
            height={150}
            className="opacity-[0.10] grayscale"
          />
        </div>
        <div className="box-bg box-bg-4">
          <Image
            src="/box.svg"
            alt=""
            width={100}
            height={100}
            className="opacity-[0.08] grayscale"
          />
        </div>
        <div className="box-bg box-bg-5">
          <Image
            src="/box.svg"
            alt=""
            width={90}
            height={90}
            className="opacity-[0.07] grayscale"
          />
        </div>
        <div className="box-bg box-bg-6">
          <Image
            src="/box.svg"
            alt=""
            width={110}
            height={110}
            className="opacity-[0.09] grayscale"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">
        {/* <MenuDrawer /> */}
        <MenuNav />
      </div>
      <main className="relative z-10 flex flex-col gap-8 row-start-2 items-center font-[family-name:var(--font-geist-mono)] w-full">
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
      <footer className="relative z-10 row-start-3 flex items-center gap-2">
        <p className="text-muted-foreground">Made with ❤️ by</p>

        <Button asChild variant="outline">
          <Link href="https://sunken-ships.com">SUNKen SHIP</Link>
        </Button>
      </footer>
    </div>
  );
}
