import {
  buildAttachmentMarkdown,
  combineContent,
  inferBinaryUploadType,
  type UploadedBinaryContent as UploadedBinaryContentDescriptor,
} from "@/lib/box-content-write";

interface UploadBinaryContentArgs {
  boxId: string;
  file: File;
  hideContent: boolean;
}

interface UploadTextContentArgs {
  boxId: string;
  textContent: string;
  hideContent?: boolean;
}

interface UploadedBinaryContent extends UploadedBinaryContentDescriptor {
  file: File;
  fileUrl: string;
}

function parseApiError(rawBody: string, fallback: string) {
  try {
    const parsed = rawBody ? (JSON.parse(rawBody) as { error?: string }) : null;
    return parsed?.error || fallback;
  } catch {
    return rawBody || fallback;
  }
}

async function uploadBinaryContent({
  boxId,
  file,
  hideContent,
}: UploadBinaryContentArgs): Promise<UploadedBinaryContent> {
  const uploadType = inferBinaryUploadType(file);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("boxId", boxId);
  formData.append("uploadType", uploadType);
  formData.append("hideContent", String(hideContent));

  const response = await fetch("/api/upload-content", {
    method: "POST",
    body: formData,
  });

  const rawBody = await response.text();
  if (!response.ok) {
    throw new Error(parseApiError(rawBody, "Upload failed"));
  }

  let payload: { data?: { content?: string } } = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    throw new Error("Upload succeeded but response could not be parsed");
  }

  const storagePath = payload.data?.content;
  if (!storagePath) {
    throw new Error("Upload succeeded but no storage path was returned");
  }

  return {
    file,
    fileName: file.name,
    uploadType,
    storagePath,
    fileUrl: URL.createObjectURL(file),
  };
}

async function uploadTextContent({
  boxId,
  textContent,
  hideContent = false,
}: UploadTextContentArgs): Promise<void> {
  const formData = new FormData();
  formData.append("boxId", boxId);
  formData.append("uploadType", "text");
  formData.append("textContent", textContent);
  formData.append("hideContent", String(hideContent));

  const response = await fetch("/api/upload-content", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const rawBody = await response.text();
    throw new Error(parseApiError(rawBody, "Text upload failed"));
  }
}

export {
  buildAttachmentMarkdown,
  combineContent,
  uploadBinaryContent,
  uploadTextContent,
};
export type { UploadedBinaryContent };
