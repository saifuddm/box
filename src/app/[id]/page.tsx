"use client";
import { Clipboard } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import InsertContentComponent from "@/components/InsertContentComponent";

export default function BoxPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [selectedBoxes, setSelectedBoxes] = useState<Set<string>>(new Set());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleCheckboxChange = (boxId: string, isChecked: boolean) => {
    setSelectedBoxes((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(boxId);
      } else {
        newSet.delete(boxId);
      }
      return newSet;
    });
  };

  const handleContentSubmit = (content: {
    type: "text" | "image";
    data: string;
    file?: File;
  }) => {
    console.log("Content submitted:", content);
    // TODO: Add logic to save the content to the box
    // For now, just close the drawer
    setIsDrawerOpen(false);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const selectedCount = selectedBoxes.size;
  const title = selectedCount > 0 ? `Selected Box: ${selectedCount}` : "Box";

  return (
    <div className="grid grid-rows-[1.5rem_1rem_0.1fr_1fr] md:grid-rows-[1.5rem_1fr_0.1fr] md:grid-cols-[1fr_0.2fr] items-center justify-items-center md:justify-items-start min-h-screen p-8 pb-20 gap-4 md:gap-16 sm:p-20 font-[family-name:var(--font-geist-mono)] ">
      <h2 className="text-2xl">{title}</h2>
      <p className="text-sm text-muted-foreground">ID: {pathname}</p>
      <div
        id="content"
        className="grid grid-cols-1 md:grid-cols-3 gap-2 h-full items-start"
      >
        <div className="flex flex-col gap-2">
          <div
            id="example-content"
            className="bg-card border border-border rounded-md p-2 h-min"
          >
            <div className="overflow-y-auto">
              <p className="text-card-foreground">Example Content</p>
            </div>
            <div id="selector" className="flex justify-between mt-2">
              <input
                type="checkbox"
                name="selector"
                id="selector"
                className="accent-primary"
                onChange={(e) =>
                  handleCheckboxChange("selector", e.target.checked)
                }
              />
              <Clipboard
                className="w-4 h-4 cursor-pointer hover:text-primary transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText("example content");
                }}
              />
            </div>
          </div>
          <div
            id="example-content-4"
            className="bg-card border border-border rounded-md p-2 h-min"
          >
            <div className="overflow-y-auto">
              <p className="text-card-foreground">
                Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                Officia nisi architecto sed perferendis, eaque, nemo illo
                debitis aliquam dolore, corporis delectus maiores voluptatum
                deserunt facilis earum asperiores. Quae, culpa ratione?
              </p>
            </div>

            <div id="selector-4" className="flex justify-between mt-2">
              <input
                type="checkbox"
                name="selector-4"
                id="selector-4"
                className="accent-primary"
                onChange={(e) =>
                  handleCheckboxChange("selector-4", e.target.checked)
                }
              />
              <Clipboard
                className="w-4 h-4 cursor-pointer hover:text-primary transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText("example content");
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div
            id="example-content-2"
            className="bg-card border border-border rounded-md p-2 h-min"
          >
            <div className="overflow-y-auto">
              <img
                src="https://yt3.googleusercontent.com/KVjptxDSWT7rjVfGax2TgTNVAYgplgo1z_fwaV3MFjPpcmNVZC0TIgQV030BPJ0ybCP3_Fz-2w=s900-c-k-c0x00ffffff-no-rj"
                alt="example"
                className="object-cover"
              />
            </div>
            <div id="selector-2" className="flex justify-between mt-2">
              <input
                type="checkbox"
                name="selector-2"
                id="selector-2"
                className="accent-primary"
                onChange={(e) =>
                  handleCheckboxChange("selector-2", e.target.checked)
                }
              />
              <Clipboard
                className="w-4 h-4 cursor-pointer hover:text-primary transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText("example content");
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div
            id="example-content-3"
            className="bg-card border border-border rounded-md p-2 h-min"
          >
            <div className="overflow-y-auto">
              <p className="text-card-foreground">
                Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                Voluptatibus sint dicta placeat error delectus eius est
                recusandae quidem fugit ea voluptatum nesciunt cumque ratione
                facere, consectetur quo temporibus aut quaerat. Lorem ipsum
                dolor sit amet consectetur adipisicing elit. Nam illo nobis eos
                laudantium reiciendis consectetur sapiente aspernatur iste neque
                enim, eum sed unde voluptatum, pariatur impedit, deleniti rem
                illum? Unde. Lorem ipsum dolor sit amet consectetur adipisicing
                elit. Quisquam, quos.
              </p>
            </div>

            <div id="selector-3" className="flex justify-between mt-2">
              <input
                type="checkbox"
                name="selector-3"
                id="selector-3"
                className="accent-primary"
                onChange={(e) =>
                  handleCheckboxChange("selector-3", e.target.checked)
                }
              />
              <Clipboard
                className="w-4 h-4 cursor-pointer hover:text-primary transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText("example content");
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        id="actions"
        className="flex gap-2 md:flex-col row-start-3 md:row-start-auto self-start"
      >
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="cursor-pointer bg-card text-card-foreground font-bold rounded-md px-4 py-2 hover:border-primary border-2 border-transparent transition-colors">
              Add
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Add New Content</DrawerTitle>
              <DrawerDescription>
                Add text or image content to your box.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto flex-1">
              <InsertContentComponent
                onSubmit={handleContentSubmit}
                onClose={handleDrawerClose}
              />
            </div>
          </DrawerContent>
        </Drawer>
        <button
          className="bg-muted text-muted-foreground font-bold rounded-md px-4 py-2 hover:border-primary border-2 border-transparent transition-colors"
          disabled
        >
          Edit
        </button>
        <button
          className="bg-muted text-muted-foreground font-bold rounded-md px-4 py-2 hover:border-primary border-2 border-transparent transition-colors"
          disabled={true}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
