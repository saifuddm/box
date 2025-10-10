"use client";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import React, { useState } from "react";

function DevTesting() {
  const supabase = createClient();
  const [boxName, setBoxName] = useState("");

  const handleGetAllBoxes = async () => {
    const { data, error } = await supabase.from("PublicBox").select("*");
    console.log(data);
    console.log(error);
  };

  const handleGetSpecificBox = async ({ boxName }: { boxName: string }) => {
    const { data, error } = await supabase
      .from("PublicBox")
      .select("*")
      .eq("name", boxName);
    console.log(data);
    console.log(error);
  };

  return (
    <div id="content" className="grid grid-cols-2 lg:grid-cols-3 gap-2">
      <div>
        <h1>Get All Boxes</h1>
        <Button onClick={handleGetAllBoxes}>Run</Button>
      </div>
      <div>
        <h1>Get Specific Box</h1>
        <input
          type="text"
          id="boxName"
          onChange={(e) => setBoxName(e.target.value)}
          className="border border-gray-300 rounded-md p-2"
        />
        <Button onClick={() => handleGetSpecificBox({ boxName: boxName })}>
          Run
        </Button>
      </div>
    </div>
  );
}

export default DevTesting;
