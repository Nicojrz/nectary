/**
 * (main) Layout — Authenticated App Shell
 *
 * Wraps all main application pages with:
 * - Top navigation bar (with creative state selector — RF-FD-03)
 * - Sidebar (optional)
 * - Notification bell
 *
 * All child routes require authentication (RNF-GU-02).
 */
import { Navbar } from "@/components/layout/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
