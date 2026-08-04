import { BillingService } from './billing.service'

// Regression test for #283: setMonth(getMonth() - 1) overflowed on long months
// (e.g. run on Mar 31 -> "Feb 31" -> Mar 3), shrinking the monthly window to 28
// days. getMonthlyWindowStart() must always give a full 30-day lookback.
describe('BillingService.getMonthlyWindowStart (issue #283)', () => {
  // Constructor only reads process.env, so nulls are fine for the deps.
  const service = new BillingService(
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ) as any

  const DAY_MS = 24 * 60 * 60 * 1000

  afterEach(() => jest.useRealTimers())

  it('gives a full 30-day window on Mar 31 (the old overflow day)', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-03-31T12:00:00.000Z'))

    const start: Date = service.getMonthlyWindowStart()
    const spanDays = (Date.now() - start.getTime()) / DAY_MS

    expect(spanDays).toBe(30)

    // The old code produced Mar 3 (a 28-day window). Prove we don't.
    const buggy = new Date(new Date().setMonth(new Date().getMonth() - 1))
    expect(start.getTime()).toBeLessThan(buggy.getTime())
  })

  it('gives a 30-day window on a normal day too', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-06-15T00:00:00.000Z'))

    const start: Date = service.getMonthlyWindowStart()
    expect((Date.now() - start.getTime()) / DAY_MS).toBe(30)
  })
})
