"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  InsertContentComponent,
  type ContentType,
} from "@/components/InsertContentComponent";
import { Button } from "@/components/ui/button";
import TextContent from "@/components/content/TextContent";
import ImageContent from "@/components/content/ImageContent";
import { HomeIcon, Loader2, PlusCircleIcon } from "lucide-react";
import BoxShareButton from "@/components/BoxShareButton";
import Link from "next/link";
import FileContent from "@/components/content/FileContent";
import { toast } from "sonner";
import { containsHtmlElements } from "@/lib/markdown";
import {
  buildAttachmentMarkdown,
  combineContent,
  uploadBinaryContent,
  uploadTextContent,
  type UploadedBinaryContent,
} from "@/utils/BoxContentHelper";
// Removed server-only import

const BOX_LIFETIME_MS = 24 * 60 * 60 * 1000;

function isEditablePasteTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]',
    ),
  );
}

function extensionFromMimeType(mimeType: string) {
  if (!mimeType) {
    return "";
  }

  const mimeExtension = mimeType.split("/")[1]?.split("+")[0];
  if (!mimeExtension) {
    return "";
  }

  return `.${mimeExtension === "jpeg" ? "jpg" : mimeExtension}`;
}

function normalizeClipboardFile(file: File, index: number, timestamp: number) {
  const genericClipboardNames = new Set(["image.png", "pasted-image.png"]);
  if (file.name && !genericClipboardNames.has(file.name.toLowerCase())) {
    return file;
  }

  const prefix = file.type.startsWith("image/")
    ? "pasted-image"
    : "pasted-file";
  const extension = extensionFromMimeType(file.type);
  return new File([file], `${prefix}-${timestamp}-${index}${extension}`, {
    type: file.type || "application/octet-stream",
    lastModified: timestamp,
  });
}

function getClipboardFiles(clipboardData: DataTransfer) {
  const rawFiles = new Map<string, File>();

  Array.from(clipboardData.files).forEach((file) => {
    rawFiles.set(
      `${file.name}-${file.size}-${file.type}-${file.lastModified}`,
      file,
    );
  });

  Array.from(clipboardData.items).forEach((item) => {
    if (item.kind !== "file") {
      return;
    }

    const file = item.getAsFile();
    if (!file) {
      return;
    }

    rawFiles.set(
      `${file.name}-${file.size}-${file.type}-${file.lastModified}`,
      file,
    );
  });

  const timestamp = Date.now();
  return Array.from(rawFiles.values()).map((file, index) =>
    normalizeClipboardFile(file, index, timestamp),
  );
}

function formatRemainingTime(milliseconds: number) {
  if (milliseconds <= 0) {
    return "Awaiting cleanup";
  }

  const totalMinutes = Math.ceil(milliseconds / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m remaining`;
  }

  if (minutes === 0) {
    return `${hours}h remaining`;
  }

  return `${hours}h ${minutes}m remaining`;
}

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
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const isSavingRef = useRef(false);

  const createdTime = new Date(boxCreatedAt).getTime();
  const expiresTime = createdTime + BOX_LIFETIME_MS;
  const timeRemaining = Math.max(
    0,
    expiresTime - (currentTime ?? createdTime),
  );
  const remainingPercent = Math.round((timeRemaining / BOX_LIFETIME_MS) * 100);

  const saveContent = useCallback(
    async (
      newContent: ContentType[],
      options?: { showDrawerErrors?: boolean },
    ) => {
      const showDrawerErrors = options?.showDrawerErrors ?? true;

      if (newContent.length === 0) {
        return true;
      }

      if (isSavingRef.current) {
        return false;
      }

      isSavingRef.current = true;
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const textContentItem = newContent.find((item) => item.type === "text");
        const imageFiles =
          newContent.find((item) => item.type === "image")?.files ?? [];
        const fileFiles =
          newContent.find((item) => item.type === "file")?.files ?? [];
        const selectedFiles = [...imageFiles, ...fileFiles];
        const hasText = Boolean(textContentItem?.data?.trim());

        const uploadedBinaryContent: UploadedBinaryContent[] = [];
        const failedUploads: Array<{ file: File; error: string }> = [];

        if (selectedFiles.length > 0) {
          const uploadResults = await Promise.all(
            selectedFiles.map(async (file) => {
              try {
                const uploaded = await uploadBinaryContent({
                  boxId,
                  file,
                  hideContent: hasText,
                });
                return { success: true as const, uploaded };
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Unexpected error occurred";
                return { success: false as const, file, error: message };
              }
            }),
          );

          uploadResults.forEach((result) => {
            if (result.success) {
              uploadedBinaryContent.push(result.uploaded);
            } else {
              failedUploads.push({ file: result.file, error: result.error });
            }
          });

          if (failedUploads.length > 0) {
            const errorMessages = failedUploads
              .map((result) => `${result.file.name}: ${result.error}`)
              .join(", ");
            const errorMessage = `Failed to upload: ${errorMessages}`;
            if (showDrawerErrors) {
              setSubmitError(errorMessage);
            }
            return false;
          }

          if (!hasText && uploadedBinaryContent.length > 0) {
            // Files-only flow: keep image/file cards visible in local state.
            const newContentItems = uploadedBinaryContent.map((item) => ({
              id: crypto.randomUUID(),
              content: item.fileUrl,
              type: item.uploadType,
              file: item.file,
            }));
            setContent((prev) => [...prev, ...newContentItems]);
          }
        }

        if (hasText) {
          const attachmentMarkdown = buildAttachmentMarkdown(
            uploadedBinaryContent,
            boxId,
          );
          const finalTextContent = combineContent(
            textContentItem?.data ?? "",
            attachmentMarkdown,
          );

          await uploadTextContent({
            boxId,
            textContent: finalTextContent,
            hideContent: false,
          });

          const newTextContent = {
            id: crypto.randomUUID(),
            content: finalTextContent,
            type: "text" as const,
          };
          setContent((prev) => [...prev, newTextContent]);
        }

        return true;
      } catch (err) {
        console.error("Unexpected error saving content:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.";
        if (showDrawerErrors) {
          setSubmitError(errorMessage);
        }
        return false;
      } finally {
        isSavingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [boxId],
  );

  // Initialize content from props
  useEffect(() => {
    const formattedContent = initialContent.map((item) => ({
      id: item.id,
      content: item.content,
      type: item.type,
      fromSupabase: true,
    }));
    setContent(formattedContent);
  }, [initialContent]);

  useEffect(() => {
    setCurrentTime(Date.now());
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  const handleContentSubmit = async (content: ContentType[]) => {
    if (content.length === 0) {
      setIsDrawerOpen(false);
      return;
    }

    const saved = await saveContent(content);
    if (saved) {
      setIsDrawerOpen(false);
    }
  };

  useEffect(() => {
    const handlePagePaste = async (event: ClipboardEvent) => {
      if (isDrawerOpen || isSubmitting || isEditablePasteTarget(event.target)) {
        return;
      }

      const clipboardData = event.clipboardData;
      if (!clipboardData) {
        return;
      }

      const pastedFiles = getClipboardFiles(clipboardData);
      const imageFiles = pastedFiles.filter((file) =>
        file.type.startsWith("image/"),
      );
      const fileFiles = pastedFiles.filter(
        (file) => !file.type.startsWith("image/"),
      );
      const textContent = clipboardData.getData("text/plain").trim();

      if (
        imageFiles.length === 0 &&
        fileFiles.length === 0 &&
        textContent.length === 0
      ) {
        return;
      }

      event.preventDefault();

      if (textContent && containsHtmlElements(textContent)) {
        toast.error(
          "HTML elements are not allowed. Use Markdown syntax instead.",
        );
        return;
      }

      const pastedContent: ContentType[] = [];
      if (imageFiles.length > 0) {
        pastedContent.push({ type: "image", data: null, files: imageFiles });
      }
      if (fileFiles.length > 0) {
        pastedContent.push({ type: "file", data: null, files: fileFiles });
      }
      if (textContent) {
        pastedContent.push({ type: "text", data: textContent });
      }

      const pastedItemCount =
        imageFiles.length + fileFiles.length + (textContent ? 1 : 0);
      const toastId = toast.loading("Adding pasted content...");
      const saved = await saveContent(pastedContent, {
        showDrawerErrors: false,
      });

      if (saved) {
        toast.success(
          `Added ${pastedItemCount} pasted item${pastedItemCount === 1 ? "" : "s"}`,
          { id: toastId },
        );
      } else {
        toast.error("Could not add pasted content", { id: toastId });
      }
    };

    window.addEventListener("paste", handlePagePaste);
    return () => window.removeEventListener("paste", handlePagePaste);
  }, [isDrawerOpen, isSubmitting, saveContent]);

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
            boxId={boxId}
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
            boxId={boxId}
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
      <div id="actions" className="flex gap-2 sticky top-6 justify-end z-10">
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
              <InsertContentComponent
                onSubmit={handleContentSubmit}
                onClose={handleDrawerClose}
                submitError={submitError}
              />
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
      <div className="col-span-2 lg:col-span-1 rounded-lg border bg-background/80 p-4 text-sm text-muted-foreground shadow-xs">
        <div className="flex flex-col gap-2">
          <p className="text-wrap">
            <span className="block">Created at:</span>
            <span className="block">{new Date(boxCreatedAt).toLocaleString()}</span>
          </p>
          <p className="font-medium text-foreground whitespace-nowrap">
            {formatRemainingTime(timeRemaining)}
          </p>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Box time remaining"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={remainingPercent}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${remainingPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs">
          Boxes expire 24 hours after creation and are deleted by the cleanup
          job.
        </p>
      </div>
    </div>
  );
}
