import type { Metadata } from "next";
import { PostMortemSearch } from "@/components/post-mortem/PostMortemSearch";

export const metadata: Metadata = {
  title: "Explorar Post-Mortems",
  description: "Busca reflexiones de escritores por palabras clave y categoría literaria.",
};

export default function PostMortemsPage() {
  return <PostMortemSearch />;
}
