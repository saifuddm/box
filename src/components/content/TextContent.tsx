"use client";
import React from "react";
import { Button } from "../ui/button";
import { ClipboardIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextContentProps {
  id: string;
  content: string;
  className?: string;
  type?: "text" | "link";
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
            navigator.clipboard.writeText(content);
          }}
        >
          <ClipboardIcon />
        </Button>
      </div>
    </div>
  );
}

export default TextContent;
