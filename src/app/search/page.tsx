import { createClient } from "@/utils/supabase/server";
import SearchDialog from "./SearchDialog";
import { redirect } from "next/navigation";
import SearchResults from "./SearchResults";
import { Metadata } from "next";

interface SearchPageProps {
  searchParams: Promise<{
    q: string;
    error?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const { q } = resolvedSearchParams;

  if (!q || q.trim() === "") {
    return {
      title: "Box Search",
      description: "Search for boxes by name",
    };
  }

  return {
    title: `${q} | Box Search`,
    description: `Search results for "${q}"`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const { q, error } = resolvedSearchParams;

  // If no search query, show the search dialog
  if (!q || q.trim() === "" || error) {
    return <SearchDialog error={error} q={q} />;
  }

  // Search for boxes
  const supabase = await createClient();
  const { data: boxSearchResults, error: boxSearchError } = await supabase
    .from("PublicBox")
    .select("*")
    .ilike("name", `%${q}%`);

  if (boxSearchError) {
    console.error(boxSearchError);
    redirect(
      `/search?error=${encodeURIComponent(
        "Search failed. Please try again."
      )}&q=${encodeURIComponent(q)}`
    );
  }

  if (boxSearchResults.length === 0) {
    redirect(
      `/search?error=${encodeURIComponent(
        "No Box found."
      )}&q=${encodeURIComponent(q)}`
    );
  }

  if (boxSearchResults.length === 1) {
    redirect(`/${boxSearchResults[0].id}`);
  }

  return <SearchResults boxSearchResults={boxSearchResults} />;
}
