import { PrismaPg } from "@prisma/adapter-pg";
import { ItemSource, ItemType, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const email = process.env.SEED_EMAIL ?? "izky@cerebrizky.local";
  const password = process.env.SEED_PASSWORD ?? "cerebrizky";

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Izky",
      password: await bcrypt.hash(password, 10),
      emailVerified: new Date(),
    },
  });

  const existing = await db.item.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log("Seed skipped: vault already has items");
    return;
  }

  const project = await db.item.create({
    data: {
      userId: user.id,
      type: ItemType.PROJECT,
      source: ItemSource.WEB,
      title: "Cerebrizky MVP",
      content: "Ship the second brain foundation.",
      status: "active",
    },
  });

  const note = await db.item.create({
    data: {
      userId: user.id,
      type: ItemType.NOTE,
      source: ItemSource.WEB,
      title: "Unified Item model",
      content: "One Item table, typed by enum, tagged and related.",
      status: "active",
      projectId: project.id,
    },
  });

  await db.item.create({
    data: {
      userId: user.id,
      type: ItemType.TASK,
      source: ItemSource.WEB,
      title: "Capture first idea from the web UI",
      status: "todo",
      projectId: project.id,
    },
  });

  await db.item.create({
    data: {
      userId: user.id,
      type: ItemType.IDEA,
      source: ItemSource.WEB,
      title: "ESP32 capture endpoint later",
      content: "Phase 2: device ingest + AI classification.",
      status: "inbox",
    },
  });

  await db.item.create({
    data: {
      userId: user.id,
      type: ItemType.LINK,
      source: ItemSource.WEB,
      title: "Prisma docs",
      url: "https://www.prisma.io/docs",
      status: "active",
    },
  });

  await db.item.create({
    data: {
      userId: user.id,
      type: ItemType.BOOK,
      source: ItemSource.WEB,
      title: "Building a Second Brain",
      content: "PARA and progressive summarization.",
      status: "to_read",
      metadata: { author: "Tiago Forte" },
    },
  });

  const tag = await db.tag.create({
    data: {
      userId: user.id,
      name: "architecture",
      slug: "architecture",
    },
  });

  await db.itemTag.create({
    data: { itemId: note.id, tagId: tag.id },
  });

  console.log(`Seeded user ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
