import { RegionShell } from '@/components/brain/RegionShell';
import { ItemList } from '@/components/items/ItemList';
import { SearchForm } from '@/components/items/SearchForm';
import { copy } from '@/lib/copy';
import { searchItems } from '@/server/items';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const results = q ? await searchItems({ q }) : [];

  return (
    <RegionShell
      layoutId='region-search'
      title={copy.search.title}
      description={copy.search.description}
    >
      <div className='mb-6'>
        <SearchForm initialQuery={q ?? ''} />
      </div>
      {q ? (
        <ItemList items={results} />
      ) : (
        <p className='text-sm text-muted-foreground'>{copy.search.emptyHint}</p>
      )}
    </RegionShell>
  );
}
