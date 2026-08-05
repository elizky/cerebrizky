import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { getBrainOverview } from "@/server/brain";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const { modules, totalCount } = await getBrainOverview();
  const auroraBands = modules
    .filter((module) => module.key !== "search")
    .map((module) => ({
      key: module.key,
      weight: module.count,
    }));

  return (
    <AppShell
      userName={session?.user?.name ?? session?.user?.email}
      auroraBands={auroraBands}
      totalCount={totalCount}
    >
      {children}
    </AppShell>
  );
}
