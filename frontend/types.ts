export interface PlayerStats {
  intelligence: number;
  stamina: number;
  charm: number;
  reputation: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  level: number;
  levelName: string;
  salary: number;
  bonus: number;
}

export interface GameState {
  money: number;
  day: number;
  stage: number;
  stats: PlayerStats;
  currentStamina: number;
  employees: Employee[];
  marketingBuff: number; // Days remaining for marketing buff
}

export type ItemType = 'flight' | 'hotel' | 'attraction' | 'rental_car';

export interface MarketItem {
  id: string;
  type: ItemType;
  provider: string; // Airline, Hotel Chain, Attraction Operator, or Rental Car Company
  country?: string;
  destination: string;
  isDomestic?: boolean;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDay: number;
  departureTime?: string; // e.g., "14:30"
  arrivalTime?: string;   // e.g., "16:50"
  flightTime?: number;    // in minutes
  isReturn?: boolean;     // true if this is a return flight (Dest -> Home)
  basePrice: number;
  currentPrice: number;
  totalStock: number;
  availableStock: number;
}

export interface InventoryItem {
  id: string;
  marketId: string;
  type: ItemType;
  provider: string;
  country?: string;
  destination: string;
  isDomestic?: boolean;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDay: number;
  departureTime?: string;
  arrivalTime?: string;
  flightTime?: number;
  isReturn?: boolean;
  stockOwned: number;
  averagePurchasePrice: number;
}

export interface CustomerType {
  name: string;
  seats: number | number[];
  budgetMultiplier: number;
  charmReq: number;
  isVip: boolean;
  wantsHotel: boolean;
  wantsAttraction: boolean;
  wantsRentalCar: boolean;
}

export interface TravelRequest {
  id: string;
  customerType: string;
  destination: string;
  isDomestic?: boolean;
  departureAirport: string;
  arrivalAirport: string;
  duration: number; // in nights
  departureDay: number;
  isRoundTrip: boolean;
  returnDay?: number;
  requiredSeats: number;
  requiresHotel: boolean;
  requiresAttraction: boolean;
  requiresRentalCar: boolean;
  budgetPerPerson: number;
  reward: number;
  requiredCharm: number;
  type: 'normal' | 'vip';
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: Date;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  day: number;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  targetDestination?: string;
  priceMultiplier: number;
  demandMultiplier: number;
  duration: number;
}

export interface AgencyStageInfo {
  level: number;
  name: string;
  description: string;
  reqMoney: number;
  reqReputation: number;
  imagePlaceholder: string;
}
