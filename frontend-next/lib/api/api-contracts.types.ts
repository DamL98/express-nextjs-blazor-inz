export type Room = {
  id: string;
  name: string;
  location: string;
  description: string | null;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RoomAvailabilityConflict = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
};

export type RoomAvailability = {
  roomId: string;
  available: boolean;
  start: string;
  end: string;
  conflicts: RoomAvailabilityConflict[];
};

export type ReservationStatus = "ACTIVE" | "CANCELLED";

export type Reservation = {
  id: string;
  userId: string;
  roomId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  googleCalendarEventId: string | null;
  createdAt: string;
  updatedAt: string;
  room?: Room;
};

export type Dashboard = {
  activeRoomsCount: number;
  nextReservations: Reservation[];
};

export type GoogleCalendarConnectionStatus = {
  connected: boolean;
  provider: string | null;
  calendarEmail: string | null;
  connectedAt: string | null;
  tokenExpiresAt: string | null;
  syncEnabled: boolean;
};
