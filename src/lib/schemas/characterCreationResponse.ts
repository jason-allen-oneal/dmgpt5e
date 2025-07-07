import { z } from "zod"

export const CharacterCreationResponseSchema = z.object({
  response: z.object({
    message: z.string(),
    type: z.enum(["question", "information", "confirmation", "completion"]),
    options: z.array(z.string()),
    character: z.object({
      name: z.string().nullable(),
      race: z.string().nullable(),
      class: z.string().nullable(),
      background: z.string().nullable(),
      level: z.number(),
      abilityScores: z.object({
        str: z.number().nullable(),
        dex: z.number().nullable(),
        con: z.number().nullable(),
        int: z.number().nullable(),
        wis: z.number().nullable(),
        cha: z.number().nullable(),
      }),
      hp: z.number().nullable(),
      ac: z.number().nullable(),
      initiative: z.number().nullable(),
      proficiencies: z.array(z.string()),
      equipment: z.array(z.string()),
      spells: z.array(z.string()),
      features: z.array(z.string()),
      isComplete: z.boolean(),
    }),
  }),
})

export type CharacterCreationResponse = z.infer<typeof CharacterCreationResponseSchema> 