import { ItemType } from '@prisma/client';

export type MusicKind = 'album' | 'track';

export function readMetaString(metadata: unknown, key: string): string | null {
  if (
    typeof metadata === 'object' &&
    metadata &&
    key in metadata &&
    typeof (metadata as Record<string, unknown>)[key] === 'string'
  ) {
    const value = (metadata as Record<string, string>)[key].trim();
    return value.length > 0 ? value : null;
  }
  return null;
}

export function readMusicKind(metadata: unknown): MusicKind {
  const kind = readMetaString(metadata, 'kind');
  return kind === 'track' ? 'track' : 'album';
}

export function buildItemMetadata(
  type: ItemType,
  fields: { author?: string; studio?: string; artist?: string; kind?: MusicKind },
): Record<string, string> | null {
  if (type === ItemType.BOOK) {
    const author = fields.author?.trim();
    return author ? { author } : null;
  }
  if (type === ItemType.GAME) {
    const studio = fields.studio?.trim();
    return studio ? { studio } : null;
  }
  if (type === ItemType.MUSIC) {
    const meta: Record<string, string> = { kind: fields.kind === 'track' ? 'track' : 'album' };
    const artist = fields.artist?.trim();
    if (artist) meta.artist = artist;
    return meta;
  }
  return null;
}
