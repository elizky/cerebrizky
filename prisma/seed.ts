import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import { ItemSource, ItemType, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config({ path: '.env.local' });
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const WRITINGS_DIR = path.join(process.cwd(), 'prisma', 'seed-writings');

type ParsedMarkdown = {
  title: string;
  content: string;
};

function stripNotionFilenameHash(name: string): string {
  return name
    .replace(/\s+[a-f0-9]{32}$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Drop Notion export property lines under the title. */
function stripNotionHeader(body: string): string {
  const lines = body.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line === '') {
      i += 1;
      continue;
    }
    if (
      /^(Category|Tags|Created time|Is Public|Last edited time|Created by|Last edited by):/i.test(
        line,
      )
    ) {
      i += 1;
      continue;
    }
    break;
  }
  return lines.slice(i).join('\n').trim();
}

function parseMarkdown(raw: string, fallbackTitle: string): ParsedMarkdown {
  const trimmed = raw.replace(/^\uFEFF/, '');
  const frontmatter = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (frontmatter) {
    const yaml = frontmatter[1];
    const body = stripNotionHeader(frontmatter[2].trim());
    const titleMatch = yaml.match(/^title:\s*(.+)$/m);
    const title = titleMatch?.[1]?.trim().replace(/^["']|["']$/g, '') || fallbackTitle;
    return { title, content: body };
  }

  const heading = trimmed.match(/^#\s+(.+)$/m);
  if (heading) {
    const title = heading[1].trim();
    const afterHeading = trimmed.replace(heading[0], '').trim();
    return { title, content: stripNotionHeader(afterHeading) };
  }

  return { title: fallbackTitle, content: stripNotionHeader(trimmed.trim()) };
}

async function listMarkdownFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await listMarkdownFiles(full)));
      } else if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith('.md') &&
        entry.name !== 'README.md'
      ) {
        files.push(full);
      }
    }
    return files.sort();
  } catch {
    return [];
  }
}

async function seedWritings(userId: string) {
  const files = await listMarkdownFiles(WRITINGS_DIR);
  if (files.length === 0) {
    console.log(`No .md files in ${WRITINGS_DIR}`);
    return;
  }

  let created = 0;
  let updated = 0;

  for (const file of files) {
    const seedKey = path.relative(WRITINGS_DIR, file).split(path.sep).join('/');
    const raw = await readFile(file, 'utf8');
    const fallbackTitle = stripNotionFilenameHash(path.basename(file, path.extname(file)));
    const { title, content } = parseMarkdown(raw, fallbackTitle);

    const existing = await db.item.findFirst({
      where: {
        userId,
        type: ItemType.WRITING,
        metadata: {
          path: ['seedKey'],
          equals: seedKey,
        },
      },
    });

    const metadata = { seedKey };

    if (existing) {
      await db.item.update({
        where: { id: existing.id },
        data: { title, content, metadata },
      });
      updated += 1;
    } else {
      await db.item.create({
        data: {
          userId,
          type: ItemType.WRITING,
          source: ItemSource.WEB,
          title,
          content,
          status: 'active',
          metadata,
        },
      });
      created += 1;
    }
  }

  console.log(`Writings seed: ${created} created, ${updated} updated (${files.length} files)`);
}

async function seedDemoVault(userId: string) {
  const existing = await db.item.count({ where: { userId } });
  if (existing > 0) {
    console.log('Demo vault skipped: user already has items');
    return;
  }

  const project = await db.item.create({
    data: {
      userId,
      type: ItemType.PROJECT,
      source: ItemSource.WEB,
      title: 'Cerebrizky MVP',
      content: 'Base del segundo cerebro personal.',
      status: 'active',
    },
  });

  const note = await db.item.create({
    data: {
      userId,
      type: ItemType.NOTE,
      source: ItemSource.WEB,
      title: 'Modelo unificado de Item',
      content:
        'Una sola tabla `Item`, tipada por enum, con tags y relaciones.\n\n- Captura primero\n- Clasificá después',
      status: 'active',
      projectId: project.id,
    },
  });

  await db.item.create({
    data: {
      userId,
      type: ItemType.TASK,
      source: ItemSource.WEB,
      title: 'Capturar la primera idea desde la web',
      status: 'todo',
      projectId: project.id,
    },
  });

  await db.item.create({
    data: {
      userId,
      type: ItemType.TASK,
      source: ItemSource.WEB,
      title: 'Probar el tablero de tareas',
      content: 'Arrastrar entre columnas.',
      status: 'doing',
      projectId: project.id,
    },
  });

  await db.item.create({
    data: {
      userId,
      type: ItemType.IDEA,
      source: ItemSource.WEB,
      title: 'Endpoint de captura ESP32 más adelante',
      content: 'Fase 2: ingest de dispositivos + clasificación con IA.',
      status: 'inbox',
    },
  });

  await db.item.create({
    data: {
      userId,
      type: ItemType.LINK,
      source: ItemSource.WEB,
      title: 'Docs de Prisma',
      url: 'https://www.prisma.io/docs',
      status: 'active',
    },
  });

  await db.item.create({
    data: {
      userId,
      type: ItemType.BOOK,
      source: ItemSource.WEB,
      title: 'Building a Second Brain',
      content: 'PARA y progressive summarization.',
      status: 'to_read',
      metadata: { author: 'Tiago Forte' },
    },
  });

  await db.item.create({
    data: {
      userId,
      type: ItemType.GAME,
      source: ItemSource.WEB,
      title: 'Hades II',
      content: 'Impresiones pendientes.',
      status: 'wishlist',
      metadata: { studio: 'Supergiant' },
    },
  });

  await db.item.create({
    data: {
      userId,
      type: ItemType.MUSIC,
      source: ItemSource.WEB,
      title: 'In Rainbows',
      status: 'to_listen',
      metadata: { artist: 'Radiohead', kind: 'album' },
    },
  });

  const tag = await db.tag.create({
    data: {
      userId,
      name: 'arquitectura',
      slug: 'arquitectura',
    },
  });

  await db.itemTag.create({
    data: { itemId: note.id, tagId: tag.id },
  });

  console.log('Demo vault seeded');
}

async function main() {
  const writingsEmail = process.env.SEED_USER_EMAIL ?? process.env.SEED_EMAIL;
  const demoEmail = process.env.SEED_EMAIL ?? 'izky@cerebrizky.local';
  const password = process.env.SEED_PASSWORD ?? 'cerebrizky';

  // Local demo user (password) — only used for empty-vault demo data
  const demoUser = await db.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: 'Izky',
      password: await bcrypt.hash(password, 10),
      emailVerified: new Date(),
    },
  });

  await seedDemoVault(demoUser.id);

  if (!writingsEmail) {
    console.log('SEED_USER_EMAIL not set — skipping writings import');
    return;
  }

  const writingsUser = await db.user.findUnique({ where: { email: writingsEmail } });
  if (!writingsUser) {
    console.log(
      `Writings skipped: no user with email ${writingsEmail}. Sign in with Google once, then re-seed.`,
    );
    return;
  }

  try {
    await stat(WRITINGS_DIR);
  } catch {
    console.log(`Writings folder missing: ${WRITINGS_DIR}`);
    return;
  }

  await seedWritings(writingsUser.id);
  console.log(`Writings imported for ${writingsEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
