/**
 * (auth) Layout — Authentication Pages
 *
 * Wraps login, register, and password recovery pages.
 * Centered layout with no navigation bar.
 *
 * Module: GU (Gestión de Usuarios)
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
