import { z } from "zod";
import { literaryCategorySchema } from "@/lib/wip-domain";

const requiredSection = (label: string) =>
  z.string().trim().min(1, `${label} es obligatorio`);

export const createPostMortemSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  context: requiredSection("El contexto"),
  failedAttempts: requiredSection("Los intentos fallidos"),
  solution: requiredSection("La solución"),
  lessonsLearned: requiredSection("Las lecciones aprendidas"),
  category: literaryCategorySchema,
  wipOriginId: z.string().uuid("El WIP de origen no es válido").nullable().optional(),
});

export const updatePostMortemSchema = createPostMortemSchema
  .omit({ wipOriginId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No se enviaron cambios",
  });

export const POST_MORTEM_SECTIONS = [
  { key: "context", label: "Contexto", prompt: "¿Qué estabas escribiendo y qué querías lograr?" },
  { key: "failedAttempts", label: "Qué no funcionó", prompt: "¿Qué intentaste y por qué no resolvió el bloqueo?" },
  { key: "solution", label: "Qué funcionó", prompt: "¿Qué decisión o cambio te permitió avanzar?" },
  { key: "lessonsLearned", label: "Lecciones aprendidas", prompt: "¿Qué conservarás para futuros proyectos?" },
] as const;

