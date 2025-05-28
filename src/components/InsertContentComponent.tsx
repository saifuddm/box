"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Clipboard, Upload, Image as ImageIcon, X } from "lucide-react";

interface InsertContentComponentProps {
  onSubmit?: (content: {
    type: "text" | "image";
    data: string;
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
      alert("Please add some content before submitting");
    }
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
        <button
          onClick={handlePasteText}
          disabled={!!imagePreview}
          className="w-full cursor-pointer bg-card text-card-foreground font-bold rounded-md px-4 py-2 hover:border-primary border-2 border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Clipboard className="w-4 h-4 mr-2 inline" />
          Paste Text from Clipboard
        </button>
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
              <button
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors cursor-pointer"
                aria-label="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
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
            <button
              onClick={handlePasteImage}
              disabled={!!textContent.trim()}
              className="h-auto py-3 flex-col cursor-pointer bg-card text-card-foreground font-bold rounded-md px-4 hover:border-primary border-2 border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Clipboard className="w-4 h-4 mb-1" />
              <span className="text-xs">Paste Image</span>
            </button>
            <button
              onClick={handleUploadClick}
              disabled={!!textContent.trim()}
              className="h-auto py-3 flex-col cursor-pointer bg-card text-card-foreground font-bold rounded-md px-4 hover:border-primary border-2 border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Upload className="w-4 h-4 mb-1" />
              <span className="text-xs">Upload Image</span>
            </button>
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
          <ImageIcon className="w-4 h-4 mr-2" />
          Add Content
        </Button>
        <button
          onClick={handleCloseOrClear}
          className="cursor-pointer bg-card text-card-foreground font-bold rounded-md px-4 py-2 hover:border-primary border-2 border-transparent transition-colors"
        >
          {hasContent ? "Clear" : "Close"}
        </button>
      </div>
    </div>
  );
}
