import { AppShell } from '@/components/layout/AppShell';
import { getBrainOverview } from '@/server/brain';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { modules, totalCount } = await getBrainOverview();
  const bands = modules
    .filter((module) => module.key !== 'search')
    .map((module) => ({
      key: module.key,
      weight: module.count,
    }));

  return (
    <AppShell bands={bands} totalCount={totalCount}>
      {children}
    </AppShell>
  );
}
