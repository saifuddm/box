import BoxShareButton from "@/components/BoxShareButton";
import { Button } from "@/components/ui/button";
import { HomeIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

function WhyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-rows-[2.5rem_1fr] grid-cols-[1fr_0.2fr] min-h-screen p-8 sm:p-20 gap-4 lg:gap-16 font-[family-name:var(--font-geist-mono)] ">
      <div className="flex flex-row space-x-2 items-center">
        <Button variant="outline" size="icon" asChild>
          <Link href="/" aria-label="Home">
            <HomeIcon className="w-4 h-4" />
          </Link>
        </Button>
        <h2 className="text-2xl">/why</h2>
      </div>
      <div id="actions" className="flex gap-2 sticky top-6 justify-end">
        <BoxShareButton boxName={"about"} boxId={"about"} />
      </div>
      {children}
    </div>
  );
}

export default WhyLayout;
