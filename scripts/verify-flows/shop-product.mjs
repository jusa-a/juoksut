export default async ({ page, base, shot }) => {
  await page.goto(`${base}/shop`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.getByRole('link', { name: /ALL-STARS CAMP '26/ }).click()
  await page.waitForURL(/\/shop\/.+/)
  await page.waitForLoadState('networkidle')
  await shot('product')
}
