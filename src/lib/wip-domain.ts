import { z } from "zod";

export const literaryCategorySchema = z.enum([
  "cuento",
  "poesia",
  "novela",
  "ensayo",
]);

export const wipStatusSchema = z.enum(["in-progress", "blocked", "resolved"]);

const nullableBlockSchema = z
  .string()
  .trim()
  .max(1000, "El bloqueo no puede superar 1000 caracteres")
  .nullable()
  .optional();

export const createWipSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  content: z.string().trim().min(1, "El contenido es obligatorio"),
  category: literaryCategorySchema,
  currentBlock: nullableBlockSchema,
  status: wipStatusSchema.default("in-progress"),
  isDraft: z.boolean().default(false),
});

export const updateWipSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).optional(),
    category: literaryCategorySchema.optional(),
    currentBlock: nullableBlockSchema,
    status: wipStatusSchema.optional(),
    isDraft: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No se enviaron cambios",
  });

export const createWipCommentSchema = z.object({
  content: z.string().trim().min(1, "El comentario es obligatorio").max(1000),
  version: z.number().int().positive().optional(),
});

export const WIP_STATUS_LABELS = {
  "in-progress": "En progreso",
  blocked: "Bloqueado",
  resolved: "Resuelto",
} as const;

export const CATEGORY_LABELS = {
  cuento: "Cuento",
  poesia: "Poesía",
  novela: "Novela",
  ensayo: "Ensayo",
} as const;

