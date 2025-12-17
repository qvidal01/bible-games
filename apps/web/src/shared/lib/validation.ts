// Input validation schemas using Zod
import { z } from 'zod';

// Player name validation
export const playerNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(20, 'Name must be 20 characters or less')
  .transform((name) => name.trim().replace(/[<>]/g, ''));

// Room code validation
export const roomCodeSchema = z
  .string()
  .length(6, 'Room code must be 6 characters')
  .regex(/^[A-Z0-9]+$/, 'Room code must be uppercase letters and numbers')
  .transform((code) => code.toUpperCase());

// Join game validation
export const joinGameSchema = z.object({
  playerName: playerNameSchema,
  roomCode: roomCodeSchema,
});

// URL validation for Zoom/Meet links
export const meetingLinkSchema = z
  .string()
  .url('Invalid URL format')
  .refine(
    (url) => {
      const validDomains = [
        'zoom.us',
        'meet.google.com',
        'teams.microsoft.com',
        'webex.com',
        'discord.gg',
        'discord.com',
      ];
      try {
        const urlObj = new URL(url);
        return validDomains.some(domain => urlObj.hostname.includes(domain));
      } catch {
        return false;
      }
    },
    { message: 'Link must be from Zoom, Google Meet, Teams, WebEx, or Discord' }
  )
  .optional()
  .or(z.literal(''));

// Room name validation
export const roomNameSchema = z
  .string()
  .max(50, 'Room name must be 50 characters or less')
  .transform((name) => name.trim().replace(/[<>]/g, ''))
  .optional();

// Room description validation
export const roomDescriptionSchema = z
  .string()
  .max(200, 'Description must be 200 characters or less')
  .transform((desc) => desc.trim().replace(/[<>]/g, ''))
  .optional();

// Create game validation (enhanced with room options)
export const createGameSchema = z.object({
  playerName: playerNameSchema,
  roomName: roomNameSchema,
  zoomLink: meetingLinkSchema,
  zoomPassword: z.string().max(20).optional(),
  description: roomDescriptionSchema,
  isPrivate: z.boolean().optional().default(false),
  maxPlayers: z.number().int().min(2).max(15).optional().default(10),
  gameType: z.enum(['jeopardy', 'family-feud', 'tic-tac-toe', 'memory-match', 'go-fish']).optional().default('jeopardy'),
});

// Broadcast event validation
export const broadcastEventSchema = z.object({
  roomCode: roomCodeSchema,
  event: z.string().min(1),
  data: z.unknown(),
});

// Validate and sanitize player name
export function sanitizePlayerName(name: string): string {
  const result = playerNameSchema.safeParse(name);
  return result.success ? result.data : name.slice(0, 20).trim().replace(/[<>]/g, '');
}

// Validate room code format
export function isValidRoomCode(code: string): boolean {
  return roomCodeSchema.safeParse(code).success;
}

// Generate a random room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
