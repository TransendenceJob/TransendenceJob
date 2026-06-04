import { z } from 'zod';

export const AchievementSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  type: z.string().optional(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  xpReward: z.number().int().nullable().optional(),
  points: z.number().int().nullable().optional(),
  progress: z.number().int().nullable().optional(),
  progressTarget: z.number().int().nullable().optional(),
  achieved: z.boolean().optional(),
  achievedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const PlayerStatsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  xp: z.number().int().default(0),
  level: z.number().int().default(1),
  wins: z.number().int().default(0),
  losses: z.number().int().default(0),
  kills: z.number().int().default(0),
  deaths: z.number().int().default(0),
  damageDealt: z.number().int().default(0),
  damageTaken: z.number().int().default(0),
  matchHistory: z.array(z.unknown()).default([]),
  weapons: z.array(z.unknown()).default([]),
  achievements: z.array(z.union([z.string(), AchievementSchema])).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type PlayerStats = z.infer<typeof PlayerStatsSchema>;
