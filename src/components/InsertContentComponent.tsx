"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Clipboard, Upload, Image as ImageIcon, X, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface InsertContentComponentProps {
  onSubmit?: (content: {
    type: "text" | "image" | "empty";
    data: string | null;
    file?: File;
  }) => void;
  onClose?: () => void;
}

export default function InsertContentComponent({
  onSubmit,
  onClose,
}: InsertContentComponentProps) {
  const [textContent, setTextContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
            setSelectedFile(file);

            // Create preview URL
            const previewUrl = URL.createObjectURL(blob);
            setImagePreview(previewUrl);

            // Clear text content when image is pasted
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
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Clear text content when image is uploaded
      setTextContent("");
    } else {
      alert("Please select a valid image file");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (imagePreview && selectedFile) {
      onSubmit?.({
        type: "image",
        data: imagePreview,
        file: selectedFile,
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
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCloseOrClear = () => {
    const hasContent = textContent.trim() || imagePreview;
    if (hasContent) {
      handleClear();
    } else {
      onClose?.();
    }
  };

  const hasContent = textContent.trim() || imagePreview;

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
          disabled={!!imagePreview}
        />

        <Button
          onClick={handlePasteText}
          disabled={!!imagePreview}
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

        {imagePreview ? (
          <div className="space-y-2">
            <div className="relative border border-border rounded-md p-2 bg-card">
              <Button
                onClick={handleRemoveImage}
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 p-1 rounded-full cursor-pointer"
                aria-label="Remove image"
              >
                <X />
              </Button>
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-32 object-contain rounded"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedFile?.name || "Pasted image"}
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
              Upload Image
            </Button>
          </div>
        )}

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
