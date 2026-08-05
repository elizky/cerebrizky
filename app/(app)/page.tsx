import { BrainHome } from "@/components/brain/BrainHome";
import { getBrainRegions } from "@/server/brain";

export default async function HomePage() {
  const { regions, inboxCount, totalCount } = await getBrainRegions();

  return (
    <BrainHome
      regions={regions}
      inboxCount={inboxCount}
      totalCount={totalCount}
    />
  );
}
