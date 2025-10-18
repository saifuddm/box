import FileContent from "@/components/content/FileContent";
import ImageContent from "@/components/content/ImageContent";
import TextContent from "@/components/content/TextContent";
import React from "react";

function AboutPage() {
  return (
    <div
      id="content"
      className="grid grid-cols-1 lg:grid-cols-3 gap-2 col-span-2 lg:col-span-1"
    >
      <TextContent id="name" content="Hello, my name is Murtaza Saifuddin" />
      <TextContent
        id="about"
        content="I'm an electrical engineer by training and a software developer by passion, driven by a vivid imagination and a love of building things. I thrive on experimenting with new technologies and turning ideas into reality, whether I'm sketching web layouts or architecting scalable backends and shipping polished features. I enjoy every step of the creative journey, from initial design spark to final deployment, and I'm always eager to learn and improve myself."
        className="lg:col-span-2 lg:row-span-2"
      />
      <ImageContent
        id="picture"
        src="/github.webp"
        alt="Profile Picture"
        fromSupabase={false}
      />
      <FileContent
        id="resume"
        src="/resume.pdf"
        alt="Resume"
        fromSupabase={false}
      />
    </div>
  );
}

export default AboutPage;
