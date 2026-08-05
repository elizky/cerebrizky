import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <AppShell userName={session?.user?.name ?? session?.user?.email}>
      {children}
    </AppShell>
  );
}
