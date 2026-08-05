'use client';

import { ItemType } from '@prisma/client';
import { Archive, ArchiveRestore, Link2, Save, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { TagCombobox } from '@/components/items/TagCombobox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  buildItemMetadata,
  readMetaString,
  readMusicKind,
  type MusicKind,
} from '@/lib/item-metadata';
import { copy, statusLabel } from '@/lib/copy';
import { cn } from '@/lib/utils';
import {
  DEFAULT_STATUS,
  hasWorkflow,
  isValidStatus,
  REGION_META,
  STATUS_OPTIONS,
} from '@/lib/validations/item';
import { archiveItem, deleteItem, restoreItem, updateItem } from '@/server/items';
import { createRelation, deleteRelation } from '@/server/relations';
import { assignTag, createTag, removeTag } from '@/server/tags';

type TagOption = { id: string; name: string };
type ProjectOption = { id: string; title: string };
type Relatable = { id: string; title: string; type: ItemType };

type ItemDetail = {
  id: string;
  title: string;
  type: ItemType;
  status: string;
  content: string | null;
  url: string | null;
  projectId: string | null;
  archivedAt: Date | null;
  metadata: unknown;
  tags: { tag: TagOption }[];
  relationsFrom: {
    id: string;
    target: { id: string; title: string; type: ItemType };
  }[];
  relationsTo: {
    id: string;
    source: { id: string; title: string; type: ItemType };
  }[];
};

type ItemDetailFormProps = {
  item: ItemDetail;
  tags: TagOption[];
  projects: ProjectOption[];
  relatableItems: Relatable[];
};

export function ItemDetailForm({ item, tags, projects, relatableItems }: ItemDetailFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(item.title);
  const [type, setType] = useState(item.type);
  const [status, setStatus] = useState(
    isValidStatus(item.type, item.status) ? item.status : DEFAULT_STATUS[item.type],
  );
  const [content, setContent] = useState(item.content ?? '');
  const [url, setUrl] = useState(item.url ?? '');
  const [projectId, setProjectId] = useState(item.projectId ?? 'none');
  const [author, setAuthor] = useState(readMetaString(item.metadata, 'author') ?? '');
  const [studio, setStudio] = useState(readMetaString(item.metadata, 'studio') ?? '');
  const [artist, setArtist] = useState(readMetaString(item.metadata, 'artist') ?? '');
  const [musicKind, setMusicKind] = useState<MusicKind>(readMusicKind(item.metadata));
  const [targetId, setTargetId] = useState('none');
  const [error, setError] = useState<string | null>(null);

  const assignedTagIds = useMemo(
    () => new Set(item.tags.map((entry) => entry.tag.id)),
    [item.tags],
  );

  const availableTags = tags.filter((tag) => !assignedTagIds.has(tag.id));
  const showStatus = hasWorkflow(type);
  const showProject = type !== ItemType.PROJECT;
  const showUrl = type === ItemType.LINK;
  const showAuthor = type === ItemType.BOOK;
  const showStudio = type === ItemType.GAME;
  const showMusicMeta = type === ItemType.MUSIC;
  const metaCols = 1 + (showStatus ? 1 : 0) + (showProject ? 1 : 0);
  const relations = [
    ...item.relationsFrom.map((relation) => ({
      id: relation.id,
      href: `/items/${relation.target.id}`,
      label: relation.target.title,
      typeLabel: REGION_META[relation.target.type].label,
      direction: '→' as const,
    })),
    ...item.relationsTo.map((relation) => ({
      id: relation.id,
      href: `/items/${relation.source.id}`,
      label: relation.source.title,
      typeLabel: REGION_META[relation.source.type].label,
      direction: '←' as const,
    })),
  ];

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        setError(null);
        await action();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : copy.items.actionFailed);
      }
    });
  }

  return (
    <div className='space-y-6'>
      <form
        id='item-edit-form'
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault();
          run(async () => {
            await updateItem({
              id: item.id,
              title,
              type,
              status: hasWorkflow(type) ? status : DEFAULT_STATUS[type],
              content,
              url: url || null,
              projectId: projectId === 'none' ? null : projectId,
              metadata: buildItemMetadata(type, { author, studio, artist, kind: musicKind }),
            });
            router.push(`/items/${item.id}`);
          });
        }}
      >
        <div className='-mt-2 mb-1 flex flex-wrap items-center gap-2'>
          <Badge variant='secondary'>{REGION_META[type].label}</Badge>
          {item.tags.map(({ tag }) => (
            <button
              key={tag.id}
              type='button'
              disabled={pending}
              aria-label={`${copy.relations.remove} #${tag.name}`}
              title={`${copy.relations.remove} #${tag.name}`}
              className='cursor-pointer disabled:opacity-50'
              onClick={() => run(() => removeTag({ itemId: item.id, tagId: tag.id }))}
            >
              <Badge variant='outline' className='gap-1 pr-1.5'>
                #{tag.name}
                <X className='size-3' />
              </Badge>
            </button>
          ))}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='edit-title'>{copy.items.title}</Label>
          <Input
            id='edit-title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div
          className={cn(
            'grid gap-4',
            metaCols === 1 && 'grid-cols-1',
            metaCols === 2 && 'sm:grid-cols-2',
            metaCols >= 3 && 'sm:grid-cols-3',
          )}
        >
          <div className='space-y-2'>
            <Label>{copy.items.type}</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                const next = v as ItemType;
                setType(next);
                setStatus(DEFAULT_STATUS[next]);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ItemType).map((value) => (
                  <SelectItem key={value} value={value}>
                    {REGION_META[value].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showStatus ? (
            <div className='space-y-2'>
              <Label>{copy.items.status}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS[type].map((value) => (
                    <SelectItem key={value} value={value}>
                      {statusLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {showProject ? (
            <div className='space-y-2'>
              <Label>{copy.items.project}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.items.none} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>{copy.items.none}</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        {showUrl || showAuthor || showStudio || showMusicMeta ? (
          <div
            className={cn(
              'grid gap-4',
              (showUrl && showAuthor) || showMusicMeta ? 'sm:grid-cols-2' : 'grid-cols-1',
            )}
          >
            {showUrl ? (
              <div className='space-y-2'>
                <Label htmlFor='edit-url'>{copy.items.url}</Label>
                <Input
                  id='edit-url'
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  type='url'
                />
              </div>
            ) : null}
            {showAuthor ? (
              <div className='space-y-2'>
                <Label htmlFor='edit-author'>{copy.items.author}</Label>
                <Input
                  id='edit-author'
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
            ) : null}
            {showStudio ? (
              <div className='space-y-2'>
                <Label htmlFor='edit-studio'>{copy.items.studio}</Label>
                <Input
                  id='edit-studio'
                  value={studio}
                  onChange={(e) => setStudio(e.target.value)}
                />
              </div>
            ) : null}
            {showMusicMeta ? (
              <>
                <div className='space-y-2'>
                  <Label>{copy.items.musicKind}</Label>
                  <Select value={musicKind} onValueChange={(v) => setMusicKind(v as MusicKind)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='album'>{copy.items.musicAlbum}</SelectItem>
                      <SelectItem value='track'>{copy.items.musicTrack}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='edit-artist'>{copy.items.artist}</Label>
                  <Input
                    id='edit-artist'
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label>{copy.tags.title}</Label>
            <TagCombobox
              options={availableTags}
              disabled={pending}
              onSelect={(tag) => run(() => assignTag({ itemId: item.id, tagId: tag.id }))}
              onCreate={(name) =>
                run(async () => {
                  const tag = await createTag({ name });
                  await assignTag({ itemId: item.id, tagId: tag.id });
                })
              }
            />
          </div>

          <div className='space-y-2'>
            <Label>{copy.relations.title}</Label>
            {relations.length > 0 ? (
              <ul className='space-y-1'>
                {relations.map((relation) => (
                  <li
                    key={relation.id}
                    className='flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5 text-sm'
                  >
                    <Link href={relation.href} className='min-w-0 flex-1 truncate hover:underline'>
                      <span className='text-muted-foreground'>{relation.direction} </span>
                      {relation.label}
                    </Link>
                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      disabled={pending}
                      aria-label={copy.relations.remove}
                      title={copy.relations.remove}
                      className='h-8 w-8'
                      onClick={() => run(() => deleteRelation(relation.id))}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className='flex items-center gap-2'>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.relations.selectItem} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>{copy.relations.selectItem}</SelectItem>
                  {relatableItems
                    .filter((candidate) => candidate.id !== item.id)
                    .map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.title} ({REGION_META[candidate.type].label})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type='button'
                size='icon'
                variant='outline'
                disabled={pending || targetId === 'none'}
                aria-label={copy.relations.link}
                title={copy.relations.link}
                onClick={() =>
                  run(async () => {
                    await createRelation({ sourceId: item.id, targetId });
                    setTargetId('none');
                  })
                }
              >
                <Link2 className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='edit-content'>{copy.items.content}</Label>
          <Textarea
            id='edit-content'
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
          />
        </div>
      </form>

      {error ? <p className='text-sm text-destructive'>{error}</p> : null}

      <div className='flex items-center justify-between border-t border-border pt-4'>
        <div className='flex items-center gap-2'>
          {item.archivedAt ? (
            <Button
              type='button'
              size='icon'
              variant='secondary'
              disabled={pending}
              aria-label={copy.items.restore}
              title={copy.items.restore}
              onClick={() => run(() => restoreItem(item.id))}
            >
              <ArchiveRestore className='h-4 w-4' />
            </Button>
          ) : (
            <Button
              type='button'
              size='icon'
              variant='secondary'
              disabled={pending}
              aria-label={copy.items.archive}
              title={copy.items.archive}
              onClick={() => run(() => archiveItem(item.id))}
            >
              <Archive className='h-4 w-4' />
            </Button>
          )}
          <Button
            type='button'
            size='icon'
            variant='destructive'
            disabled={pending}
            aria-label={copy.items.delete}
            title={copy.items.delete}
            onClick={() =>
              run(async () => {
                await deleteItem(item.id);
                router.push('/');
              })
            }
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
        <Button
          type='submit'
          form='item-edit-form'
          size='icon'
          disabled={pending}
          aria-label={copy.items.save}
          title={copy.items.save}
        >
          <Save className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
