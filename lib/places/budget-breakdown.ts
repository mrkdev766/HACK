/**
 * Budget Breakdown Library
 * Provides realistic itemized cost estimates for destinations:
 * Transport, Food, Accommodation, Activities
 */

export interface BudgetLineItem {
  id: string;
  category: 'transport' | 'food' | 'accommodation' | 'activity' | 'misc';
  label: string;
  detail: string;
  estimated_cost: number;
  actual_cost?: number | null;
  is_recommended?: boolean;
  icon: string;
}

export interface TransportOption {
  id: string;
  mode: string;
  label: string;
  detail: string;
  estimated_cost: number;
  duration: string;
  icon: string;
  is_budget_pick?: boolean;
}

export interface DestinationBudgetBreakdown {
  transport_options: TransportOption[];
  recommended_transport_id: string;
  line_items: BudgetLineItem[];
  total_estimated: number;
  budget_tips: string[];
}

const BEACH_KEYS = ['beach', 'coast', 'sea', 'ocean', 'shore', 'bay', 'kovalam', 'varkala'];
const MOUNTAIN_KEYS = ['hill', 'mountain', 'valley', 'peak', 'ridge', 'ooty', 'munnar'];
const HERITAGE_KEYS = ['temple', 'palace', 'fort', 'heritage', 'ancient', 'historical', 'museum'];
const BACKWATER_KEYS = ['backwater', 'lake', 'canal', 'river', 'houseboat', 'alleppey', 'alappuzha', 'kumarakom', 'vembanad'];
const CITY_KEYS = ['city', 'town', 'market', 'bazaar', 'shopping', 'kochi', 'thiruvananthapuram', 'trivandrum'];
const FOREST_KEYS = ['forest', 'wildlife', 'jungle', 'national park', 'sanctuary', 'reserve', 'periyar', 'wayanad'];

function matchesAny(name: string, keys: string[]): boolean {
  const lower = name.toLowerCase();
  return keys.some((k) => lower.includes(k));
}

function detectProfile(destName: string): string {
  if (matchesAny(destName, BACKWATER_KEYS)) return 'backwater';
  if (matchesAny(destName, BEACH_KEYS)) return 'beach';
  if (matchesAny(destName, MOUNTAIN_KEYS)) return 'mountain';
  if (matchesAny(destName, HERITAGE_KEYS)) return 'heritage';
  if (matchesAny(destName, FOREST_KEYS)) return 'forest';
  if (matchesAny(destName, CITY_KEYS)) return 'city';
  return 'generic';
}

const PROFILES: Record<string, DestinationBudgetBreakdown> = {
  backwater: {
    transport_options: [
      { id: 'auto', mode: 'auto', label: 'Shared Auto-Rickshaw', detail: 'From bus stand to waterfront ghats', estimated_cost: 40, duration: '15 min', icon: '🛺', is_budget_pick: true },
      { id: 'boat_shared', mode: 'boat', label: 'Public Ferry / KSRTC Boat', detail: 'Scenic waterway state ferry', estimated_cost: 15, duration: '2–4 hrs', icon: '⛵', is_budget_pick: true },
      { id: 'houseboat', mode: 'houseboat', label: 'Overnight Houseboat', detail: 'Kettuvallam with meals included', estimated_cost: 4500, duration: '22 hrs', icon: '🛶' },
      { id: 'taxi', mode: 'taxi', label: 'Private Taxi / OLA', detail: 'Comfortable private ride from station', estimated_cost: 350, duration: '35 min', icon: '🚕' },
    ],
    recommended_transport_id: 'auto',
    line_items: [
      { id: 'l1', category: 'transport', label: 'Shared Auto to Boat Jetty', detail: 'Railway/bus station → boat ghat', estimated_cost: 40, icon: '🛺', is_recommended: true },
      { id: 'l2', category: 'transport', label: 'Public Ferry Ride', detail: 'Alappuzha–Kottayam scenic route', estimated_cost: 15, icon: '⛵' },
      { id: 'l3', category: 'food', label: 'Karimeen fish fry breakfast', detail: 'Lakeview restaurant near jetty', estimated_cost: 180, icon: '🍽️' },
      { id: 'l4', category: 'food', label: 'Kerala Sadya (banana leaf)', detail: 'Set lunch at local restaurant', estimated_cost: 120, icon: '🌿' },
      { id: 'l5', category: 'food', label: 'Evening tea + banana chips', detail: 'Local stall near canal', estimated_cost: 40, icon: '☕' },
      { id: 'l6', category: 'activity', label: 'Shikara rowboat hire', detail: '1-hour sunset row across backwaters', estimated_cost: 400, icon: '🚣' },
      { id: 'l7', category: 'accommodation', label: 'Budget homestay', detail: 'Private room, AC, breakfast included', estimated_cost: 800, icon: '🏠' },
      { id: 'l8', category: 'misc', label: 'Water, snacks, misc', detail: 'Bottled water, sunscreen, small buys', estimated_cost: 150, icon: '🛍️' },
    ],
    total_estimated: 1745,
    budget_tips: [
      'Take public KSRTC ferry — same stunning views as a private boat at 1/10th the cost.',
      'Negotiate auto rates before boarding — fix ₹30–50 for short local rides.',
      '"Meals" restaurants (banana leaf lunch) offer the most authentic food under ₹150.',
      'Avoid houseboat touts near jetties. Book via your hotel for fair rates.',
    ],
  },

  beach: {
    transport_options: [
      { id: 'bus', mode: 'bus', label: 'KSRTC Bus', detail: 'State bus to beach junction stop', estimated_cost: 25, duration: '45 min', icon: '🚌', is_budget_pick: true },
      { id: 'auto', mode: 'auto', label: 'Shared Auto', detail: 'Town market → beach road', estimated_cost: 30, duration: '20 min', icon: '🛺', is_budget_pick: true },
      { id: 'bike_rent', mode: 'bike', label: 'Scooter Rental', detail: 'Day rental for independent roaming', estimated_cost: 400, duration: 'Full day', icon: '🛵' },
      { id: 'taxi', mode: 'taxi', label: 'App Cab / Taxi', detail: 'Ola/Uber drop to beach', estimated_cost: 300, duration: '30 min', icon: '🚕' },
    ],
    recommended_transport_id: 'bus',
    line_items: [
      { id: 'l1', category: 'transport', label: 'KSRTC Bus (1 way)', detail: 'Town center → beach junction', estimated_cost: 25, icon: '🚌', is_recommended: true },
      { id: 'l2', category: 'transport', label: 'Auto from beach junction', detail: 'Junction → beach shack zone', estimated_cost: 30, icon: '🛺' },
      { id: 'l3', category: 'food', label: 'Fresh coconut water (×2)', detail: 'From beach vendors', estimated_cost: 80, icon: '🥥' },
      { id: 'l4', category: 'food', label: 'Seafood thali lunch', detail: 'Prawn/fish curry with rice', estimated_cost: 250, icon: '🦐' },
      { id: 'l5', category: 'food', label: 'Evening bhaji + chai', detail: 'Local stall near promenade', estimated_cost: 60, icon: '🍱' },
      { id: 'l6', category: 'activity', label: 'Water sport (parasailing)', detail: 'Optional — 1 ride at beach shack', estimated_cost: 700, icon: '🪂' },
      { id: 'l7', category: 'accommodation', label: 'Beach guesthouse / hut', detail: 'Fan room near beach', estimated_cost: 600, icon: '🏡' },
      { id: 'l8', category: 'misc', label: 'Sunscreen, water, souvenirs', detail: 'Essentials + small beach buys', estimated_cost: 200, icon: '🛍️' },
    ],
    total_estimated: 1945,
    budget_tips: [
      'Bus over auto — ₹25 vs ₹80–100 for the same beach route.',
      'Bargain at beach shacks for seafood. Avoid "beach cafes" — 2× tourist markup.',
      'Rent a scooter only if visiting 3+ beaches in a day — ₹400 vs ₹900 in taxis.',
      'Inland rooms (500m from shore) cost 40% less with same beach access.',
    ],
  },

  mountain: {
    transport_options: [
      { id: 'jeep_shared', mode: 'jeep', label: 'Shared Jeep / Mahindra', detail: 'Town to hill viewpoint — shared fare', estimated_cost: 80, duration: '1 hr', icon: '🚙', is_budget_pick: true },
      { id: 'bus', mode: 'bus', label: 'KSRTC Hill Bus', detail: 'Slow, scenic, cheapest option', estimated_cost: 35, duration: '2 hrs', icon: '🚌', is_budget_pick: true },
      { id: 'taxi', mode: 'taxi', label: 'Private Jeep / Taxi', detail: 'Hired jeep for full-day mountain circuit', estimated_cost: 1800, duration: 'Full day', icon: '🚗' },
    ],
    recommended_transport_id: 'jeep_shared',
    line_items: [
      { id: 'l1', category: 'transport', label: 'Shared Jeep to Peak Area', detail: 'Town square → viewpoint base', estimated_cost: 80, icon: '🚙', is_recommended: true },
      { id: 'l2', category: 'transport', label: 'Cable Car / Ropeway', detail: 'If available at this destination', estimated_cost: 150, icon: '🚡' },
      { id: 'l3', category: 'food', label: 'Chai + maggi breakfast', detail: 'Classic hill breakfast at roadside stall', estimated_cost: 60, icon: '🍜' },
      { id: 'l4', category: 'food', label: 'Local thali lunch', detail: 'Hot meal mid-trek or in a village', estimated_cost: 180, icon: '🍱' },
      { id: 'l5', category: 'food', label: 'Corn + soup (evening)', detail: 'Roasted corn at viewpoint stall', estimated_cost: 80, icon: '🌽' },
      { id: 'l6', category: 'activity', label: 'Trekking permit / entry fee', detail: 'Forest entry or national park ticket', estimated_cost: 200, icon: '🥾' },
      { id: 'l7', category: 'accommodation', label: 'Forest guesthouse / homestay', detail: 'Budget room + meals in hills', estimated_cost: 700, icon: '🏕️' },
      { id: 'l8', category: 'misc', label: 'Water, energy bars, rain cover', detail: 'Trek essentials', estimated_cost: 200, icon: '🎒' },
    ],
    total_estimated: 1650,
    budget_tips: [
      'Share a jeep — ₹80/person vs ₹1,800 private. Ask at the town market stand.',
      'Book guesthouses 2+ days ahead in peak season to avoid 30% walk-in premium.',
      'Carry your own packed food for treks — mountain vendors charge 3× for snacks.',
      'Free public viewpoints often offer the same views as paid "scenic points" nearby.',
    ],
  },

  heritage: {
    transport_options: [
      { id: 'auto', mode: 'auto', label: 'Shared Auto-Rickshaw', detail: 'City center → heritage zone gate', estimated_cost: 40, duration: '20 min', icon: '🛺', is_budget_pick: true },
      { id: 'bus', mode: 'bus', label: 'City Bus', detail: 'Town bus to heritage complex stop', estimated_cost: 15, duration: '30 min', icon: '🚌', is_budget_pick: true },
      { id: 'cycle_rickshaw', mode: 'cycle_rickshaw', label: 'Cycle Rickshaw Tour', detail: 'Heritage circuit with local narrative', estimated_cost: 300, duration: '3 hrs', icon: '🚲' },
      { id: 'taxi', mode: 'taxi', label: 'Taxi with Driver Guide', detail: 'Private cab with commentary', estimated_cost: 1200, duration: 'Full day', icon: '🚕' },
    ],
    recommended_transport_id: 'auto',
    line_items: [
      { id: 'l1', category: 'transport', label: 'Shared Auto to Heritage Gate', detail: 'City center → main entrance', estimated_cost: 40, icon: '🛺', is_recommended: true },
      { id: 'l2', category: 'activity', label: 'Monument / Temple Entry', detail: 'Main site ticket + camera fee', estimated_cost: 50, icon: '🏛️' },
      { id: 'l3', category: 'activity', label: 'Audio Guide / ASI Guide', detail: 'Local government guide (2 hrs)', estimated_cost: 300, icon: '🎧' },
      { id: 'l4', category: 'food', label: 'Street breakfast (idli/vada)', detail: 'Heritage lane morning stall', estimated_cost: 50, icon: '🍽️' },
      { id: 'l5', category: 'food', label: 'Restaurant thali lunch', detail: 'Local meals near site', estimated_cost: 150, icon: '🌿' },
      { id: 'l6', category: 'food', label: 'Evening chai + snacks', detail: 'Stall near exit gate', estimated_cost: 40, icon: '☕' },
      { id: 'l7', category: 'accommodation', label: 'Heritage guesthouse', detail: 'Budget AC room near monument', estimated_cost: 900, icon: '🏨' },
      { id: 'l8', category: 'misc', label: 'Souvenirs, water, booklet', detail: 'Heritage crafts + mineral water', estimated_cost: 200, icon: '🛍️' },
    ],
    total_estimated: 1730,
    budget_tips: [
      'Combo tickets (multiple monuments in a complex) save 30–50% over single entries.',
      'Visit before 9 AM for cool air, fewer crowds, and the best photography light.',
      'ASI-certified local guides are cheaper than private tour agencies.',
      'Saturday state tourism free guided tours — check at the main gate.',
    ],
  },

  forest: {
    transport_options: [
      { id: 'bus', mode: 'bus', label: 'KSRTC Forest Route Bus', detail: 'State bus to forest range boundary', estimated_cost: 40, duration: '1.5 hrs', icon: '🚌', is_budget_pick: true },
      { id: 'jeep_shared', mode: 'jeep', label: 'Forest Dept. Safari Jeep', detail: 'Book at range office — shared seating', estimated_cost: 300, duration: '3 hrs', icon: '🚙', is_budget_pick: true },
      { id: 'taxi', mode: 'taxi', label: 'Private Cab', detail: 'Hired cab from nearest town', estimated_cost: 1500, duration: 'Full day', icon: '🚗' },
    ],
    recommended_transport_id: 'bus',
    line_items: [
      { id: 'l1', category: 'transport', label: 'KSRTC bus to forest gate', detail: 'Nearest town → forest boundary', estimated_cost: 40, icon: '🚌', is_recommended: true },
      { id: 'l2', category: 'activity', label: 'Shared Forest Safari (Jeep)', detail: 'Dept. of Forest jeep booking at gate', estimated_cost: 300, icon: '🐘' },
      { id: 'l3', category: 'activity', label: 'Trekking permit', detail: 'Eco-tourism permit at range office', estimated_cost: 100, icon: '🥾' },
      { id: 'l4', category: 'food', label: 'Packed breakfast (from homestay)', detail: 'Pre-packed morning meal', estimated_cost: 80, icon: '🍱' },
      { id: 'l5', category: 'food', label: 'Canteen lunch at range office', detail: 'Simple meals at forest canteen', estimated_cost: 120, icon: '🍽️' },
      { id: 'l6', category: 'accommodation', label: 'Eco lodge / forest cottage', detail: 'Wildlife dept. eco-cottage with meals', estimated_cost: 1200, icon: '🌿' },
      { id: 'l7', category: 'misc', label: 'Insect repellent, water, misc', detail: 'Forest essentials', estimated_cost: 180, icon: '🎒' },
    ],
    total_estimated: 2020,
    budget_tips: [
      'Book Forest Dept. jeep directly at the gate — agents charge 2× the permit cost.',
      'Eco-lodges inside the forest are cheaper and more authentic than resort perimeter hotels.',
      'Full-sleeved clothing = no insect repellent cost + mandatory forest regulation compliance.',
      'Dawn (5:30 AM) and dusk safaris offer the best sightings at no extra charge.',
    ],
  },

  city: {
    transport_options: [
      { id: 'metro', mode: 'metro', label: 'Metro / Local Train', detail: 'City metro or suburban rail', estimated_cost: 25, duration: '30 min', icon: '🚇', is_budget_pick: true },
      { id: 'bus', mode: 'bus', label: 'City Bus (AC/non-AC)', detail: 'State bus from city hub', estimated_cost: 15, duration: '45 min', icon: '🚌', is_budget_pick: true },
      { id: 'auto', mode: 'auto', label: 'Metered Auto', detail: 'Auto from nearest stop', estimated_cost: 80, duration: '20 min', icon: '🛺' },
      { id: 'taxi', mode: 'taxi', label: 'Ola / Uber', detail: 'Door-to-door app cab', estimated_cost: 200, duration: '20 min', icon: '🚕' },
    ],
    recommended_transport_id: 'bus',
    line_items: [
      { id: 'l1', category: 'transport', label: 'City bus fare (×2 rides)', detail: 'To/from destination zone', estimated_cost: 30, icon: '🚌', is_recommended: true },
      { id: 'l2', category: 'food', label: 'Udupi joint breakfast', detail: 'Dosa / idli at local café', estimated_cost: 80, icon: '🍽️' },
      { id: 'l3', category: 'food', label: 'Restaurant thali lunch', detail: 'Local meals or thali', estimated_cost: 180, icon: '🌿' },
      { id: 'l4', category: 'food', label: 'Evening chai + market snacks', detail: 'Stall food in market area', estimated_cost: 80, icon: '☕' },
      { id: 'l5', category: 'activity', label: 'Museum / gallery entry', detail: 'Main city attraction ticket', estimated_cost: 100, icon: '🏛️' },
      { id: 'l6', category: 'accommodation', label: 'Budget city hotel', detail: 'AC room near transit hub', estimated_cost: 1000, icon: '🏨' },
      { id: 'l7', category: 'misc', label: 'Shopping / misc purchases', detail: 'Local market + daily essentials', estimated_cost: 300, icon: '🛍️' },
    ],
    total_estimated: 1770,
    budget_tips: [
      'City bus beats auto every time — ₹15 vs ₹80 for the same destination.',
      'Thali lunch at local "hotel" joints (₹180) costs 3× less than multi-cuisine restaurants.',
      'Hotels near metro/bus hubs are 30% cheaper + no taxi needed.',
      'City markets have authentic local craft at non-tourist prices — bargain hard.',
    ],
  },

  generic: {
    transport_options: [
      { id: 'bus', mode: 'bus', label: 'State Bus (KSRTC)', detail: 'State transport to destination', estimated_cost: 30, duration: '1 hr', icon: '🚌', is_budget_pick: true },
      { id: 'auto', mode: 'auto', label: 'Auto-Rickshaw', detail: 'Shared or private auto from town', estimated_cost: 60, duration: '25 min', icon: '🛺' },
      { id: 'taxi', mode: 'taxi', label: 'Private Taxi', detail: 'Air-conditioned private cab', estimated_cost: 500, duration: '40 min', icon: '🚕' },
    ],
    recommended_transport_id: 'bus',
    line_items: [
      { id: 'l1', category: 'transport', label: 'Bus fare (return)', detail: 'State transport round trip', estimated_cost: 60, icon: '🚌', is_recommended: true },
      { id: 'l2', category: 'food', label: 'South Indian breakfast', detail: 'Idli/dosa at local stall', estimated_cost: 80, icon: '🍽️' },
      { id: 'l3', category: 'food', label: 'Rice meals / thali lunch', detail: 'South Indian meals restaurant', estimated_cost: 150, icon: '🌿' },
      { id: 'l4', category: 'food', label: 'Evening chai + snacks', detail: 'Local snack stall', estimated_cost: 50, icon: '☕' },
      { id: 'l5', category: 'activity', label: 'Entry / experience fee', detail: 'Main attraction or local activity', estimated_cost: 200, icon: '🎟️' },
      { id: 'l6', category: 'accommodation', label: 'Budget guesthouse / lodge', detail: 'Basic room with essentials', estimated_cost: 700, icon: '🏠' },
      { id: 'l7', category: 'misc', label: 'Water + misc', detail: 'Bottled water, incidentals', estimated_cost: 100, icon: '🛍️' },
    ],
    total_estimated: 1340,
    budget_tips: [
      'State buses are almost always the cheapest inter-destination transport.',
      'Local "hotel" restaurants serve authentic food at ₹100–180 — avoid tourist-labeled ones.',
      'Always ask auto fare before boarding, or request meter use.',
      'Book accommodation in advance for peak seasons — walk-in adds 20–30% premium.',
    ],
  },
};

export function getDestinationBudgetBreakdown(
  destName: string,
  baseEstimatedCost?: number
): DestinationBudgetBreakdown {
  const profile = detectProfile(destName);
  const template = PROFILES[profile] ?? PROFILES.generic;

  if (baseEstimatedCost && baseEstimatedCost > 0 && template.total_estimated > 0) {
    const scale = baseEstimatedCost / template.total_estimated;
    if (scale !== 1 && scale > 0.3 && scale < 5) {
      const scaledItems = template.line_items.map((item) => ({
        ...item,
        estimated_cost: Math.round(item.estimated_cost * scale),
      }));
      const scaledTransport = template.transport_options.map((t) => ({
        ...t,
        estimated_cost: Math.round(t.estimated_cost * scale),
      }));
      return { ...template, line_items: scaledItems, transport_options: scaledTransport, total_estimated: baseEstimatedCost };
    }
  }

  return { ...template };
}

export const TRANSPORT_MODE_LABELS: Record<string, { label: string; icon: string }> = {
  bus: { label: 'State Bus', icon: '🚌' },
  train: { label: 'Train', icon: '🚂' },
  auto: { label: 'Auto-Rickshaw', icon: '🛺' },
  taxi: { label: 'Taxi / Cab', icon: '🚕' },
  bike: { label: 'Bike / Scooter', icon: '🛵' },
  boat: { label: 'Boat / Ferry', icon: '⛵' },
  houseboat: { label: 'Houseboat', icon: '🛶' },
  jeep: { label: 'Jeep / 4WD', icon: '🚙' },
  metro: { label: 'Metro', icon: '🚇' },
  walk: { label: 'On Foot', icon: '🚶' },
  cycle_rickshaw: { label: 'Cycle Rickshaw', icon: '🚲' },
};
