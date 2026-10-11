import { AIItinerary, AIItinerarySchema, PlanTripInput } from '../validation/schemas';
import { generateSeededItinerary } from './seeded-trips';
import { TravelResearcherService } from './travel-researcher';
import { ImageCuratorService } from '@/lib/media/image-curator';

export interface PlannerResult {
  itinerary: AIItinerary;
  mode: 'gemini_ai_agent' | 'openai_agent' | 'seeded_demo' | 'research_grounded';
  notes: string;
}

export class TripPlannerService {
  /**
   * Proposes an intelligent, research-grounded mystery adventure itinerary
   * Powered by Google Gemini AI, free geospatial research (OSM/Nominatim), and budget economics.
   */
  static async planTrip(input: PlanTripInput): Promise<PlannerResult> {
    const geminiApiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      (process.env.AI_API_KEY?.startsWith('AIza') ? process.env.AI_API_KEY : undefined);

    const openAiApiKey =
      process.env.OPENAI_API_KEY ||
      (!process.env.AI_API_KEY?.startsWith('AIza') ? process.env.AI_API_KEY : undefined);

    const durationDays =
      input.duration_unit === 'hours'
        ? Math.max(1, Math.round(input.duration_value / 24))
        : input.duration_value;

    // 1. Autonomous Pre-flight Research (Free OSM Geocoding + Wikipedia + Regional Corridors)
    const research = await TravelResearcherService.researchRegion(input.starting_location);
    const budgetModel = TravelResearcherService.computeBudgetModel(
      input.budget_amount,
      durationDays,
      input.transport_mode
    );

    const suggestedCorridorText = research.verified_corridors.length
      ? `Verified Road/Rail Corridors: ${research.verified_corridors.join(' | ')}`
      : '';

    const suggestedStopsText = research.suggested_stops
      .map((s) => `- ${s.name} (${s.lat.toFixed(4)}°N, ${s.lng.toFixed(4)}°E): ${s.vibe}. Mystery Twist: "${s.secret_spot}"`)
      .join('\n');

    const modePromptGuide = {
      walking: `WALKING SPECIALIZATION:
- Spacing: Destinations MUST be close together within 1–4 km radii suitable for walking/hiking.
- Transit Focus: Pedestrian trails, heritage alleyways, walking minutes, zero/low transit fares, local walking food stalls.
- Mission Focus: Document walking milestones, pedestrian hidden gems, scenic footbridges, and local tea shops.`,
      public_transit: `PUBLIC TRANSIT SPECIALIZATION:
- Spacing: Connected via real public transport (Metro, State Buses, Suburban Trains, Water Ferries, Share Autos).
- Transit Focus: Exact local transit routes (e.g. Bus numbers, Metro line colors, Ferry routes), station-to-station fare estimates in INR (₹15–₹50 per leg).
- Mission Focus: Find secret local stops near bus/metro hubs, authentic street markets, and heritage bazaars.`,
      personal_vehicle: `PERSONAL VEHICLE / DRIVING SPECIALIZATION:
- Spacing: Scenic highway driving corridors, mountain ridges, or coastal loops (10–40 km distances).
- Transit Focus: Highway route numbers, parking availability, fuel/toll estimate allocations, roadside viewpoints & dhabas.
- Mission Focus: Off-grid viewpoints, scenic pull-overs, hidden hill trails, and local farm shops with parking access.`,
    }[input.transport_mode] || `PUBLIC TRANSIT SPECIALIZATION: Focus on local buses, metro, and share autos.`;

    const prompt = `You are Wanderly's elite Google Gemini AI Travel Adventure Architect & Grounded Geospatial Researcher.
Plan an exciting, highly feasible, budget-calibrated ${input.duration_value}-${input.duration_unit} multi-stop mystery adventure starting from "${input.starting_location}".

REAL-WORLD INTERNET & GEOSPATIAL DATA GROUNDING:
- Base all place names, food recommendations, and local markets on CURRENT real-world regional knowledge for ${input.starting_location}.
- Starting Coordinates: ${research.location.lat.toFixed(4)}° N, ${research.location.lng.toFixed(4)}° E (${research.location.display_name}).
${suggestedCorridorText ? `- ${suggestedCorridorText}` : ''}
${research.wikipedia_summary ? `- Regional Travel Intelligence: "${research.wikipedia_summary}"` : ''}

CANDIDATE STOPS & LOCAL SPOTS:
${suggestedStopsText}

MODE-TAILORED TRANSIT STRATEGY (${input.transport_mode.toUpperCase()}):
${modePromptGuide}

BUDGET ECONOMICS (Strict Ceiling: ₹${input.budget_amount} ${input.currency} for ${durationDays} days):
- Mode of Transit: ${input.transport_mode} (estimated transit rate: ~₹${budgetModel.transit_per_km}/km).
- Realistic Daily Accommodation: ~₹${budgetModel.daily_stay_budget}/day.
- Realistic Daily Local Meals & Chai: ~₹${budgetModel.daily_food_budget}/day.
- Adventure & Activity Buffer: ~₹${budgetModel.activities_budget}/day.
- Sum of all stop "estimated_cost" MUST NOT EXCEED ₹${input.budget_amount}.

TRAVELER PARAMETERS:
- Travel Style: ${input.travel_style}.
- Desired Vibe: ${input.vibe || 'scenic'}.
- Desired Climate: ${input.climate || 'any'}.
- Adventure Level: ${input.adventure_level || 'moderate'}.
- Preferred Activities: ${input.activities?.length ? input.activities.join(', ') : 'Open to thrills'}.
- Special Preferences: ${input.extra_preferences || 'None specified'}.

REQUIREMENTS:
1. Provide between 2 and 4 sequential stops along a logical real-world corridor.
2. Coordinates (latitude & longitude) must be genuine, realistic coordinates for India/region.
3. Incorporate mode-tailored transit notes in each description (specifying Metro line/Bus/Auto or Walking path or Parking tip).
4. Include itemized estimated costs for transport + food + entrance fees in each destination.
5. Each destination MUST include a thrilling, gamified "mission" with a mystery angle.

Respond ONLY with valid JSON conforming to this schema without markdown formatting:
{
  "trip_summary": "Inspiring 1-2 sentence overview capturing the mystery, chosen transit mode, and vibe",
  "currency": "INR",
  "estimated_total_cost": number <= ${input.budget_amount},
  "destinations": [
    {
      "sequence_number": 1,
      "name": "Stop Name",
      "description": "2 sentences describing what makes this stop exhilarating, including mode-specific transit tips (e.g. Bus #, Metro line, Walking route)",
      "verified_place_id": "optional_id",
      "latitude": number,
      "longitude": number,
      "estimated_cost": number,
      "estimated_travel_minutes": number,
      "image_url": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
      "mission": {
        "title": "Mission Name",
        "instructions": "Fun, clear mission steps with a secret challenge",
        "required_photo_count": 2,
        "points": 100,
        "explore_prompt": "Action item",
        "photo_prompt": "What to capture",
        "note_prompt": "What reflection to record"
      }
    }
  ]
}`;

    let lastError: string | null = null;

    // 2. Try Google Gemini AI Agent if key is configured
    if (geminiApiKey) {
      const candidateModels = [
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-flash-latest',
      ];
      for (const model of candidateModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
          const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(6000),
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
              },
            }),
          });

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

            if (rawText) {
              const cleanedText = rawText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
              const parsed = JSON.parse(cleanedText);
              
              // Post-process & calibrate with research data
              const calibrated = this.calibrateItinerary(parsed, input, research, budgetModel);
              const validated = AIItinerarySchema.parse(calibrated);

              return {
                itinerary: validated,
                mode: 'gemini_ai_agent',
                notes: `Synthesized live by Google Gemini (${model}) AI Agent with real-time geospatial research.`,
              };
            }
          } else {
            const errBody = await geminiResponse.text().catch(() => '');
            lastError = `Gemini (${model}) status ${geminiResponse.status}: ${errBody.slice(0, 150)}`;
            console.warn(lastError);
            if (geminiResponse.status === 400 || geminiResponse.status === 403 || geminiResponse.status === 429) {
              // Fail fast on invalid key or quota error to allow grounded fallback
              break;
            }
          }
        } catch (geminiErr: unknown) {
          const msg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
          lastError = `Gemini (${model}): ${msg}`;
          console.warn(`Gemini (${model}) planning attempt failed:`, lastError);
        }
      }
    }

    // 3. Try OpenAI if key is configured
    if (openAiApiKey) {
      try {
        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiApiKey}`,
          },
          signal: AbortSignal.timeout(25000),
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        if (openAiResponse.ok) {
          const jsonResponse = await openAiResponse.json();
          const content = jsonResponse.choices[0]?.message?.content;
          const parsed = JSON.parse(content);
          const calibrated = this.calibrateItinerary(parsed, input, research, budgetModel);
          const validated = AIItinerarySchema.parse(calibrated);

          return {
            itinerary: validated,
            mode: 'openai_agent',
            notes: 'Generated via live OpenAI Agent with geospatial grounding.',
          };
        }
      } catch (openAiErr) {
        console.warn('OpenAI planning failed:', openAiErr);
      }
    }

    // 4. Autonomous Grounded Itinerary Engine (Guaranteed fallback using live research data)
    const researchItinerary = this.buildResearchGroundedItinerary(input, research, budgetModel);
    return {
      itinerary: researchItinerary,
      mode: 'research_grounded',
      notes: `Generated by Wanderly Research Engine using OpenStreetMap geospatial corridors for "${input.starting_location}".`,
    };
  }

  /**
   * Calibrates AI output with genuine geospatial distances, image validation, and budget guardrails
   */
  private static calibrateItinerary(
    raw: any,
    input: PlanTripInput,
    research: any,
    budgetModel: any
  ): AIItinerary {
    const destinations = Array.isArray(raw.destinations) ? raw.destinations : [];
    let runningCost = 0;

    const calibratedDestinations = destinations.map((dest: any, idx: number) => {
      // Calculate realistic distance to previous stop if coordinates exist
      let realisticMinutes = dest.estimated_travel_minutes || 90;
      if (idx > 0 && dest.latitude && destinations[idx - 1]?.latitude) {
        const distKm = TravelResearcherService.calculateDistanceKm(
          destinations[idx - 1].latitude,
          destinations[idx - 1].longitude,
          dest.latitude,
          dest.longitude
        );
        realisticMinutes = Math.max(30, Math.round((distKm / 45) * 60)); // ~45 km/h average speed in regional India
      }

      // Ensure cost is proportional and realistic
      const allottedCost = Math.round(dest.estimated_cost || (input.budget_amount / destinations.length));
      runningCost += allottedCost;

      const defaultImages = [
        'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
      ];

      return {
        sequence_number: idx + 1,
        name: dest.name || `Waypoint ${idx + 1}`,
        description: dest.description || 'Scenic stop along the expedition corridor.',
        verified_place_id: dest.verified_place_id || `geo_${idx + 1}`,
        latitude: typeof dest.latitude === 'number' ? dest.latitude : 9.9312,
        longitude: typeof dest.longitude === 'number' ? dest.longitude : 76.2673,
        estimated_cost: allottedCost,
        image_url: dest.image_url?.includes('images.unsplash.com')
          ? dest.image_url
          : ImageCuratorService.getInstantImage(dest.name || '', idx),
        mission: {
          title: dest.mission?.title || 'Waypoint Quest',
          instructions: dest.mission?.instructions || 'Explore the landmark and document its surroundings.',
          required_photo_count: dest.mission?.required_photo_count || 2,
          points: dest.mission?.points || 100,
          explore_prompt: dest.mission?.explore_prompt || 'Explore the stop',
          photo_prompt: dest.mission?.photo_prompt || 'Take photos',
          note_prompt: dest.mission?.note_prompt || 'Record field observations',
        },
      };
    });

    const totalCost = Math.min(input.budget_amount, runningCost || input.budget_amount);

    return {
      trip_summary: raw.trip_summary || `Curated ${input.duration_value}-${input.duration_unit} expedition through ${input.starting_location}.`,
      currency: input.currency || 'INR',
      estimated_total_cost: totalCost,
      destinations: calibratedDestinations,
    };
  }

  /**
   * Builds an authentic, research-grounded itinerary directly from OSM and regional intelligence
   */
  private static buildResearchGroundedItinerary(
    input: PlanTripInput,
    research: any,
    budgetModel: any
  ): AIItinerary {
    const stopsPool = research.suggested_stops || [];
    const count = Math.min(Math.max(2, input.duration_value), 3);
    const selectedStops = stopsPool.slice(0, count);

    const costPerStop = Math.floor(input.budget_amount / selectedStops.length);

    const destinations = selectedStops.map((stop: any, idx: number) => {
      const resolvedImage = ImageCuratorService.getInstantImage(stop.name, idx);

      const modeKey = input.transport_mode as 'walking' | 'public_transit' | 'personal_vehicle';
      const transitTip = stop.transit_tips?.[modeKey] ||
        (modeKey === 'walking' ? 'Walkable pedestrian corridor.' : modeKey === 'personal_vehicle' ? 'Scenic driving route with local parking.' : 'Connected via local bus & metro routes.');

      return {
        sequence_number: idx + 1,
        name: stop.name,
        description: `${stop.description} Transit (${input.transport_mode.replace('_', ' ')}): ${transitTip} Mystery Spot: ${stop.secret_spot}`,
        verified_place_id: `osm_${idx + 1}`,
        latitude: stop.lat,
        longitude: stop.lng,
        estimated_cost: costPerStop,
        estimated_travel_minutes: modeKey === 'walking' ? 25 + idx * 15 : 45 + idx * 30,
        image_url: resolvedImage,
        mission: {
          title: `${stop.name} Mystery Quest`,
          instructions: `Locate ${stop.secret_spot}. (${transitTip}) Capture 2 field photos and note your impressions.`,
          required_photo_count: 2,
          points: 100 + idx * 50,
          explore_prompt: `Discover ${stop.secret_spot}`,
          photo_prompt: 'Capture 2 photos of this unique location',
          note_prompt: 'Reflect on how this off-grid spot feels',
        },
      };
    });

    return {
      trip_summary: `Research-grounded ${input.transport_mode.replace('_', ' ')} mystery expedition from ${input.starting_location} along the ${research.verified_corridors[0] || 'scenic trail'}.`,
      currency: input.currency || 'INR',
      estimated_total_cost: input.budget_amount,
      destinations,
    };
  }
}
