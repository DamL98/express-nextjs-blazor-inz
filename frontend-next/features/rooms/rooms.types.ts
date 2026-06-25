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

export type GetRoomsFilters = {
  active?: "true" | "false" | "";
  capacityMin?: string;
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