"use client";
import { createClient } from "@/utils/supabase/client";
import { DownloadIcon, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";

const supabase = createClient();
interface FileContentProps {
  id: string;
  src: string;
  alt: string;
  fromSupabase?: boolean;
}

function FileContent({ id, src, alt, fromSupabase }: FileContentProps) {
  const [sourceUrl, setSourceUrl] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const getSignedUrl = useCallback(async () => {
    console.log(`Getting signed URL for: ${src}`);
    try {
      const { data: signedUrl, error: signedUrlError } =
        await supabase.functions.invoke("get-storage-content", {
          method: "POST",
          body: JSON.stringify({ path: src, uploadType: "file" }),
        });

      if (signedUrlError) {
        throw new Error(signedUrlError.message);
      }
      console.log("Signed URL:", signedUrl);
      setSourceUrl(signedUrl.signedUrl);
    } catch (error) {
      console.error("Error getting signed URL:", error);
      setError(`Error getting file. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }, [src]);

  async function handleDownloadFile() {
    setIsDownloading(true);
    try {
      const anchor = document.createElement("a");
      anchor.href = sourceUrl;
      anchor.download = alt;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError("Error downloading file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  useEffect(() => {
    console.log(
      `FileContent useEffect - fromSupabase: ${fromSupabase}, src: ${src}`
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
            <p className="text-sm text-destructive text-center px-4">
              <span className="font-bold">{alt}: </span>
              {error}
            </p>
          </div>
        ) : (
          <div className="relative w-full h-auto">
            <a
              href={sourceUrl}
              target="_blank"
              className="hover:text-primary transition-colors underline underline-offset-4"
            >
              {alt}
            </a>
          </div>
        )}
      </div>
      <div className="flex justify-between mt-2">
        <Button
          variant="outline"
          size="icon"
          className=" cursor-pointer hover:text-primary transition-colors"
          onClick={handleDownloadFile}
          disabled={isDownloading || isLoading || error !== null}
        >
          {isDownloading ? (
            <Loader2 className=" animate-spin" />
          ) : (
            <DownloadIcon />
          )}
        </Button>
      </div>
    </div>
  );
}

export default FileContent;
