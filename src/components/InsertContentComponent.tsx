"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Clipboard, Upload, X, Plus, FileIcon } from "lucide-react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { containsHtmlElements } from "@/lib/markdown";

interface FileType {
  file: File;
  preview: string;
  id: string;
}

interface ContentType {
  type: "text" | "image" | "file";
  data: string | null;
  files?: File[];
}

interface InsertContentComponentProps {
  onSubmit?: (content: ContentType[]) => void;
  onClose?: () => void;
}

function InsertContentComponent({
  onSubmit,
  onClose,
}: InsertContentComponentProps) {
  const [textContent, setTextContent] = useState("");
  const [textValidationError, setTextValidationError] = useState<string | null>(
    null,
  );
  const [imageFiles, setImageFiles] = useState<FileType[]>([]);
  const [fileFiles, setFileFiles] = useState<FileType[]>([]);
  const [showEmptyContentDialog, setShowEmptyContentDialog] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTextContent(text);
      setTextValidationError(null);
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
      // Fallback: show a message to user
      alert("Unable to access clipboard. Please paste manually using Ctrl+V");
    }
  };

  const handlePasteImage = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], "pasted-image.png", { type });
            const previewUrl = URL.createObjectURL(blob);
            const newImageFile: FileType = {
              file,
              preview: previewUrl,
              id:
                Date.now().toString() + Math.random().toString(36).substr(2, 9),
            };

            setImageFiles((prev) => [...prev, newImageFile]);
            return;
          }
        }
      }

      alert("No image found in clipboard");
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
      alert(
        "Unable to access clipboard for images. Please use the upload button instead.",
      );
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImageFiles: FileType[] = [];
      const newFileFiles: FileType[] = [];

      Array.from(files).forEach((file) => {
        const previewUrl = URL.createObjectURL(file);
        if (file.type.startsWith("image/")) {
          const newImageFile: FileType = {
            file,
            preview: previewUrl,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          };
          newImageFiles.push(newImageFile);
        } else {
          const newFileFile: FileType = {
            file,
            preview: previewUrl,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          };
          newFileFiles.push(newFileFile);
        }
      });

      if (newImageFiles.length > 0) {
        setImageFiles((prev) => [...prev, ...newImageFiles]);
      }

      if (newFileFiles.length > 0) {
        setFileFiles((prev) => [...prev, ...newFileFiles]);
      }

      if (newImageFiles.length === 0 && newFileFiles.length === 0) {
        alert("Please select valid image files");
      }
    }
  };

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (id: string) => {
    setImageFiles((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };
  const handleRemoveFile = (id: string) => {
    setFileFiles((prev) => {
      const fileToRemove = prev.find((file) => file.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((file) => file.id !== id);
    });
  };

  const handleSubmit = () => {
    const content: ContentType[] = [];

    if (imageFiles.length > 0) {
      content.push({
        type: "image",
        data: null,
        files: imageFiles.map((imageFile) => imageFile.file),
      });
    }

    if (fileFiles.length > 0) {
      content.push({
        type: "file",
        data: null,
        files: fileFiles.map((fileFile) => fileFile.file),
      });
    }

    const trimmedTextContent = textContent.trim();
    if (trimmedTextContent) {
      if (containsHtmlElements(trimmedTextContent)) {
        setTextValidationError(
          "HTML elements are not allowed. Use Markdown syntax instead.",
        );
        return;
      }
      setTextValidationError(null);
      content.push({
        type: "text",
        data: trimmedTextContent,
      });
    }

    if (content.length === 0) {
      setShowEmptyContentDialog(true);
      return;
    }
    onSubmit?.(content);
  };

  const handleEmptyContentCancel = () => {
    setShowEmptyContentDialog(false);
    onSubmit?.([]);
  };

  const handleEmptyContentContinue = () => {
    setShowEmptyContentDialog(false);
  };

  const handleClear = () => {
    setTextContent("");
    setTextValidationError(null);
    // Clean up preview URLs
    imageFiles.forEach((img) => URL.revokeObjectURL(img.preview));
    setImageFiles([]);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    fileFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setFileFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCloseOrClear = () => {
    const hasContent =
      textContent.trim() || imageFiles.length > 0 || fileFiles.length > 0;
    if (hasContent) {
      handleClear();
    } else {
      onClose?.();
    }
  };

  const hasContent =
    textContent.trim() || imageFiles.length > 0 || fileFiles.length > 0;

  return (
    <div className="space-y-4">
      {/* Text Input Section */}
      <div className="space-y-2">
        <label
          htmlFor="content-text"
          className="text-sm font-medium text-foreground"
        >
          Text Content (Markdown supported)
        </label>
        <Textarea
          id="content-text"
          placeholder="Write markdown here (for example: ## Heading, **bold**, - list)"
          value={textContent}
          onChange={(e) => {
            setTextContent(e.target.value);
            if (textValidationError) {
              setTextValidationError(null);
            }
          }}
          className="min-h-[100px] resize-none"
        />
        {textValidationError && (
          <p className="text-sm text-maroon">{textValidationError}</p>
        )}

        <Button
          onClick={handlePasteText}
          variant="secondary"
          className="cursor-pointer w-full"
        >
          <Clipboard />
          Paste Text from Clipboard
        </Button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Image Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Image Content
        </label>

        {imageFiles.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {imageFiles.map((imageFile) => (
                <div
                  key={imageFile.id}
                  className="relative border border-border rounded-md p-2 bg-card group"
                >
                  <Button
                    onClick={() => handleRemoveImage(imageFile.id)}
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 p-1 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Image
                    src={imageFile.preview}
                    alt="Preview"
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full h-20 object-cover rounded"
                  />
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {imageFile.file.name}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {imageFiles.length} image{imageFiles.length !== 1 ? "s" : ""}{" "}
              selected
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handlePasteImage}
              variant="secondary"
              className="h-auto py-3 flex-col cursor-pointer flex items-center justify-center"
            >
              <Clipboard />
              Paste Image
            </Button>
            <Button
              onClick={handleImageUploadClick}
              variant="secondary"
              className="h-auto py-3 flex-col cursor-pointer flex items-center justify-center"
            >
              <Upload />
              Upload Images
            </Button>
          </div>
        )}

        {/* Hidden image input */}
        <Input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* File Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          File Content
        </label>
        {fileFiles.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {fileFiles.map((fileFiles) => (
                <div
                  key={fileFiles.id}
                  className="relative border border-border rounded-md p-2 bg-card group"
                >
                  <Button
                    onClick={() => handleRemoveFile(fileFiles.id)}
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 p-1 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <a href={fileFiles.preview} target="_blank">
                    <FileIcon className="h-3 w-3" />
                  </a>

                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {fileFiles.file.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleFileUploadClick}
              variant="secondary"
              className="h-auto py-3 flex-col cursor-pointer flex items-center justify-center"
            >
              <Upload />
              Upload Files
            </Button>

            {/* Hidden file input */}
            <Input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} className="flex-1 cursor-pointer">
          <Plus />
          Add Content
        </Button>

        <AlertDialog
          open={showEmptyContentDialog}
          onOpenChange={setShowEmptyContentDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Empty Content</AlertDialogTitle>
              <AlertDialogDescription>
                Please add some content before submitting.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleEmptyContentCancel}>
                Go back to Box
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleEmptyContentContinue}>
                Add Content
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          onClick={handleCloseOrClear}
          variant={hasContent ? "destructive" : "outline"}
          className="cursor-pointer "
        >
          {hasContent ? "Clear" : "Close"}
        </Button>
      </div>
    </div>
  );
}

export { InsertContentComponent };
export type { ContentType };
