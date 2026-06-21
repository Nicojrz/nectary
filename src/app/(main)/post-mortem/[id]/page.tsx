import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostMortemDetail } from "@/components/post-mortem/PostMortemDetail";
import { getPublicPostMortem, getPublicPostMortemIds } from "@/lib/post-mortems-public";

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const ids = await getPublicPostMortemIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicPostMortem(id);
  if (!data) return { title: "Post-Mortem no encontrado" };

  const description = data.item.lessons_learned.slice(0, 155);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    ?? process.env.NEXT_PUBLIC_APP_URL
    ?? "http://localhost:3000";
  const canonical = new URL(`/post-mortem/${id}`, siteUrl).toString();
  return {
    title: data.item.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: data.item.title,
      description,
      url: canonical,
      authors: data.item.author?.name ? [data.item.author.name] : undefined,
      publishedTime: data.item.created_at,
      modifiedTime: data.item.updated_at,
    },
  };
}

export default async function PostMortemDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getPublicPostMortem(id);
  if (!data) notFound();
  return <PostMortemDetail initialData={data} />;
}
