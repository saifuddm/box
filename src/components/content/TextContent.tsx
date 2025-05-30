import React from "react";
import { Button } from "../ui/button";
import { ClipboardIcon } from "lucide-react";

interface TextContentProps {
  id: string;
  content: string;
  handleCheckboxChange: (id: string, checked: boolean) => void;
}
function TextContent({ id, content, handleCheckboxChange }: TextContentProps) {
  return (
    <div id={id} className="bg-card border border-border rounded-md p-2 h-min">
      <div className="overflow-y-auto">
        <p className="text-card-foreground">{content}</p>
      </div>
      <div className="flex justify-between mt-2">
        <input
          type="checkbox"
          className="accent-primary"
          onChange={(e) => handleCheckboxChange(id, e.target.checked)}
        />

        <Button
          variant="outline"
          size="icon"
          className="w-4 h-4 cursor-pointer hover:text-primary transition-colors"
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
