import { z } from "zod";

export const paginationSchema = {
  limit: z.coerce.number().min(1).max(100).default(25),
  offset: z.coerce.number().min(0).default(0),
  fetch_all: z.boolean().optional(),
};

export const confirmDestructiveSchema = {
  confirm: z.literal(true).describe("Must be true to perform destructive action"),
};

export function idOrIdentifier(name: string) {
  return z.union([z.coerce.number().int().positive(), z.string().min(1)]).describe(name);
}
