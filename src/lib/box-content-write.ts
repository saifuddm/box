import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { containsHtmlElements } from "@/lib/markdown";
import type { Database } from "@/utils/supabase/database.types";

type BinaryUploadType = "image" | "file";

interface UploadedBinaryContent {
  fileName: string;
  uploadType: BinaryUploadType;
  storagePath: string;
}

interface WriteBoxContentArgs {
  boxId: string;
  textContent?: string;
  files?: File[];
}

class BoxContentWriteError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BoxContentWriteError";
    this.status = status;
  }
}

function isBoxContentWriteError(error: unknown): error is BoxContentWriteError {
  return error instanceof BoxContentWriteError;
}

function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_NEXTJS_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function inferBinaryUploadType(file: { type: string }): BinaryUploadType {
  return file.type.startsWith("image/") ? "image" : "file";
}

function hasTextContent(textContent: string | null | undefined) {
  return Boolean(textContent?.trim());
}

function validateTextContent(textContent: string) {
  const trimmedTextContent = textContent.trim();

  if (!trimmedTextContent) {
    throw new BoxContentWriteError("Missing required field: textContent", 400);
  }

  if (containsHtmlElements(trimmedTextContent)) {
    throw new BoxContentWriteError(
      "HTML elements are not allowed in markdown content.",
      400,
    );
  }

  return trimmedTextContent;
}

function getTextContentValidationError(textContent: string) {
  try {
    validateTextContent(textContent);
    return null;
  } catch (error) {
    if (isBoxContentWriteError(error) && error.status === 400) {
      return error.message;
    }

    throw error;
  }
}

function buildAttachmentMarkdown(
  uploadedBinaryContent: UploadedBinaryContent[],
  boxId: string,
) {
  const imageLines = uploadedBinaryContent
    .filter((item) => item.uploadType === "image")
    .map((item) => {
      const query = new URLSearchParams({
        boxId,
        path: item.storagePath,
        uploadType: item.uploadType,
      });
      return `![${item.fileName}](/api/storage-content?${query.toString()})`;
    });

  const fileLines = uploadedBinaryContent
    .filter((item) => item.uploadType === "file")
    .map((item) => {
      const query = new URLSearchParams({
        boxId,
        path: item.storagePath,
        uploadType: item.uploadType,
      });
      return `[${item.fileName}](/api/storage-content?${query.toString()})`;
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

async function insertTextContent(
  supabase: SupabaseClient<Database>,
  boxId: string,
  textContent: string,
  hideContent: boolean,
) {
  const trimmedTextContent = validateTextContent(textContent);

  const { data, error } = await supabase
    .from("TextContent")
    .insert({
      box: boxId,
      hide_content: hideContent,
      content: trimmedTextContent,
    })
    .select("id, content, created_at")
    .single();

  if (error) {
    console.error("Error inserting text:", error);
    throw new BoxContentWriteError("Failed to insert text into database", 500);
  }

  return data;
}

async function uploadBinaryContent(
  supabase: SupabaseClient<Database>,
  boxId: string,
  file: File,
  hideContent: boolean,
  uploadType: BinaryUploadType = inferBinaryUploadType(file),
) {
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(uploadType === "image" ? "image-content" : "file-content")
    .upload(`${boxId}/${file.name}`, buffer, {
      contentType: file.type || "application/octet-stream",
    });

  if (uploadError) {
    console.error("Error uploading:", uploadError);
    throw new BoxContentWriteError("Failed to upload to storage", 500);
  }

  if (uploadType === "image") {
    const { data, error } = await supabase
      .from("ImageContent")
      .insert({
        box: boxId,
        content: uploadData.path,
        hide_content: hideContent,
      })
      .select("id, content, created_at")
      .single();

    if (error) {
      console.error("Error inserting image:", error);
      throw new BoxContentWriteError("Failed to insert into database", 500);
    }

    return {
      data,
      fileName: file.name,
      uploadType,
      storagePath: uploadData.path,
    };
  }

  const { data, error } = await supabase
    .from("FileContent")
    .insert({
      box: boxId,
      content: uploadData.path,
      hide_content: hideContent,
    })
    .select("id, content, created_at")
    .single();

  if (error) {
    console.error("Error inserting file:", error);
    throw new BoxContentWriteError("Failed to insert into database", 500);
  }

  return {
    data,
    fileName: file.name,
    uploadType,
    storagePath: uploadData.path,
  };
}

async function writeBoxContent({
  boxId,
  textContent = "",
  files = [],
}: WriteBoxContentArgs) {
  const supabase = createServiceRoleClient();
  const trimmedTextContent = textContent.trim();
  const hasText = hasTextContent(trimmedTextContent);
  const uploadedBinaryContent: UploadedBinaryContent[] = [];

  for (const file of files) {
    const uploaded = await uploadBinaryContent(supabase, boxId, file, hasText);
    uploadedBinaryContent.push({
      fileName: uploaded.fileName,
      uploadType: uploaded.uploadType,
      storagePath: uploaded.storagePath,
    });
  }

  if (hasText) {
    const attachmentMarkdown = buildAttachmentMarkdown(
      uploadedBinaryContent,
      boxId,
    );
    const finalTextContent = combineContent(
      trimmedTextContent,
      attachmentMarkdown,
    );

    await insertTextContent(supabase, boxId, finalTextContent, false);
  }
}

export {
  BoxContentWriteError,
  buildAttachmentMarkdown,
  combineContent,
  createServiceRoleClient,
  getTextContentValidationError,
  hasTextContent,
  inferBinaryUploadType,
  insertTextContent,
  isBoxContentWriteError,
  uploadBinaryContent,
  validateTextContent,
  writeBoxContent,
};
export type { BinaryUploadType, UploadedBinaryContent };
