import { ClipboardIcon } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";

interface ImageContentProps {
  id: string;
  src: string;
  alt: string;
  handleCheckboxChange: (id: string, checked: boolean) => void;
}
function ImageContent({
  id,
  src,
  alt,
  handleCheckboxChange,
}: ImageContentProps) {
  return (
    <div id={id} className="bg-card border border-border rounded-md p-2 h-min">
      <div className="overflow-y-auto">
        <img src={src} alt={alt} className="object-cover" />
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
            navigator.clipboard.writeText(src);
          }}
        >
          <ClipboardIcon />
        </Button>
      </div>
    </div>
  );
}

export default ImageContent;
