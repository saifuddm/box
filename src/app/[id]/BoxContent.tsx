"use client";
import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import InsertContentComponent from "@/components/InsertContentComponent";
import { Button } from "@/components/ui/button";
import TextContent from "@/components/content/TextContent";
import ImageContent from "@/components/content/ImageContent";
import { createClient } from "@/lib/supabase/client";

interface BoxContentProps {
  boxId: string;
  boxName: string;
  initialContent: Array<{
    id: string;
    content: string;
    type: "text" | "image" | "empty";
    created_at: string;
  }>;
}

export default function BoxContent({
  boxId,
  boxName,
  initialContent,
}: BoxContentProps) {
  const supabase = createClient();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [content, setContent] = useState<
    {
      id: string;
      content: string;
      type: "text" | "image" | "empty";
      file?: File;
      fromSupabase?: boolean;
    }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize content from props
  useEffect(() => {
    console.log("Initial content:", initialContent);
    const formattedContent = initialContent.map((item) => ({
      id: item.id,
      content: item.content,
      type: item.type,
      fromSupabase: true,
    }));
    setContent(formattedContent);
  }, [initialContent]);

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
      if (content.type === "text") {
        // Save text content to the database
        const { error } = await supabase.from("TextContent").insert({
          box: boxId,
          content: content.data,
        });

        if (error) {
          console.error("Error saving text content:", error);
          setSubmitError("Failed to save content. Please try again.");
          return;
        }

        // Add to local state with the database ID
        const newContent = {
          id: crypto.randomUUID(),
          content: content.data,
          type: content.type,
        };

        setContent((prev) => [...prev, newContent]);
      } else if (content.type === "image") {
        //Convert file to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(content.file!);
        });

        const { error } = await supabase.functions.invoke("upload-image", {
          method: "POST",
          body: JSON.stringify({
            boxId,
            name: content.file?.name,
            base64Data: base64,
            mimeType: content.file?.type,
          }),
        });

        if (error) {
          console.error("Error uploading image:", error);
          setSubmitError("Failed to upload image. Please try again.");
          return;
        }

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

  function renderContent() {
    // Create 3 columns to distribute content
    const columns: React.ReactElement[][] = [[], [], []];

    // Distribute content items across columns in round-robin fashion
    content.forEach((item, index) => {
      const columnIndex = index % 3;

      let contentElement: React.ReactElement;

      if (item.type === "text") {
        contentElement = (
          <TextContent key={item.id} id={item.id} content={item.content} />
        );
      } else if (item.type === "image") {
        contentElement = (
          <ImageContent
            key={item.id}
            id={item.id}
            src={item.file ? URL.createObjectURL(item.file) : item.content}
            alt={item.file ? item.file.name : item.content}
            fromSupabase={item.fromSupabase}
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

  return (
    <div className="grid grid-rows-[1.5rem_1rem_0.1fr_1fr] md:grid-rows-[1.5rem_1fr_0.1fr] md:grid-cols-[1fr_0.2fr] items-center justify-items-center md:justify-items-start min-h-screen p-8 pb-20 gap-4 md:gap-16 sm:p-20 font-[family-name:var(--font-geist-mono)] ">
      <h2 className="text-2xl">{boxName}</h2>
      <p className="text-sm text-muted-foreground">ID: {boxId}</p>
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
                <div className=" text-sm p-2 border border-maroon rounded bg-maroon/10 text-maroon">
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
      </div>
    </div>
  );
}
