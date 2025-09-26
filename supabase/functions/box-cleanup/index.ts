import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log("Hello from Cleanup Expired Boxes!");

// Helper function to delete files from storage
async function deleteImageContent(supabaseClient: any, boxId: string) {
  const { data: fileList, error: listError } = await supabaseClient.storage
    .from("image-content")
    .list(`${boxId}/`);

  if (listError || !fileList || fileList.length === 0) {
    console.warn(`Warning: Could not list files for box ${boxId}:`, listError);
    return;
  }
  // If there are files, delete them
  const filePaths = fileList.map((file) => `${boxId}/${file.name}`);

  const { error: deleteFilesError } = await supabaseClient.storage
    .from("image-content")
    .remove(filePaths);

  if (deleteFilesError) {
    console.warn(
      `Warning: Could not delete files for box ${boxId}:`,
      deleteFilesError
    );
    throw new Error(
      `Could not delete files for box ${boxId}: ${deleteFilesError.message}`
    );
  } else {
    console.log(`Deleted ${filePaths.length} files for box ${boxId}`);
  }
}

// Helper function to delete files from storage
async function deleteFileContent(supabaseClient: any, boxId: string) {
  const { data: fileList, error: listError } = await supabaseClient.storage
    .from("file-content")
    .list(`${boxId}/`);

  if (listError || !fileList || fileList.length === 0) {
    console.warn(`Warning: Could not list files for box ${boxId}:`, listError);
    return;
  }
  // If there are files, delete them
  const filePaths = fileList.map((file) => `${boxId}/${file.name}`);

  const { error: deleteFilesError } = await supabaseClient.storage
    .from("file-content")
    .remove(filePaths);

  if (deleteFilesError) {
    console.warn(
      `Warning: Could not delete files for box ${boxId}:`,
      deleteFilesError
    );
    throw new Error(
      `Could not delete files for box ${boxId}: ${deleteFilesError.message}`
    );
  } else {
    console.log(`Deleted ${filePaths.length} files for box ${boxId}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for full access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Calculate the cutoff time (24 hours ago)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 23);

    console.log(
      `Looking for boxes created before: ${twentyFourHoursAgo.toISOString()}`
    );

    // Find boxes older than 24 hours
    const { data: expiredBoxes, error: queryError } = await supabaseClient
      .from("Box")
      .select("id, name, created_at")
      .lt("created_at", twentyFourHoursAgo.toISOString());

    if (queryError) {
      console.error("Error querying expired boxes:", queryError);
      return new Response(
        JSON.stringify({ error: "Failed to query expired boxes" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!expiredBoxes || expiredBoxes.length === 0) {
      console.log("No expired boxes found");
      return new Response(
        JSON.stringify({
          message: "No expired boxes found",
          deletedCount: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${expiredBoxes.length} expired boxes to delete`);

    const deletionResults = [];
    const errors = [];

    // Process each expired box
    for (const box of expiredBoxes) {
      try {
        console.log(`Processing box: ${box.id} (${box.name})`);

        // First, try to delete the storage folder for this box
        await deleteImageContent(supabaseClient, box.id);
        await deleteFileContent(supabaseClient, box.id);
        // Then delete the box record (this will cascade delete TextContent and ImageContent)
        const { error: deleteBoxError } = await supabaseClient
          .from("Box")
          .delete()
          .eq("id", box.id);

        if (deleteBoxError) {
          console.error(`Error deleting box ${box.id}:`, deleteBoxError);
          errors.push({
            boxId: box.id,
            boxName: box.name,
            error: deleteBoxError.message,
          });
        } else {
          console.log(`Successfully deleted box: ${box.id} (${box.name})`);
          deletionResults.push({
            boxId: box.id,
            boxName: box.name,
            createdAt: box.created_at,
          });
        }
      } catch (error) {
        console.error(`Unexpected error processing box ${box.id}:`, error);
        errors.push({
          boxId: box.id,
          boxName: box.name,
          error: error.message,
        });
      }
    }

    const response = {
      message: `Cleanup completed. ${deletionResults.length} boxes deleted.`,
      deletedCount: deletionResults.length,
      deletedBoxes: deletionResults,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("Cleanup results:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in cleanup-expired-boxes function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
