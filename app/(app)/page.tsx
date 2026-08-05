import { BrainHome } from "@/components/brain/BrainHome";
import { getBrainOverview } from "@/server/brain";

export default async function HomePage() {
  const { modules } = await getBrainOverview();

  return <BrainHome modules={modules} />;
}
