import type { ItemType } from '@prisma/client';

import messages from '@/messages/es.json';

export const copy = messages;

export function regionCopy(type: ItemType) {
  return copy.regions[type];
}

export function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function statusLabel(status: string): string {
  const labels = copy.statuses as Record<string, string>;
  return labels[status] ?? status;
}
