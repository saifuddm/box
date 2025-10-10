import TextContent from "@/components/content/TextContent";
import React from "react";

function AboutPage() {
  return (
    <div
      id="content"
      className="grid grid-cols-1 lg:grid-cols-3 gap-2 col-span-2 lg:col-span-1"
    >
      <TextContent
        id="about"
        content="My name is Murtaza and I am a software engineer."
      />
    </div>
  );
}

export default AboutPage;
