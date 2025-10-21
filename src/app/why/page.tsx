import TextContent from "@/components/content/TextContent";
import React from "react";

const WHY_CONTENT = [
  `I see the people that build products and services and showcase them to the world and I always wanted to do that, I have built a lot for other people and my job but I dont think I am getting any better. So this project serves two things, one is to build something cool that I would use myself and the other is to get feedback from the community on my code my design and my ideas.`,
  `This is my the github link to the project: https://github.com/saifuddm/box. I believe I have setup branch protection and hopefully not leaking any secrets, but if you do find some secret or some exploit on the site please please let me know. When I release new box features I will give you a preview as a thanks.`,
];

const USES_CONTENT = [
  `I create grocery lists and share with my family so they can add anything I missed, and because it gets deleted in 24 hours there is pressure for me to actually go and buy the grocery haha.`,
  `I use it to pass information between my devices from Iphone to Windows without having to sign in to anything, why not google drive? IDK`,
  `Used it one time to plan a party with friends. Food options, activities, locations.`,
  `My friend one time used it to send a PDF document to the public print computers.`,
];

function WhyPage() {
  return (
    <div
      id="content"
      className="grid grid-cols-1 lg:grid-cols-3 gap-2 col-span-2 lg:col-span-1"
    >
      <TextContent
        id="why"
        content="Why I built Box?"
        className="lg:col-span-3"
      />
      {WHY_CONTENT.map((content, index) => (
        <TextContent
          key={`content-${index}`}
          id={`content-${index}`}
          content={content}
        />
      ))}

      <TextContent
        id="uses"
        content="What do I use Box for?"
        className="lg:col-span-3"
      />
      {USES_CONTENT.map((content, index) => (
        <TextContent
          key={`content-uses-${index}`}
          id={`content-uses-${index}`}
          content={content}
        />
      ))}
    </div>
  );
}

export default WhyPage;
