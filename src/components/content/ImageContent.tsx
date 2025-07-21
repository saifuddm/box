import { ClipboardIcon, Loader2 } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "../ui/button";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { copyImageToClipboard, getMobileClipboardInfo } from "@/utils/imageClipboard";

interface ImageContentProps {
  id: string;
  src: string;
  alt: string;
  fromSupabase?: boolean;
}

const supabase = createClient();

function ImageContent({ id, src, alt, fromSupabase }: ImageContentProps) {
  const [sourceUrl, setSourceUrl] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const getSignedUrl = useCallback(async () => {
    console.log(`Getting signed URL for: ${src}`);
    try {
      const { data: signedUrl, error: signedUrlError } =
        await supabase.functions.invoke("get-storage-content", {
          method: "POST",
          body: JSON.stringify({ path: src }),
        });

      if (signedUrlError) {
        throw new Error(signedUrlError.message);
      }
      console.log("Signed URL:", signedUrl);
      setSourceUrl(signedUrl.signedUrl);
    } catch (error) {
      console.error("Error getting signed URL:", error);
      setError(`Error getting picture. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }, [src]);

  async function handleCopyImage() {
    setIsCopying(true);

    // Check mobile clipboard capabilities
    const clipboardInfo = getMobileClipboardInfo();
    
    if (clipboardInfo.requiresHttps) {
      console.warn("HTTPS required for clipboard operations on mobile");
    }

    await copyImageToClipboard(sourceUrl, {
      onSuccess: () => {
        console.log("Image copied successfully");
      },
      onError: (error) => {
        console.error("Copy failed:", error.message);
        // Show more specific error for mobile users
        if (clipboardInfo.isMobile && clipboardInfo.requiresHttps) {
          console.warn("Mobile clipboard requires HTTPS connection");
        }
      },
      onFallback: () => {
        console.log("Fallback: Image URL copied instead");
      },
    });

    setIsCopying(false);
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
          className="w-4 h-4 cursor-pointer hover:text-primary transition-colors"
          onClick={handleCopyImage}
          disabled={isCopying || isLoading}
        >
          {isCopying ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <ClipboardIcon />
          )}
        </Button>
      </div>
    </div>
  );
}

export default ImageContent;
