import { PostMortemEditor } from "@/components/post-mortem/PostMortemEditor";

export default async function CreatePostMortemPage({
  searchParams,
}: {
  searchParams: Promise<{ wip?: string }>;
}) {
  const { wip } = await searchParams;
  return <div className="mx-auto max-w-6xl"><PostMortemEditor initialWipId={wip} /></div>;
}
