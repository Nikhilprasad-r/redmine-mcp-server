import type { RedmineClient } from "./client.js";

/**
 * Repeatedly GET a Redmine list JSON endpoint until all items are collected.
 */
export async function fetchAllRedmineList<TItem>(
  client: RedmineClient,
  path: string,
  baseQuery: Record<string, unknown>,
  listKey: string,
  maxPages: number,
  pageSize = 100,
): Promise<{ items: TItem[]; total_count: number }> {
  const items: TItem[] = [];
  let offset = 0;
  let total = 0;
  for (let page = 0; page < maxPages; page++) {
    const data = (await client.get<Record<string, unknown>>(path, {
      ...baseQuery,
      limit: pageSize,
      offset,
    })) as Record<string, unknown>;
    total = Number(data.total_count ?? 0);
    const batch = (data[listKey] as TItem[] | undefined) ?? [];
    items.push(...batch);
    offset += pageSize;
    if (batch.length === 0 || offset >= total) break;
  }
  return { items, total_count: total };
}
