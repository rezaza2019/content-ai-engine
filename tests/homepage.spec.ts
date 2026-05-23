import { test, expect } from '@playwright/test';

test('homepage loads and shows the header and active data source panel', async ({ page }) => {
  // Navigate to baseURL (http://localhost:4000)
  await page.goto('/');

  // Assert page title
  await expect(page).toHaveTitle(/Daisycon Datafeed Explorer/);

  // Assert header title is visible
  const headerTitle = page.getByRole('heading', { name: 'Daisycon Explorer' });
  await expect(headerTitle).toBeVisible();

  // Assert that by default we are prompted to select a data source
  const selectMsg = page.getByText('Select a Data Source', { exact: true });
  await expect(selectMsg).toBeVisible();

  // Assert that instructions are displayed
  const instructions = page.getByText('Choose an API endpoint from the dropdown above');
  await expect(instructions).toBeVisible();
});
