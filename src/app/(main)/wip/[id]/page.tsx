import { WipDetail } from "@/components/wip/WipDetail";

export default async function WipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WipDetail id={id} />;
}
