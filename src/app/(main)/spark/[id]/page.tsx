/**
 * Spark Detail Page — RF-SP-04
 *
 * Public URL for a single Spark with inline resource previews.
 * TODO: Implement Spark detail view with reactions and fork button.
 * Assigned to: [TEAM MEMBER]
 */
export default function SparkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Spark Detail</h1>
      <p className="text-muted-foreground">
        TODO: Spark detail view — RF-SP-04, RF-SP-05
      </p>
    </div>
  );
}
