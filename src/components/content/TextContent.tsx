"use client";
import React from "react";
import { Button } from "../ui/button";
import { ClipboardIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TextContentProps {
  id: string;
  content: string;
  className?: string;
  type?: "text" | "link";
}
function fallbackCopyToClipboard(text: string): void {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    toast("Copied to clipboard");
  } catch {
    toast.error("Failed to copy");
  } finally {
    document.body.removeChild(textArea);
  }
}

function TextContent({
  id,
  content,
  className,
  type = "text",
}: TextContentProps) {
  return (
    <div
      id={id}
      className={cn(
        "bg-card border border-border rounded-md p-2 h-min",
        className
      )}
    >
      <div className="overflow-y-auto">
        {type === "link" ? (
          <a
            href={content}
            target="_blank"
            className="text-card-foreground whitespace-pre-wrap hover:text-primary transition-colors underline underline-offset-4"
          >
            {content}
          </a>
        ) : (
          <p className="text-card-foreground whitespace-pre-wrap">{content}</p>
        )}
      </div>
      <div className="flex justify-between mt-2">
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer hover:text-primary transition-colors"
          onClick={() => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard
                .writeText(content)
                .then(() => {
                  toast("Copied to clipboard");
                })
                .catch(() => {
                  fallbackCopyToClipboard(content);
                });
            } else {
              fallbackCopyToClipboard(content);
            }
          }}
        >
          <ClipboardIcon />
        </Button>
      </div>
    </div>
  );
}

export default TextContent;
