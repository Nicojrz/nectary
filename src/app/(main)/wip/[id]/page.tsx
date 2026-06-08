/**
 * WIP Detail Page — RF-WP-01
 *
 * TODO: Implement WIP detail view with comments and status controls.
 * Assigned to: [TEAM MEMBER]
 */
export default function WIPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">WIP Detail</h1>
      <p className="text-muted-foreground">
        TODO: WIP detail with comments — RF-WP-01, RF-WP-02, RF-WP-03
      </p>
    </div>
  );
}
