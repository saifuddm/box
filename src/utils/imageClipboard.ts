/**
 * Utility for copying images to clipboard with comprehensive format support
 * Supports PNG, JPEG, WebP, GIF, and other formats with automatic conversion
 * Preserves original image dimensions and provides fallback to URL copying
 */

interface CopyImageOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onFallback?: () => void;
}

/**
 * Copies an image to the clipboard from a given URL
 * @param imageUrl - The URL of the image to copy
 * @param options - Optional callbacks for different states
 * @returns Promise<boolean> - True if successful, false if fallback was used
 */
export async function copyImageToClipboard(
  imageUrl: string,
  options: CopyImageOptions = {}
): Promise<boolean> {
  const { onSuccess, onError, onFallback } = options;

  // Check if clipboard API is available
  if (!navigator.clipboard || !window.ClipboardItem) {
    console.warn("Clipboard API not supported, falling back to URL copy");
    await fallbackToCopyUrl(imageUrl, onFallback);
    return false;
  }

  try {
    // Fetch the image as a blob
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const originalBlob = await response.blob();
    console.log("Original image type:", originalBlob.type);

    // Define supported formats for direct clipboard copy
    const directlySupportedTypes = ["image/png"];

    // Try direct copy for PNG first (most reliable)
    if (directlySupportedTypes.includes(originalBlob.type)) {
      try {
        const clipboardItem = new ClipboardItem({
          [originalBlob.type]: originalBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
        console.log("Image copied to clipboard successfully (direct blob)");
        onSuccess?.();
        return true;
      } catch (directError) {
        console.log("Direct PNG copy failed, trying conversion:", directError);
      }
    }

    // For all other formats (JPEG, WebP, GIF, etc.), convert to PNG
    const convertibleTypes = [
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
      "image/bmp",
      "image/tiff",
      "image/svg+xml",
    ];

    if (
      convertibleTypes.includes(originalBlob.type) ||
      originalBlob.type.startsWith("image/")
    ) {
      console.log(
        `Converting ${originalBlob.type} to PNG for clipboard compatibility`
      );

      const pngBlob = await convertImageToPng(imageUrl);

      const clipboardItem = new ClipboardItem({
        "image/png": pngBlob,
      });

      await navigator.clipboard.write([clipboardItem]);
      console.log("Image copied to clipboard successfully (converted to PNG)");
      onSuccess?.();
      return true;
    }

    // If we reach here, the format is not supported
    throw new Error(`Unsupported image format: ${originalBlob.type}`);
  } catch (error) {
    console.error("Error copying image to clipboard:", error);
    onError?.(error as Error);

    // Always fall back to copying URL
    await fallbackToCopyUrl(imageUrl, onFallback);
    return false;
  }
}

/**
 * Converts an image to PNG format while preserving original dimensions
 * @param imageUrl - The URL of the image to convert
 * @returns Promise<Blob> - The converted PNG blob
 */
async function convertImageToPng(imageUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = document.createElement("img");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    // Enable CORS for external images
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        // Use original image dimensions (not displayed size)
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        console.log(
          `Converting image: ${img.naturalWidth}x${img.naturalHeight}`
        );

        // Clear canvas with white background (important for transparent images)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image at original size
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

        // Convert to PNG blob with high quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`PNG conversion successful: ${blob.size} bytes`);
              resolve(blob);
            } else {
              reject(new Error("Failed to convert image to PNG blob"));
            }
          },
          "image/png",
          1.0 // Maximum quality
        );
      } catch (canvasError) {
        reject(new Error(`Canvas operation failed: ${canvasError}`));
      }
    };

    img.onerror = () => {
      reject(
        new Error(
          "Failed to load image for conversion. This may be due to CORS restrictions."
        )
      );
    };

    // Start loading the image
    img.src = imageUrl;
  });
}

/**
 * Fallback function to copy image URL to clipboard
 * @param imageUrl - The URL to copy
 * @param onFallback - Optional callback when fallback is used
 */
async function fallbackToCopyUrl(
  imageUrl: string,
  onFallback?: () => void
): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(imageUrl);
      console.log("Fallback: Image URL copied to clipboard");
    } else {
      // Last resort: use deprecated execCommand
      const textArea = document.createElement("textarea");
      textArea.value = imageUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      console.log("Fallback: Image URL copied using execCommand");
    }
    onFallback?.();
  } catch (fallbackError) {
    console.error("Failed to copy URL as fallback:", fallbackError);
    throw new Error("All clipboard copy methods failed");
  }
}

/**
 * Checks if the browser supports image clipboard operations
 * @returns boolean
 */
export function canCopyImagesToClipboard(): boolean {
  return !!(navigator.clipboard && window.ClipboardItem);
}

/**
 * Gets the supported image formats for clipboard operations
 * @returns string[]
 */
export function getSupportedImageFormats(): string[] {
  return [
    "image/png", // Direct support
    "image/jpeg", // Converted to PNG
    "image/jpg", // Converted to PNG
    "image/webp", // Converted to PNG
    "image/gif", // Converted to PNG (static frame)
    "image/bmp", // Converted to PNG
    "image/tiff", // Converted to PNG
    "image/svg+xml", // Converted to PNG
  ];
}
