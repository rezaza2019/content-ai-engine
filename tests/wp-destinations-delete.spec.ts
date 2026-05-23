import { expect, test } from "@playwright/test";

test("clicking destination delete shows the warning modal", async ({
  page,
}) => {
  await page.route("**/api/wp/destinations", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 123,
          slug: "test-destination",
          date: "2026-05-18T10:00:00",
          modified: "2026-05-18T10:00:00",
          title: { rendered: "Test Destination" },
          content: { rendered: "Fixture content" },
          price: "499",
          duration: "7",
          departure_date: "2026-06-01",
          aff_link: "https://example.com/deal",
          destination_name: "Test Destination",
          destination_region: "Test Region",
          destination_country: "NL",
        },
      ]),
    });
  });

  await page.goto("/wp");

  await page.getByTestId("destination-123-delete").click();

  const modal = page.locator(".fixed").filter({
    has: page.getByRole("heading", { name: "Delete destination?" }),
  });

  await expect(
    page.getByRole("heading", { name: "Delete destination?" }),
  ).toBeVisible();
  await expect(
    page.getByText("This will move the WordPress post to trash."),
  ).toBeVisible();
  await expect(modal.getByText("Test Destination")).toBeVisible();
  await expect(
    modal.getByRole("button", { name: "Delete", exact: true }),
  ).toBeVisible();
  await expect(modal.getByRole("button", { name: "Cancel" })).toBeVisible();
});

// clicknign on close button => then warnig be closed
