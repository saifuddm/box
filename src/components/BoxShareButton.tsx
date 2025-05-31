import React from "react";
import { Button } from "./ui/button";
import { ShareIcon } from "lucide-react";
import { toast } from "sonner";

interface BoxShareButtonProps {
  boxName: string;
  boxId: string;
}

function BoxShareButton({ boxName, boxId }: BoxShareButtonProps) {
  function handleShare(): void {
    console.log("Sharing box");

    const shareData = {
      title: `${boxName} - Box`,
      text: `Check out this box: ${boxName}`,
      url: `${window.location.origin}/${boxId}`,
    };

    // Check if the Web Share API is available
    if (navigator.share) {
      navigator.share(shareData).catch((error) => {
        console.error("Error sharing:", error);
        // Fallback to clipboard if share fails
        fallbackToClipboard(shareData.url);
      });
    } else {
      // Fallback to clipboard
      fallbackToClipboard(shareData.url);
    }
  }

  function fallbackToClipboard(url: string): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          console.log("Link copied to clipboard");
          toast("Box link copied to clipboard", {
            description: "Share with your friends",
          });
        })
        .catch((error) => {
          console.error("Failed to copy link:", error);
          // Fallback for older browsers
          fallbackCopyToClipboard(url);
        });
    } else {
      fallbackCopyToClipboard(url);
    }
  }

  function fallbackCopyToClipboard(url: string): void {
    // Create a temporary textarea element
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      console.log("Link copied to clipboard (fallback method)");
    } catch (error) {
      console.error("Failed to copy link (fallback method):", error);
    }

    document.body.removeChild(textArea);
  }

  return (
    <Button
      variant="outline"
      className="cursor-pointer"
      size="lg"
      onClick={handleShare}
    >
      <ShareIcon />
    </Button>
  );
}

export default BoxShareButton;
