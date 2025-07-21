"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Clipboard, Upload, X, Plus } from "lucide-react";
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

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface InsertContentComponentProps {
  onSubmit?: (content: {
    type: "text" | "image" | "empty";
    data: string | null;
    files?: File[];
  }) => void;
  onClose?: () => void;
}

export default function InsertContentComponent({
  onSubmit,
  onClose,
}: InsertContentComponentProps) {
  const [textContent, setTextContent] = useState("");
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [showEmptyContentDialog, setShowEmptyContentDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTextContent(text);
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
            const newImageFile: ImageFile = {
              file,
              preview: previewUrl,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            };

            setImageFiles(prev => [...prev, newImageFile]);
            setTextContent("");
            return;
          }
        }
      }

      alert("No image found in clipboard");
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
      alert(
        "Unable to access clipboard for images. Please use the upload button instead."
      );
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImageFiles: ImageFile[] = [];
      
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          const previewUrl = URL.createObjectURL(file);
          const newImageFile: ImageFile = {
            file,
            preview: previewUrl,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          };
          newImageFiles.push(newImageFile);
        }
      });

      if (newImageFiles.length > 0) {
        setImageFiles(prev => [...prev, ...newImageFiles]);
        setTextContent("");
      } else {
        alert("Please select valid image files");
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (id: string) => {
    setImageFiles(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handleSubmit = () => {
    if (imageFiles.length > 0) {
      onSubmit?.({
        type: "image",
        data: null,
        files: imageFiles.map(img => img.file),
      });
    } else if (textContent.trim()) {
      onSubmit?.({
        type: "text",
        data: textContent.trim(),
      });
    } else {
      // Show alert dialog when no content
      setShowEmptyContentDialog(true);
    }
  };

  const handleEmptyContentCancel = () => {
    setShowEmptyContentDialog(false);
    onSubmit?.({
      type: "empty",
      data: null,
    });
  };

  const handleEmptyContentContinue = () => {
    setShowEmptyContentDialog(false);
  };

  const handleClear = () => {
    setTextContent("");
    // Clean up preview URLs
    imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
    setImageFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCloseOrClear = () => {
    const hasContent = textContent.trim() || imageFiles.length > 0;
    if (hasContent) {
      handleClear();
    } else {
      onClose?.();
    }
  };

  const hasContent = textContent.trim() || imageFiles.length > 0;

  return (
    <div className="space-y-4">
      {/* Text Input Section */}
      <div className="space-y-2">
        <label
          htmlFor="content-text"
          className="text-sm font-medium text-foreground"
        >
          Text Content
        </label>
        <Textarea
          id="content-text"
          placeholder="Enter your text content here..."
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="min-h-[100px] resize-none"
          disabled={imageFiles.length > 0}
        />

        <Button
          onClick={handlePasteText}
          disabled={imageFiles.length > 0}
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
              {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handlePasteImage}
              disabled={!!textContent.trim()}
              variant="secondary"
              className="h-auto py-3 flex-col cursor-pointer flex items-center justify-center"
            >
              <Clipboard />
              Paste Image
            </Button>
            <Button
              onClick={handleUploadClick}
              disabled={!!textContent.trim()}
              variant="secondary"
              className="h-auto py-3 flex-col cursor-pointer flex items-center justify-center"
            >
              <Upload />
              Upload Images
            </Button>
          </div>
        )}

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
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
