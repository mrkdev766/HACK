import { describe, it, expect } from 'vitest';
import {
  UsernameSchema,
  PlanTripSchema,
  CompleteMissionSchema,
  AIItinerarySchema,
} from '@/lib/validation/schemas';

describe('Wanderly Validation Schemas', () => {
  describe('UsernameSchema', () => {
    it('accepts valid alphanumeric usernames', () => {
      const valid = UsernameSchema.safeParse({ username: 'wanderer_42' });
      expect(valid.success).toBe(true);
    });

    it('rejects short usernames', () => {
      const short = UsernameSchema.safeParse({ username: 'a' });
      expect(short.success).toBe(false);
    });

    it('rejects usernames with spaces or special symbols', () => {
      const invalid = UsernameSchema.safeParse({ username: 'wanderer 42!' });
      expect(invalid.success).toBe(false);
    });
  });

  describe('PlanTripSchema', () => {
    it('accepts valid trip creation parameters', () => {
      const result = PlanTripSchema.safeParse({
        starting_location: 'Kochi, Kerala',
        budget_amount: 5000,
        currency: 'INR',
        duration_value: 2,
        duration_unit: 'days',
        transport_mode: 'public_transit',
        travel_style: 'nature',
      });
      expect(result.success).toBe(true);
    });

    it('rejects budget below minimum ₹100', () => {
      const result = PlanTripSchema.safeParse({
        starting_location: 'Kochi',
        budget_amount: 50,
        currency: 'INR',
        duration_value: 2,
        duration_unit: 'days',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid duration values', () => {
      const result = PlanTripSchema.safeParse({
        starting_location: 'Kochi',
        budget_amount: 2000,
        currency: 'INR',
        duration_value: 0,
        duration_unit: 'days',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CompleteMissionSchema', () => {
    it('accepts valid submission payload', () => {
      const result = CompleteMissionSchema.safeParse({
        note: 'Breathtaking sunset from the cliff top!',
        actual_spend: 1200,
        photo_urls: ['https://images.unsplash.com/photo-1234'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty or very short notes', () => {
      const result = CompleteMissionSchema.safeParse({
        note: 'Hi',
        actual_spend: 100,
        photo_urls: ['https://images.unsplash.com/photo-1234'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative actual spending', () => {
      const result = CompleteMissionSchema.safeParse({
        note: 'Valid notes about the journey experience',
        actual_spend: -50,
        photo_urls: ['https://images.unsplash.com/photo-1234'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects submissions with zero photos', () => {
      const result = CompleteMissionSchema.safeParse({
        note: 'Valid notes about the journey experience',
        actual_spend: 100,
        photo_urls: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AIItinerarySchema', () => {
    it('validates structured AI output', () => {
      const validItinerary = {
        trip_summary: 'Exciting trip along the Kerala coastline.',
        currency: 'INR',
        estimated_total_cost: 4000,
        destinations: [
          {
            sequence_number: 1,
            name: 'Varkala',
            description: 'Cliffside beach town',
            estimated_cost: 2000,
            estimated_travel_minutes: 90,
            image_url: 'https://images.unsplash.com/photo-1',
            mission: {
              title: 'Cliff Walk',
              instructions: 'Explore the cliffs',
              required_photo_count: 2,
              points: 100,
              explore_prompt: 'Explore cliffs',
            },
          },
          {
            sequence_number: 2,
            name: 'Alleppey',
            description: 'Canals and houseboats',
            estimated_cost: 2000,
            estimated_travel_minutes: 120,
            image_url: 'https://images.unsplash.com/photo-2',
            mission: {
              title: 'Canal Cruise',
              instructions: 'Cruise backwaters',
              required_photo_count: 2,
              points: 150,
              explore_prompt: 'Cruise canals',
            },
          },
        ],
      };

      const result = AIItinerarySchema.safeParse(validItinerary);
      expect(result.success).toBe(true);
    });
  });
});
