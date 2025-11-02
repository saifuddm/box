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
import { HomeIcon, Loader2, PlusCircleIcon } from "lucide-react";
import BoxShareButton from "@/components/BoxShareButton";
import Link from "next/link";
import FileContent from "@/components/content/FileContent";
// Removed server-only import

interface BoxContentProps {
  boxId: string;
  boxName: string;
  boxCreatedAt: string;
  initialContent: Array<{
    id: string;
    content: string;
    type: "text" | "image" | "empty" | "file";
    created_at: string;
  }>;
}

export default function BoxContent({
  boxId,
  boxName,
  boxCreatedAt,
  initialContent,
}: BoxContentProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [content, setContent] = useState<
    {
      id: string;
      content: string;
      type: "text" | "image" | "empty" | "file";
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
    type: "text" | "image" | "empty" | "file";
    data: string | null;
    files?: File[];
  }) => {
    console.log("Content submitted:", content);

    if (content.type === "empty" || (!content.data && !content.files?.length)) {
      // Close the drawer when empty content is submitted
      setIsDrawerOpen(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (content.type === "text") {
        // Call our server API route which forwards to the Edge Function
        const response = await fetch("/api/upload-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boxId,
            uploadType: "text",
            textContent: content.data!,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = "Upload failed";
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        // Add to local state with the database ID
        const newContent = {
          id: crypto.randomUUID(),
          content: content.data!,
          type: content.type,
        };

        setContent((prev) => [...prev, newContent]);
      } else if (
        (content.type === "image" || content.type === "file") &&
        content.files
      ) {
        // Handle multiple uploads in parallel
        const uploadPromises = content.files.map(async (file) => {
          try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            const uploadType = content.type === "image" ? "image" : "file";

            // Call our server API route which forwards to the Edge Function
            const response = await fetch("/api/upload-content", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                boxId,
                name: file.name,
                base64Data: base64,
                mimeType: file.type,
                uploadType: uploadType,
              }),
            });

            if (!response.ok) {
              const message = await response.text();
              throw new Error(message || "Upload failed");
            }

            return { success: true, file, base64 };
          } catch (err) {
            console.error(
              `Unexpected error uploading image ${file.name}:`,
              err
            );
            const message =
              err instanceof Error ? err.message : "Unexpected error occurred";
            return { success: false, file, error: message };
          }
        });

        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);

        // Separate successful and failed uploads
        const successfulUploads = results.filter((result) => result.success);
        const failedUploads = results.filter((result) => !result.success);

        // Add successful uploads to local state
        if (successfulUploads.length > 0) {
          const newContentItems = successfulUploads.map((result) => ({
            id: crypto.randomUUID(),
            content: result.base64!,
            type: content.type,
            file: result.file,
          }));

          setContent((prev) => [...prev, ...newContentItems]);
        }

        // Handle errors
        if (failedUploads.length > 0) {
          const errorMessages = failedUploads
            .map((result) => `${result.file.name}: ${result.error}`)
            .join(", ");

          if (successfulUploads.length === 0) {
            // All uploads failed
            setSubmitError(`Failed to upload: ${errorMessages}`);
            return;
          } else {
            // Some uploads failed, show partial success message
            setSubmitError(
              `Some files failed to upload: ${errorMessages}. ${successfulUploads.length} file(s) uploaded successfully.`
            );
          }
        }
      }

      // Close the drawer on successful save
      setIsDrawerOpen(false);
    } catch (err) {
      console.error("Unexpected error saving content:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setSubmitError(errorMessage);
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
    const threeColumns: React.ReactElement[][] = [[], [], []];
    const singleColumn: React.ReactElement[] = [];

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
      } else if (item.type === "file") {
        contentElement = (
          <FileContent
            key={item.id}
            id={item.id}
            src={item.file ? URL.createObjectURL(item.file) : item.content}
            alt={
              item.file ? item.file.name : item.content.split("/").pop() || ""
            }
            fromSupabase={item.fromSupabase}
          />
        );
      } else {
        return; // Skip empty content
      }

      threeColumns[columnIndex].push(contentElement);
      singleColumn.push(contentElement);
    });

    // Render the 3 columns
    return (
      <>
        <div className=" flex-col gap-2 hidden lg:flex">{threeColumns[0]}</div>
        <div className=" flex-col gap-2 hidden lg:flex">{threeColumns[1]}</div>
        <div className=" flex-col gap-2 hidden lg:flex">{threeColumns[2]}</div>
        <div className="flex flex-col gap-2 lg:hidden">{singleColumn}</div>
      </>
    );
  }

  return (
    <div className="grid grid-rows-[2.5rem_1fr] grid-cols-[1fr_0.2fr] min-h-screen p-8 sm:p-20 gap-4 lg:gap-16 font-[family-name:var(--font-geist-mono)] ">
      <div className="flex flex-row space-x-2 items-center">
        <Button variant="outline" size="icon" asChild>
          <Link href="/" aria-label="Home">
            <HomeIcon className="w-4 h-4" />
          </Link>
        </Button>
        <h2 className="text-2xl">/{boxName}</h2>
      </div>
      {/* <p className="text-sm text-muted-foreground text-wrap">ID: {boxId}</p> */}
      <div id="actions" className="flex gap-2 sticky top-6 justify-end">
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="default"
              className="cursor-pointer "
              disabled={isSubmitting}
              size="lg"
            >
              <PlusCircleIcon />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                {isSubmitting ? "Adding Content" : "Add New Content"}
              </DrawerTitle>
              <DrawerDescription>
                {isSubmitting
                  ? "Adding content to your box."
                  : "Add text or image content to your box."}
              </DrawerDescription>
            </DrawerHeader>
            {isSubmitting ? (
              <div className="px-4 pb-4 flex justify-center items-center flex-1">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
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
            )}
          </DrawerContent>
        </Drawer>
        <BoxShareButton boxName={boxName} boxId={boxId} />
      </div>
      <div
        id="content"
        className="grid grid-cols-1 lg:grid-cols-3 gap-2 col-span-2 lg:col-span-1"
      >
        {renderContent()}
      </div>
      <p className="text-sm text-muted-foreground text-wrap">
        Created at: {new Date(boxCreatedAt).toLocaleString()}
      </p>
    </div>
  );
}
