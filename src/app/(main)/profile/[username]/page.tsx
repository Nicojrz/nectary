/**
 * User Profile Page — RF-GU-04
 *
 * Public profile showing name, avatar, disciplines, XP, badges, and posts.
 * TODO: Implement profile page with karma display.
 * Assigned to: [TEAM MEMBER]
 */
export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Profile</h1>
      <p className="text-muted-foreground">
        TODO: Public profile — RF-GU-04, RF-KM-03
      </p>
    </div>
  );
}
