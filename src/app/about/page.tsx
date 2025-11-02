import TextContent from "@/components/content/TextContent";
import React from "react";

function AboutPage() {
  return (
    <div
      id="content"
      className="grid grid-cols-1 lg:grid-cols-3 gap-2 col-span-2 lg:col-span-1"
    >
      <TextContent id="name" content="Hello, we are SUNKen SHIP" />
      <TextContent
        id="about"
        content="SUNKen SHIP is a creative technology collective dedicated to building tools, systems, and experiences that exist for the sake of innovation, design, and human curiosity rather than mere profit."
        className="lg:col-span-2 lg:row-span-2"
      />
      <TextContent id="links" content="https://sunken-ships.com" type="link" />
    </div>
  );
}

export default AboutPage;
