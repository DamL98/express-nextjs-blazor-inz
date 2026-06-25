export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorResponse;

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

export type ReservationFilters = {
  status?: ReservationStatus | "";
  roomId?: string;
};

export type CreateReservationPayload = {
  roomId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
};

export type CreateReservationResult = Reservation;