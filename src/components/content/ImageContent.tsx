import { ClipboardIcon, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface ImageContentProps {
  id: string;
  src: string;
  alt: string;
  fromSupabase?: boolean;
  handleCheckboxChange: (id: string, checked: boolean) => void;
}
function ImageContent({
  id,
  src,
  alt,
  fromSupabase,
  handleCheckboxChange,
}: ImageContentProps) {
  const supabase = createClient();
  const [sourceUrl, setSourceUrl] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function getSignedUrl() {
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
  }

  useEffect(() => {
    if (fromSupabase) {
      console.log("Getting signed URL currently:", sourceUrl);
      getSignedUrl();
    } else {
      setIsLoading(false);
    }
  }, [fromSupabase]);

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
