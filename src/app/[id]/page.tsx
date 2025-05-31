import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PasswordDialog from "./PasswordDialog";
import BoxContent from "./BoxContent";

interface BoxPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pass?: string; error?: string }>;
}

export default async function BoxPage({ params, searchParams }: BoxPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const resolvedSearchParams = await searchParams;
  const { pass, error } = resolvedSearchParams;

  const supabase = await createClient();

  // Get the box information to check if it exists and if it's password protected
  const { data: box, error: boxError } = await supabase
    .from("PublicBox")
    .select("id, password_protected, name")
    .eq("id", id)
    .single();

  if (boxError || !box || !box.name) {
    redirect("/");
  }

  // If box is password protected and (no password provided OR there's an error), show password dialog

  if (box.password_protected && (!pass || error)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PasswordDialog boxId={id} />
      </div>
    );
  }

  // Always call the edge function - it handles both protected and non-protected boxes
  const { data: result, error: functionError } =
    await supabase.functions.invoke("get-box-content", {
      body: { boxId: id, password: pass || "" },
    });

  if (functionError) {
    const message = await functionError.context.text();
    const errorMessage = JSON.parse(message);

    console.log("Error message:", errorMessage.error);

    redirect(`/${id}?error=${encodeURIComponent(errorMessage.error)}`);
  }

  console.log("Result:", result);
  const content = result.data;
  return (
    <BoxContent boxId={id} boxName={box.name} initialContent={content || []} />
  );
}
