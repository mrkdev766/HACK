import { describe, it, expect } from 'vitest';
import { TripPlannerService } from '@/lib/ai/itinerary-planner';

describe('TripPlannerService', () => {
  it('generates a realistic itinerary within the user budget and duration', async () => {
    const input = {
      starting_location: 'Kochi, Kerala',
      budget_amount: 5000,
      currency: 'INR',
      duration_value: 2,
      duration_unit: 'days' as const,
      transport_mode: 'public_transit' as const,
      travel_style: 'nature' as const,
    };

    const result = await TripPlannerService.planTrip(input);

    expect(result.itinerary).toBeDefined();
    expect(result.itinerary.destinations.length).toBeGreaterThanOrEqual(2);
    expect(result.itinerary.estimated_total_cost).toBeLessThanOrEqual(input.budget_amount * 1.1);
    expect(result.itinerary.destinations[0].sequence_number).toBe(1);
    expect(result.itinerary.destinations[0].mission).toBeDefined();
    expect(result.itinerary.destinations[0].mission.points).toBeGreaterThan(0);
  }, 20000);
});
