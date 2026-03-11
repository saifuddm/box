"use client";
import { ClipboardIcon, Loader2 } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import { toast } from "sonner";
import {
  copyImageToClipboard,
  getMobileClipboardInfo,
} from "@/utils/imageClipboard";

interface ImageContentProps {
  boxId: string;
  id: string;
  src: string;
  alt: string;
  fromSupabase?: boolean;
}

function ImageContent({
  boxId,
  id,
  src,
  alt,
  fromSupabase,
}: ImageContentProps) {
  const [sourceUrl, setSourceUrl] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const getSignedUrl = useCallback(async () => {
    console.log(`Getting signed URL for: ${src}`);
    try {
      const response = await fetch("/api/storage-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxId, path: src, uploadType: "image" }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to fetch signed URL");
      }

      console.log("Signed URL:", payload);
      setSourceUrl(payload.signedUrl);
    } catch (error) {
      console.error("Error getting signed URL:", error);
      setError(`Error getting picture. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }, [boxId, src]);

  async function handleCopyImage() {
    setIsCopying(true);

    // Check mobile clipboard capabilities
    const clipboardInfo = getMobileClipboardInfo();

    if (clipboardInfo.requiresHttps) {
      console.warn("HTTPS required for clipboard operations on mobile");
    }

    try {
      await copyImageToClipboard(sourceUrl, {
        onSuccess: () => {
          toast("Image copied to clipboard");
        },
        onError: (error) => {
          console.error("Copy failed:", error.message);
        },
        onFallback: () => {
          toast("Image URL copied to clipboard", {
            description: "Paste the link to share the image",
          });
        },
      });
    } catch {
      toast.error("Failed to copy", {
        description:
          clipboardInfo.isMobile && clipboardInfo.requiresHttps
            ? "Clipboard requires HTTPS on mobile"
            : "Please try again",
      });
    } finally {
      setIsCopying(false);
    }
  }

  useEffect(() => {
    console.log(
      `ImageContent useEffect - fromSupabase: ${fromSupabase}, src: ${src}`
    );
    if (fromSupabase && sourceUrl === src) {
      // Only call getSignedUrl if we haven't already fetched a signed URL
      getSignedUrl();
    } else if (!fromSupabase) {
      setIsLoading(false);
    }
  }, [fromSupabase, getSignedUrl, src, sourceUrl]);

  return (
    <div id={id} className="bg-card border border-border rounded-md p-2 h-min">
      <div className="overflow-y-auto relative">
        {isLoading && fromSupabase ? (
          <div className="flex justify-center items-center h-32 bg-muted rounded">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-32 bg-muted rounded">
            <p className="text-sm text-destructive text-center px-4">{error}</p>
          </div>
        ) : (
          <div className="relative w-full h-auto">
            <Image
              src={sourceUrl}
              alt={alt}
              width={0}
              height={0}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover w-full h-auto"
              onLoad={() => {
                if (fromSupabase) {
                  setIsLoading(false);
                }
              }}
              onError={() =>
                setError("Error loading picture. Please try again.")
              }
            />
          </div>
        )}
      </div>
      <div className="flex justify-between mt-2">
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer hover:text-primary transition-colors"
          onClick={handleCopyImage}
          disabled={isCopying || isLoading || error !== null}
        >
          {isCopying ? (
            <Loader2 className=" animate-spin" />
          ) : (
            <ClipboardIcon />
          )}
        </Button>
      </div>
    </div>
  );
}

export default ImageContent;
