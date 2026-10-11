import { z } from 'zod';

export const UsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, { message: 'Username must be at least 2 characters' })
    .max(24, { message: 'Username cannot exceed 24 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username may only contain letters, numbers, and underscores',
    }),
});

export const PlanTripSchema = z.object({
  starting_location: z
    .string()
    .trim()
    .min(2, { message: 'Please enter a valid starting location' })
    .max(100, { message: 'Location name too long' }),
  budget_amount: z
    .number({ invalid_type_error: 'Budget must be a number' })
    .min(100, { message: 'Minimum budget is ₹100' })
    .max(10000000, { message: 'Budget exceeds maximum limit' }),
  currency: z.string().default('INR'),
  duration_value: z
    .number({ invalid_type_error: 'Duration must be a number' })
    .min(1, { message: 'Duration must be at least 1' })
    .max(30, { message: 'Duration must not exceed 30' }),
  duration_unit: z.enum(['hours', 'days']).default('days'),
  transport_mode: z
    .enum(['walking', 'public_transit', 'personal_vehicle'])
    .default('public_transit'),
  travel_style: z
    .string()
    .max(50)
    .default('mixed'),
  vibe: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val.join(', ') : val))
    .pipe(z.string().max(500))
    .default('scenic')
    .optional(),
  climate: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val.join(', ') : val))
    .pipe(z.string().max(500))
    .default('any')
    .optional(),
  adventure_level: z
    .string()
    .max(50)
    .default('moderate')
    .optional(),
  extra_preferences: z
    .string()
    .max(500, { message: 'Extra preferences note is too long' })
    .optional(),
  activities: z.array(z.string()).optional(),
});

export const CompleteMissionSchema = z.object({
  note: z
    .string()
    .trim()
    .min(5, { message: 'Please write at least 5 characters about your experience' })
    .max(1000, { message: 'Journal note is too long (max 1000 characters)' }),
  actual_spend: z
    .number({ invalid_type_error: 'Actual spend must be a number' })
    .min(0, { message: 'Actual spend cannot be negative' })
    .max(1000000, { message: 'Spend amount exceeds limit' }),
  photo_urls: z
    .array(z.string().url({ message: 'Each photo must be a valid image URL' }))
    .min(1, { message: 'Please upload at least 1 photo for this mission' })
    .max(6, { message: 'Maximum 6 photos allowed per mission' }),
  location_name: z.string().trim().max(120).optional(),
});

export const AIItinerarySchema = z.object({
  trip_summary: z.string(),
  currency: z.string().default('INR'),
  estimated_total_cost: z.number().nonnegative(),
  destinations: z
    .array(
      z.object({
        sequence_number: z.number().int().positive(),
        name: z.string().min(1),
        description: z.string().min(1),
        verified_place_id: z.string().nullable().optional(),
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
        estimated_cost: z.number().nonnegative(),
        estimated_travel_minutes: z.number().nonnegative(),
        image_url: z.string().url(),
        state_or_region: z.string().optional(),
        mission: z.object({
          title: z.string().min(1),
          instructions: z.string().min(1),
          required_photo_count: z.number().int().min(1).max(5),
          points: z.number().int().positive(),
          explore_prompt: z.string().min(1),
          photo_prompt: z.string().optional(),
          note_prompt: z.string().optional(),
        }),
      })
    )
    .min(2, { message: 'Itinerary must contain at least 2 destinations' })
    .max(6, { message: 'Itinerary may contain up to 6 destinations' }),
});

export type AIItinerary = z.infer<typeof AIItinerarySchema>;
export type PlanTripInput = z.infer<typeof PlanTripSchema>;
export type CompleteMissionInput = z.infer<typeof CompleteMissionSchema>;
