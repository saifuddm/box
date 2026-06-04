import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { setBoxTokenCookie } from "@/lib/box-token";
import {
  buildPasswordContent,
  generateBoxName,
  generatePassword,
} from "@/lib/quick-box-names";
import {
  isBoxContentWriteError,
  writeBoxContent,
} from "@/lib/box-content-write";

export const runtime = "nodejs";

const BOX_LIFETIME_MS = 24 * 60 * 60 * 1000;

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseBoolean(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return false;
  }

  return value === "true" || value === "1" || value.toLowerCase() === "yes";
}

function getStringValues(formData: FormData, names: string[]) {
  return names.flatMap((name) =>
    formData
      .getAll(name)
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function getFiles(formData: FormData) {
  return ["file", "files", "image", "images"].flatMap((name) =>
    formData
      .getAll(name)
      .filter((value): value is File => value instanceof File && value.size > 0),
  );
}

function buildTextContent(
  formData: FormData,
  password: string | null,
  includePasswordContent: boolean,
) {
  const textValues = getStringValues(formData, ["textContent", "text", "url"]);
  const contentParts = [...textValues];

  if (password && includePasswordContent) {
    contentParts.unshift(buildPasswordContent(password));
  }

  return contentParts.join("\n\n");
}

async function createBox(name: string, password: string | null) {
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke("create-box", {
    body: { name, password },
  });

  if (error) {
    let message = "Failed to create box";
    let status = error.context?.status ?? 500;

    try {
      const response = await error.context.json();
      if (response?.error) {
        message = response.error;
      }
    } catch {
      message = error.message || message;
      status = 500;
    }

    return { ok: false as const, error: { message, status } };
  }

  const box = data?.data;
  if (!box?.id || !box?.name || !box?.created_at) {
    return {
      ok: false as const,
      error: {
        message: "Box created but required metadata was not returned",
        status: 500,
      },
    };
  }

  return { ok: true as const, box };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const providedPassword =
      typeof formData.get("password") === "string"
        ? (formData.get("password") as string).trim()
        : "";
    const shouldGeneratePassword = parseBoolean(formData.get("generatePassword"));
    const includePasswordContent = parseBoolean(
      formData.get("includePasswordContent"),
    );
    const password = providedPassword || (shouldGeneratePassword ? generatePassword() : null);
    const boxName = generateBoxName();

    const createResult = await createBox(boxName, password);
    if (!createResult.ok) {
      return jsonResponse(
        { error: createResult.error.message },
        createResult.error.status,
      );
    }

    const box = createResult.box;
    const textContent = buildTextContent(
      formData,
      password,
      includePasswordContent,
    );
    const files = getFiles(formData);

    if (textContent.trim() || files.length > 0) {
      await writeBoxContent({ boxId: box.id, textContent, files });
    }

    await setBoxTokenCookie(box.id, true);

    const origin = request.nextUrl.origin;
    const createdAt = new Date(box.created_at);
    const expiresAt = new Date(createdAt.getTime() + BOX_LIFETIME_MS);

    return jsonResponse(
      {
        data: {
          boxId: box.id,
          boxName: box.name,
          boxUrl: `${origin}/${box.id}`,
          passwordProtected: Boolean(password),
          createdAt: createdAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
      },
      200,
    );
  } catch (error) {
    console.error("Error in quick-box API route:", error);
    if (isBoxContentWriteError(error)) {
      return jsonResponse({ error: error.message }, error.status);
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
}
