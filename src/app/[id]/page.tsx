import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PasswordDialog from "./PasswordDialog";
import BoxContent from "./BoxContent";

interface BoxPageProps {
  params: { id: string };
  searchParams: { pass?: string };
}

export default async function BoxPage({ params, searchParams }: BoxPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const resolvedSearchParams = await searchParams;
  const { pass } = resolvedSearchParams;

  const supabase = await createClient();

  // Get the box information to check if it exists and if it's password protected
  const { data: box, error: boxError } = await supabase
    .from("Box")
    .select("id, password_protected, name")
    .eq("id", id)
    .single();

  if (boxError || !box) {
    redirect("/");
  }

  // If box is password protected but no password provided, show password dialog
  if (box.password_protected && !pass) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PasswordDialog boxId={id} />
      </div>
    );
  }

  // Always call the edge function - it handles both protected and non-protected boxes
  try {
    const { data: result, error: functionError } =
      await supabase.functions.invoke("get-box-content", {
        body: { boxId: id, password: pass || null },
      });

    if (functionError) {
      console.error("Edge function error:", functionError);
      const errorMessage =
        functionError.message || "An error occurred. Please try again.";

      // If it's a password error and box is protected, show password dialog
      if (
        box.password_protected &&
        (functionError.message?.includes("Password") ||
          functionError.message?.includes("Invalid"))
      ) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <PasswordDialog boxId={id} error={errorMessage} />
          </div>
        );
      }

      // For other errors, redirect to home
      redirect("/");
    }

    const content = result.data;
    return (
      <BoxContent
        boxId={id}
        boxName={box.name}
        initialContent={content || []}
      />
    );
  } catch (error) {
    console.error("Error calling edge function:", error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PasswordDialog
          boxId={id}
          error="An error occurred. Please try again."
        />
      </div>
    );
  }
}
