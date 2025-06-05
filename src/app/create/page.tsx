import CreateForm from "./CreateForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Box Create",
  description: "Create a new box to share information",
};

export default function CreateBoxPage() {
  return (
    <div className="grid grid-rows-[1.5rem_1fr_0.1fr] md:grid-rows-[1.5rem_1fr_0.1fr] md:grid-cols-[1fr_0.2fr] items-center justify-items-center md:justify-items-start min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-mono)] ">
      <h2 className="text-2xl">Create a new Box</h2>
      <p className="text-sm hidden md:block text-muted-foreground">Options</p>
      <CreateForm />
      <div className="text-sm self-start text-muted-foreground">
        <p className="md:hidden">Options</p>
        <p>TTL: 1d (24h)</p>
      </div>
    </div>
  );
}
