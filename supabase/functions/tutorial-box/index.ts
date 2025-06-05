import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log("Hello from Tutorial Box Creation!");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the authorization token from the header
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized: No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract the token (format: "Bearer <token>")
    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!serviceRoleKey) {
      console.error("Service role key not found in environment");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the provided token matches the service role key
    if (token !== serviceRoleKey) {
      console.error("Invalid service role token provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid service role token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Service role authentication successful");

    // Create Supabase client with service role key for full access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey
    );

    // Create the Tutorial Box with no password
    const { data: newBox, error: boxError } = await supabaseClient
      .from("Box")
      .insert({
        name: "Tutorial",
        password_protected: false,
        password_hash: null,
      })
      .select("id, name, created_at, password_protected")
      .single();

    if (boxError || !newBox) {
      console.error("Error creating tutorial box:", boxError);
      return new Response(
        JSON.stringify({ error: "Failed to create tutorial box" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Tutorial box created with ID: ${newBox.id}`);

    // Create tutorial text contents explaining how to use a box
    const tutorialContents = [
      {
        content: `🎉 Welcome to Box!

This is your Tutorial box - a demonstration of how Box works.

Box is a simple, temporary sharing platform where you can:
• Share text notes and ideas
• Upload and share images
• Collaborate without accounts
• Set passwords for privacy`,
        box: newBox.id,
      },
      {
        content: `📝 How to Add Content

To add content to any box:
1. Click the "+" button
2. Type your text or paste from clipboard
3. Or upload an image by clicking "Choose Image"
4. Submit to add it to the box

All content is displayed in a beautiful masonry layout!`,
        box: newBox.id,
      },
      {
        content: `🔒 Privacy & Security

Boxes can be:
• Public (like this one) - anyone with the link can view
• Password protected - requires a password to access

⏰ Auto-Cleanup
All boxes automatically expire after 24 hours to keep the platform clean and private.`,
        box: newBox.id,
      },
      {
        content: `🚀 Getting Started

1. Create your own box at the homepage
2. Share the link with others
3. Start collaborating!

Remember: This tutorial box will be recreated daily, so feel free to experiment and add your own content here!`,
        box: newBox.id,
      },
    ];

    // Insert all tutorial text contents
    const { data: textContents, error: textError } = await supabaseClient
      .from("TextContent")
      .insert(tutorialContents)
      .select("id, content, created_at");

    if (textError) {
      console.error("Error creating tutorial text contents:", textError);
      // Don't fail the whole operation if text content creation fails
      console.warn("Continuing despite text content creation error");
    } else {
      console.log(
        `Created ${textContents?.length || 0} tutorial text contents`
      );
    }

    const response = {
      message: "Tutorial box created successfully",
      box: newBox,
      textContentsCount: textContents?.length || 0,
      url: `${Deno.env.get("SITE_URL") || "http://localhost:3000"}/${
        newBox.id
      }`,
    };

    console.log("Tutorial box creation completed:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in tutorial-box function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
