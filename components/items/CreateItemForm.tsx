'use client';

import { ItemType } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

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
import { buildItemMetadata, type MusicKind } from '@/lib/item-metadata';
import { copy, statusLabel } from '@/lib/copy';
import { cn } from '@/lib/utils';
import { DEFAULT_STATUS, hasWorkflow, REGION_META, STATUS_OPTIONS } from '@/lib/validations/item';
import { createItem } from '@/server/items';

type ProjectOption = { id: string; title: string };

type CreateItemFormProps = {
  defaultType: ItemType;
  projects?: ProjectOption[];
  defaultProjectId?: string;
  embedded?: boolean;
  onCreated?: () => void;
};

export function CreateItemForm({
  defaultType,
  projects = [],
  defaultProjectId,
  embedded = false,
  onCreated,
}: CreateItemFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<ItemType>(defaultType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState(DEFAULT_STATUS[defaultType]);
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? 'none');
  const [author, setAuthor] = useState('');
  const [studio, setStudio] = useState('');
  const [artist, setArtist] = useState('');
  const [musicKind, setMusicKind] = useState<MusicKind>('album');
  const [error, setError] = useState<string | null>(null);

  const showProject = type !== ItemType.PROJECT && projects.length > 0;
  const showStatus = hasWorkflow(type);
  const showUrl = type === ItemType.LINK;
  const showAuthor = type === ItemType.BOOK;
  const showStudio = type === ItemType.GAME;
  const showMusicMeta = type === ItemType.MUSIC;

  function onTypeChange(value: ItemType) {
    setType(value);
    setStatus(DEFAULT_STATUS[value]);
  }

  function resetFields(keep: { type: ItemType; projectId: string }) {
    setTitle('');
    setContent('');
    setUrl('');
    setAuthor('');
    setStudio('');
    setArtist('');
    setMusicKind('album');
    setStatus(DEFAULT_STATUS[keep.type]);
    setType(keep.type);
    setProjectId(keep.projectId);
  }

  function create(mode: 'open' | 'another') {
    startTransition(async () => {
      try {
        setError(null);
        const keptType = type;
        const keptProjectId = projectId;
        const item = await createItem({
          type,
          title,
          content: content || null,
          url: type === ItemType.LINK ? url : url || null,
          status: hasWorkflow(type) ? status : DEFAULT_STATUS[type],
          projectId: projectId === 'none' ? null : projectId,
          metadata: buildItemMetadata(type, { author, studio, artist, kind: musicKind }),
        });

        if (mode === 'another') {
          resetFields({ type: keptType, projectId: keptProjectId });
          router.refresh();
          return;
        }

        resetFields({
          type: defaultType,
          projectId: defaultProjectId ?? 'none',
        });
        onCreated?.();
        router.push(item.type === ItemType.PROJECT ? `/projects/${item.id}` : `/items/${item.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : copy.items.createFailed);
      }
    });
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    create('open');
  }

  const canSubmit = title.trim().length > 0 && (type !== ItemType.LINK || url.trim().length > 0);

  const metaCols = 1 + (showStatus ? 1 : 0) + (showProject ? 1 : 0);

  return (
    <form
      onSubmit={onSubmit}
      className={cn('space-y-3', !embedded && 'rounded-lg border border-border bg-popover p-4')}
    >
      <div className='space-y-1.5'>
        <Label htmlFor='create-title' className='text-xs text-muted-foreground'>
          {copy.items.title}
        </Label>
        <Input
          id='create-title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
          className='h-9'
        />
      </div>

      <div
        className={cn(
          'grid gap-2',
          metaCols === 1 && 'grid-cols-1',
          metaCols === 2 && 'grid-cols-2',
          metaCols >= 3 && 'grid-cols-2 sm:grid-cols-3',
        )}
      >
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground'>{copy.items.type}</Label>
          <Select value={type} onValueChange={(v) => onTypeChange(v as ItemType)}>
            <SelectTrigger className='h-9'>
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
          <div className='space-y-1.5'>
            <Label className='text-xs text-muted-foreground'>{copy.items.status}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='h-9'>
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
          <div className='space-y-1.5'>
            <Label className='text-xs text-muted-foreground'>{copy.items.project}</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className='h-9'>
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
            'grid gap-2',
            (showUrl && showAuthor) || showMusicMeta ? 'sm:grid-cols-2' : 'grid-cols-1',
          )}
        >
          {showUrl ? (
            <div className='space-y-1.5'>
              <Label htmlFor='create-url' className='text-xs text-muted-foreground'>
                {copy.items.url}
              </Label>
              <Input
                id='create-url'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                type='url'
                required
                className='h-9'
              />
            </div>
          ) : null}
          {showAuthor ? (
            <div className='space-y-1.5'>
              <Label htmlFor='create-author' className='text-xs text-muted-foreground'>
                {copy.items.author}
              </Label>
              <Input
                id='create-author'
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className='h-9'
              />
            </div>
          ) : null}
          {showStudio ? (
            <div className='space-y-1.5'>
              <Label htmlFor='create-studio' className='text-xs text-muted-foreground'>
                {copy.items.studio}
              </Label>
              <Input
                id='create-studio'
                value={studio}
                onChange={(e) => setStudio(e.target.value)}
                className='h-9'
              />
            </div>
          ) : null}
          {showMusicMeta ? (
            <>
              <div className='space-y-1.5'>
                <Label className='text-xs text-muted-foreground'>{copy.items.musicKind}</Label>
                <Select value={musicKind} onValueChange={(v) => setMusicKind(v as MusicKind)}>
                  <SelectTrigger className='h-9'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='album'>{copy.items.musicAlbum}</SelectItem>
                    <SelectItem value='track'>{copy.items.musicTrack}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='create-artist' className='text-xs text-muted-foreground'>
                  {copy.items.artist}
                </Label>
                <Input
                  id='create-artist'
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className='h-9'
                />
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className='space-y-1.5'>
        <Label htmlFor='create-content' className='text-xs text-muted-foreground'>
          {copy.items.content}
        </Label>
        <Textarea
          id='create-content'
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className='min-h-0 resize-y'
        />
      </div>

      {error ? <p className='text-sm text-destructive'>{error}</p> : null}

      <div className='flex flex-wrap justify-end gap-2 pt-1'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={pending || !canSubmit}
          onClick={() => create('another')}
        >
          {pending ? copy.items.creating : copy.items.createAnother}
        </Button>
        <Button type='submit' size='sm' disabled={pending || !canSubmit}>
          {pending ? copy.items.creating : copy.items.create}
        </Button>
      </div>
    </form>
  );
}
