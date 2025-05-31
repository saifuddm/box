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
import { Button } from "@/components/ui/button";
import TextContent from "@/components/content/TextContent";
import ImageContent from "@/components/content/ImageContent";
import { createClient } from "@/lib/supabase/client";

export default function BoxPage() {
  const pathname = usePathname();
  const supabase = createClient();

  const [selectedBoxes, setSelectedBoxes] = useState<Set<string>>(new Set());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [content, setContent] = useState<
    {
      id: string;
      content: string;
      type: "text" | "image" | "empty";
      file?: File;
    }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCheckboxChange = (contentId: string, isChecked: boolean) => {
    setSelectedBoxes((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(contentId);
      } else {
        newSet.delete(contentId);
      }
      return newSet;
    });
  };

  const handleContentSubmit = async (content: {
    type: "text" | "image" | "empty";
    data: string | null;
    file?: File;
  }) => {
    console.log("Content submitted:", content);

    if (content.type === "empty" || !content.data) {
      // Close the drawer when empty content is submitted
      setIsDrawerOpen(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get the box ID from the pathname (remove the leading slash)
      const boxId = pathname.slice(1);

      if (content.type === "text") {
        // Save text content to the database
        const { data: savedContent, error } = await supabase
          .from("TextContent")
          .insert({
            box: boxId,
            content: content.data,
          })
          .select()
          .single();

        if (error) {
          console.error("Error saving text content:", error);
          setSubmitError("Failed to save content. Please try again.");
          return;
        }

        // Add to local state with the database ID
        const newContent = {
          id: savedContent.id,
          content: savedContent.content,
          type: "text" as const,
        };

        setContent((prev) => [...prev, newContent]);
      } else if (content.type === "image") {
        // For now, just add to local state (we'll implement image saving later)
        const newContent = {
          id: crypto.randomUUID(),
          content: content.data,
          type: content.type,
          file: content.file,
        };

        setContent((prev) => [...prev, newContent]);
      }

      // Close the drawer on successful save
      setIsDrawerOpen(false);
    } catch (err) {
      console.error("Unexpected error saving content:", err);
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSubmitError(null);
  };

  const handleDelete = () => {
    // Filter out the selected content items
    setContent((prev) => prev.filter((item) => !selectedBoxes.has(item.id)));
    // Clear the selected boxes after deletion
    setSelectedBoxes(new Set());
  };

  function renderContent() {
    // Create 3 columns to distribute content
    const columns: React.ReactElement[][] = [[], [], []];

    // Distribute content items across columns in round-robin fashion
    content.forEach((item, index) => {
      const columnIndex = index % 3;

      let contentElement: React.ReactElement;

      if (item.type === "text") {
        contentElement = (
          <TextContent
            key={item.id}
            id={item.id}
            content={item.content}
            handleCheckboxChange={handleCheckboxChange}
          />
        );
      } else if (item.type === "image") {
        contentElement = (
          <ImageContent
            key={item.id}
            id={item.id}
            src={item.file ? URL.createObjectURL(item.file) : item.content}
            alt={item.file ? item.file.name : item.content}
            handleCheckboxChange={handleCheckboxChange}
          />
        );
      } else {
        return; // Skip empty content
      }

      columns[columnIndex].push(contentElement);
    });

    // Render the 3 columns
    return (
      <>
        <div className="flex flex-col gap-2">{columns[0]}</div>
        <div className="flex flex-col gap-2">{columns[1]}</div>
        <div className="flex flex-col gap-2">{columns[2]}</div>
      </>
    );
  }

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
        {renderContent()}
      </div>
      <div
        id="actions"
        className="flex gap-2 md:flex-col row-start-3 md:row-start-auto self-start"
      >
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button className="cursor-pointer" disabled={isSubmitting}>
              Add
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Add New Content</DrawerTitle>
              <DrawerDescription>
                Add text or image content to your box.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto flex-1">
              {submitError && (
                <div className="text-red-500 text-sm mb-4 p-2 border border-red-300 rounded bg-red-50">
                  {submitError}
                </div>
              )}
              <InsertContentComponent
                onSubmit={handleContentSubmit}
                onClose={handleDrawerClose}
              />
            </div>
          </DrawerContent>
        </Drawer>
        {/* <Button
          disabled={selectedBoxes.size === 0}
          variant="outline"
          className="cursor-pointer"
        >
          Edit
        </Button> */}
        <Button
          variant="destructive"
          className="cursor-pointer"
          disabled={selectedBoxes.size === 0}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
