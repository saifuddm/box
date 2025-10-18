"use client";
import React from "react";
import { Button } from "../ui/button";
import { ClipboardIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextContentProps {
  id: string;
  content: string;
  className?: string;
}
function TextContent({ id, content, className }: TextContentProps) {
  return (
    <div
      id={id}
      className={cn(
        "bg-card border border-border rounded-md p-2 h-min",
        className
      )}
    >
      <div className="overflow-y-auto">
        <p className="text-card-foreground whitespace-pre-wrap">{content}</p>
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
