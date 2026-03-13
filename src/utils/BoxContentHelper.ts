type BinaryUploadType = "image" | "file";

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

interface UploadedBinaryContent {
  file: File;
  uploadType: BinaryUploadType;
  storagePath: string;
  fileUrl: string;
}

function inferBinaryUploadType(file: File): BinaryUploadType {
  return file.type.startsWith("image/") ? "image" : "file";
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

function buildAttachmentMarkdown(
  uploadedBinaryContent: UploadedBinaryContent[],
  boxId: string
) {
  const imageLines = uploadedBinaryContent
    .filter((item) => item.uploadType === "image")
    .map((item) => {
      const query = new URLSearchParams({
        boxId,
        path: item.storagePath,
        uploadType: item.uploadType,
      });
      return `![${item.file.name}](/api/storage-content?${query.toString()})`;
    });

  const fileLines = uploadedBinaryContent
    .filter((item) => item.uploadType === "file")
    .map((item) => {
      const query = new URLSearchParams({
        boxId,
        path: item.storagePath,
        uploadType: item.uploadType,
      });
      return `[${item.file.name}](/api/storage-content?${query.toString()})`;
    });

  const lines = [...imageLines, ...fileLines];
  if (lines.length === 0) {
    return "";
  }

  return `## Attachments\n\n${lines.join("\n")}`;
}

function combineContent(textContent: string, attachmentMarkdown: string) {
  const trimmedText = textContent.trim();
  if (!trimmedText) {
    return attachmentMarkdown;
  }
  if (!attachmentMarkdown) {
    return trimmedText;
  }
  return `${trimmedText}\n\n${attachmentMarkdown}`;
}

export {
  buildAttachmentMarkdown,
  combineContent,
  uploadBinaryContent,
  uploadTextContent,
};
export type { UploadedBinaryContent };
