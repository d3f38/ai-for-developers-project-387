import { test, expect } from "@playwright/test";
import {
  createBooking,
  createEventType,
  dateInDays,
  pickDate,
  slotAt,
  slotLabel,
} from "./helpers";

test.describe("Бронирование слота", () => {
  test("гость проходит путь от выбора слота до подтверждения, запись видна в интерфейсе", async ({
    page,
    request,
  }) => {
    const name = `E2E Booking ${Date.now()}`;
    const eventType = await createEventType(request, {
      name,
      description: "Сценарий успешного бронирования",
      durationMinutes: 30,
    });

    const date = dateInDays(2);
    const startTime = slotAt(date, 9);
    const guestEmail = `booking-${Date.now()}@example.com`;

    // 1. Гость выбирает тип события на главной.
    await page.goto("/");
    // Карточка типа события: заголовок лежит во вложенном блоке, кнопка — рядом.
    const card = page
      .getByRole("heading", { name, exact: true })
      .locator("../..");
    await card.getByRole("button", { name: "Select" }).click();
    await expect(page).toHaveURL(new RegExp(`/book/${eventType.id}$`));

    // 2. Выбирает дату и свободный слот.
    await pickDate(page, date);
    const slot = page.getByRole("button", {
      name: slotLabel(startTime),
      exact: true,
    });
    await expect(slot).toBeEnabled();
    await slot.click();

    // 3. Заполняет данные и подтверждает.
    await page.getByLabel("Name").fill("Alice Guest");
    await page.getByLabel("Email (optional)").fill(guestEmail);
    await page.getByRole("button", { name: "Confirm booking" }).click();

    await expect(
      page.getByRole("heading", { name: "Booking confirmed!" }),
    ).toBeVisible();
    await expect(page.getByText(`You are booked for ${name}`)).toBeVisible();

    // 4. Запись сохранилась и отображается в «My Bookings».
    await page.goto("/my-bookings");
    await page.getByPlaceholder("Enter your email").fill(guestEmail);
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByText("Found 1 booking")).toBeVisible();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Alice Guest")).toBeVisible();

    // 5. И в списке владельца календаря.
    await page.goto("/admin");
    await expect(
      page.getByRole("cell", { name: "Alice Guest" }),
    ).toBeVisible();
  });
});

test.describe("Занятость слотов", () => {
  test("забронированный слот недоступен для повторной записи", async ({
    page,
    request,
  }) => {
    const name = `E2E Occupied ${Date.now()}`;
    const eventType = await createEventType(request, {
      name,
      durationMinutes: 30,
    });

    const date = dateInDays(3);
    const startTime = slotAt(date, 11);

    const booked = await createBooking(request, {
      eventTypeId: eventType.id,
      guestName: "First Guest",
      startTime,
    });
    expect(booked.status()).toBe(200);

    await page.goto(`/book/${eventType.id}`);
    await pickDate(page, date);

    const slot = page.getByRole("button", {
      name: slotLabel(startTime),
      exact: true,
    });
    await expect(slot).toBeVisible();
    await expect(slot).toBeDisabled();

    // Соседний слот остаётся свободным — блокируется только занятое время.
    const free = page.getByRole("button", {
      name: slotLabel(slotAt(date, 12)),
      exact: true,
    });
    await expect(free).toBeEnabled();
  });

  test("при гонке за слот пользователь видит понятное сообщение о конфликте", async ({
    page,
    request,
  }) => {
    const name = `E2E Conflict ${Date.now()}`;
    const eventType = await createEventType(request, {
      name,
      durationMinutes: 30,
    });

    const date = dateInDays(4);
    const startTime = slotAt(date, 14);

    // Гость открывает страницу, когда слот ещё свободен.
    await page.goto(`/book/${eventType.id}`);
    await pickDate(page, date);
    const slot = page.getByRole("button", {
      name: slotLabel(startTime),
      exact: true,
    });
    await expect(slot).toBeEnabled();
    await slot.click();
    await page.getByLabel("Name").fill("Late Guest");

    // Пока он заполнял форму, слот занял кто-то другой.
    const takenBy = await createBooking(request, {
      eventTypeId: eventType.id,
      guestName: "Faster Guest",
      startTime,
    });
    expect(takenBy.status()).toBe(200);

    await page.getByRole("button", { name: "Confirm booking" }).click();

    await expect(page.getByText("This slot is already occupied")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Booking confirmed!" }),
    ).toBeHidden();
  });

  test("API отклоняет повторную запись на занятый слот с кодом 409", async ({
    request,
  }) => {
    const eventType = await createEventType(request, {
      name: `E2E API Conflict ${Date.now()}`,
      durationMinutes: 30,
    });

    const startTime = slotAt(dateInDays(5), 16);

    const first = await createBooking(request, {
      eventTypeId: eventType.id,
      guestName: "First",
      startTime,
    });
    expect(first.status()).toBe(200);

    const second = await createBooking(request, {
      eventTypeId: eventType.id,
      guestName: "Second",
      startTime,
    });
    expect(second.status()).toBe(409);
    expect(await second.json()).toMatchObject({
      code: 409,
      message: "This slot is already occupied",
    });

    // Слот помечен занятым и в выдаче доступных слотов.
    const slots = await request.get(
      `/api/public/slots?eventTypeId=${eventType.id}` +
        `&dateFrom=${startTime.slice(0, 10)}&dateTo=${startTime.slice(0, 10)}`,
    );
    expect(slots.status()).toBe(200);
    const occupied = (await slots.json()).find(
      (s: { startTime: string }) => s.startTime === startTime,
    );
    expect(occupied).toMatchObject({ available: false });
  });
});
