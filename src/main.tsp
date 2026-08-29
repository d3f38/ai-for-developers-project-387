import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using Rest;
using OpenAPI;

@service({
  title: "Calendar Booking Service",
  description: "Сервис бронирования слотов календаря. Владелец управляет типами событий. Гости анонимно бронируют свободные слоты.",})
@server("http://localhost:3000", "Local development server")
namespace CalendarBooking;

// ── Модели ──────────────────────────────────────────────

/** Тип события — услуга владельца календаря. */
model EventType {
  /** Уникальный идентификатор */
  id: safeint;
  /** Название */
  name: string;
  /** Описание */
  description: string;
  /** Длительность в минутах */
  durationMinutes: int32;
}

/** Данные для создания или обновления типа события. */
model EventTypeUpsert {
  name: string;
  description: string;
  durationMinutes: int32;
}

/**
 * Свободный временной слот.
 * Формируется в окне 14 дней от текущей даты.
 */
model Slot {
  /** Начало слота в UTC */
  startTime: utcDateTime;
  /** Конец слота в UTC */
  endTime: utcDateTime;
  /** Доступен ли слот для бронирования */
  available: boolean;
}

/**
 * Бронирование — запись гостя на конкретный слот.
 */
model Booking {
  /** Уникальный идентификатор */
  id: safeint;
  /** Идентификатор типа события */
  eventTypeId: safeint;
  /** Название типа события */
  eventTypeName: string;
  /** Имя гостя */
  guestName: string;
  /** Email гостя (опционально) */
  guestEmail?: string;
  /** Начало слота в UTC */
  startTime: utcDateTime;
  /** Конец слота в UTC */
  endTime: utcDateTime;
  /** Дата создания бронирования */
  createdAt: utcDateTime;
}

/** Данные для создания бронирования. */
model BookingCreate {
  eventTypeId: safeint;
  guestName: string;
  guestEmail?: string;
  startTime: utcDateTime;
}

/** Стандартная ошибка API. */
@error
model ApiError {
  code: int32;
  message: string;
}

// ── API владельца ───────────────────────────────────────

@route("/api/event-types")
@tag("Owner: Типы событий")
interface OwnerEventTypes {
  /** Получить список всех типов событий. */
  @get list(): EventType[] | ApiError;

  /** Создать новый тип события. */
  @post create(@body body: EventTypeUpsert): EventType | ApiError;
}

@route("/api/event-types/{id}")
@tag("Owner: Типы событий")
interface OwnerEventTypeById {
  /** Получить тип события по id. */
  @get get(@path id: safeint): EventType | ApiError;

  /** Обновить тип события (название, описание, длительность). */
  @put update(@path id: safeint, @body body: EventTypeUpsert): EventType | ApiError;

  /** Удалить тип события. Нельзя удалить, если есть активные бронирования. */
  @delete delete(@path id: safeint): void | ApiError;
}

@route("/api/bookings")
@tag("Owner: Бронирования")
interface OwnerBookings {
  /**
   * Получить список всех предстоящих бронирований.
   * Отсортированы по дате (ближайшие сверху).
   * Включает бронирования всех типов событий.
   */
  @get list(): Booking[] | ApiError;
}

// ── API гостя ───────────────────────────────────────────

@route("/api/public/event-types")
@tag("Guest: Типы событий")
interface GuestEventTypes {
  /** Получить список доступных типов событий (название, описание, длительность). */
  @get list(): EventType[] | ApiError;
}

/**
 * Правило занятости: на одно время нельзя создать две записи,
 * даже если это разные типы событий.
 * Слоты формируются на 14 дней вперёд от текущей даты.
 */
@route("/api/public/slots")
@tag("Guest: Слоты")
interface GuestSlots {
  /**
   * Получить доступные слоты для типа события.
   * @param eventTypeId Идентификатор типа события
   * @param dateFrom Начало диапазона (UTC, по умолчанию — сегодня)
   * @param dateTo Конец диапазона (UTC, по умолчанию — +14 дней)
   */
  @get getAvailableSlots(
    @query eventTypeId: safeint,
    @query dateFrom?: utcDateTime,
    @query dateTo?: utcDateTime,
  ): Slot[] | ApiError;
}

@route("/api/public/bookings")
@tag("Guest: Бронирования")
interface GuestBookings {
  /**
   * Создать бронирование на выбранный слот.
   * Сервер проверяет:
   * - Тип события существует
   * - Слот находится в допустимом окне (14 дней)
   * - Слот свободен
   */
  @post create(@body body: BookingCreate): Booking | ApiError;
}
