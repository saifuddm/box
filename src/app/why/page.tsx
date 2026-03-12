import TextContent from "@/components/content/TextContent";
import React from "react";

const WHY_PAGE_MARKDOWN = `
# Why we built Box?

I see the people that build products and services and showcase them to the world and I always wanted to do that, I have built a lot for other people and my job but I dont think I am getting any better. So this project serves two things, one is to build something useful and the other is to build in public.

This is my the github link to the project: [box](https://github.com/saifuddm/box). The repository is public and I would love to get feedback on the code, design, and ideas.

# What do we use Box for?

- I create grocery lists and share with my family so they can add anything I missed, and because it gets deleted in 24 hours there is pressure for me to actually go and buy the grocery haha.
- I use it to pass information between my devices from Iphone to Windows without having to sign in to anything, why not google drive? IDK
- Used it one time to plan a party with friends. Food options, activities, locations.
- My friend one time used it to send a PDF document to the public print computers.
`;

function WhyPage() {
  return (
    <div
      id="content"
      className="grid grid-cols-1 lg:grid-cols-3 gap-2 col-span-2 lg:col-span-1"
    >
      <TextContent
        id="why"
        content={WHY_PAGE_MARKDOWN}
        className="lg:col-span-3"
      />
    </div>
  );
}

export default WhyPage;
