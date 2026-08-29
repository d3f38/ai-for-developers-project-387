import type { ReactNode } from "react";

export interface EventType {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface Slot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Booking {
  id: number;
  eventTypeId: number;
  eventTypeName: string;
  guestName: string;
  guestEmail?: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface BookingCreate {
  eventTypeId: number;
  guestName: string;
  guestEmail?: string;
  startTime: string;
}

export interface EventTypeUpsert {
  name: string;
  description: string;
  durationMinutes: number;
}

export interface ApiErrorResponse {
  code: number;
  message: string;
  children?: ReactNode;
}
