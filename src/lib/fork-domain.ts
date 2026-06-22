import { z } from "zod";
import { literaryCategorySchema, wipStatusSchema } from "@/lib/wip-domain";

export const forkablePostTypeSchema = z.enum(["spark", "wip"]);

const sparkResultSchema = z.object({
  content: z.string().trim().min(1, "El texto derivado es obligatorio").max(2000),
  category: literaryCategorySchema,
});

const wipResultSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  content: z.string().trim().min(1, "El texto derivado es obligatorio"),
  category: literaryCategorySchema,
  currentBlock: z.string().trim().max(1000).nullable().optional(),
  status: wipStatusSchema.default("in-progress"),
});

export const createForkSchema = z.discriminatedUnion("sourceType", [
  z.object({
    sourceId: z.string().uuid("El origen no es válido"),
    sourceType: z.literal("spark"),
    sourceVersion: z.literal(1).default(1),
    motivation: z.string().trim().min(1, "Explica por qué haces este fork").max(500),
    result: sparkResultSchema,
  }),
  z.object({
    sourceId: z.string().uuid("El origen no es válido"),
    sourceType: z.literal("wip"),
    sourceVersion: z.number().int().positive(),
    motivation: z.string().trim().min(1, "Explica por qué haces este fork").max(500),
    result: wipResultSchema,
  }),
]);

export type CreateForkInput = z.infer<typeof createForkSchema>;
