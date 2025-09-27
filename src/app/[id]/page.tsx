import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PasswordDialog from "./PasswordDialog";
import BoxContent from "./BoxContent";
import { Metadata } from "next";
import { cookies } from "next/headers";

interface BoxPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BoxPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const supabase = await createClient();

  // Get the box information for metadata
  const { data: box, error: boxError } = await supabase
    .from("PublicBox")
    .select("id, name")
    .eq("id", id)
    .single();

  if (boxError || !box || !box.name) {
    return {
      title: "Box Not Found",
      description: "The requested box could not be found.",
    };
  }

  return {
    title: `${box.name} | Box`,
    description: `View contents of ${box.name}`,
  };
}

export default async function BoxPage({ params }: BoxPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const supabase = await createClient();

  // Get the box information to check if it exists and if it's password protected
  const { data: box, error: boxError } = await supabase
    .from("PublicBox")
    .select("id, password_protected, name")
    .eq("id", id)
    .single();

  if (boxError || !box || !box.name) {
    console.error("Box not found or error:", boxError);
    redirect("/");
  }

  // Read token cookie (if present)
  const cookieStore = await cookies();
  const token = cookieStore.get(`box_token_${id}`)?.value;

  // If no token, show password dialog will authenticate without password
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PasswordDialog
          boxId={id}
          passwordProtected={box.password_protected || false}
        />
      </div>
    );
  }

  // Call the edge function to get the box content, attaching the token if present
  const { data: result, error: functionError } =
    await supabase.functions.invoke("get-box-content", {
      headers: { "x-box-token": token },
    });

  if (functionError) {
    const message = await functionError.context.text();
    const status = functionError.context.status;

    // If token is invalid/expired or function requires password, show dialog
    if (status === 401) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <PasswordDialog
            boxId={id}
            passwordProtected={box.password_protected || false}
          />
        </div>
      );
    }

    console.error("Function error:", message);
    redirect("/");
  }
  console.log("Result:", result);
  const content = result.data;
  return (
    <BoxContent boxId={id} boxName={box.name} initialContent={content || []} />
  );
}
