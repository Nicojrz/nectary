import { SparkDetail } from "@/components/spark/SparkDetail";

export default async function SparkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SparkDetail id={id} />;
}
