// Stripe Checkout Sessions cannot expire sooner than 30 minutes. Keep the
// D1 hold identical to the Stripe session lifetime so a valid payment can
// never arrive after its capacity has been released.
export const CHECKOUT_RESERVATION_SECONDS = 60 * 30

// Camp places are held in D1 before a Checkout Session URL is returned. The
// stock decrement is therefore the reservation itself; a paid reservation is
// not decremented again by the webhook.
export function reservationItems(items) {
  return items
    .filter(({ product }) => product.reserveStock)
    .map(({ product, quantity, size }) => ({
      productSlug: product.slug,
      quantity,
      size,
    }))
}

export async function releaseExpiredReservations(D1, now = unixTime()) {
  return releaseActiveReservations(D1, 'expires_at <= ?', [now], now)
}

export async function releaseReservationGroup(D1, groupId, now = unixTime()) {
  if (!groupId)
    return 0

  return releaseActiveReservations(D1, 'group_id = ?', [groupId], now)
}

export async function reserveItems(D1, groupId, items, expiresAt) {
  const statements = items.flatMap((item, index) => {
    const reservationId = `${groupId}-${index}`

    // The insert only succeeds when the corresponding stock row still has
    // enough capacity. The following decrement is tied to that exact row, so
    // a sold-out item cannot create a reservation or change stock.
    return [
      D1.prepare(`
        INSERT INTO checkout_reservations
          (id, group_id, product_slug, size, quantity, status, expires_at, created_at)
        SELECT ?, ?, ?, ?, ?, 'active', ?, ?
        WHERE EXISTS (
          SELECT 1 FROM stock
          WHERE product_slug = ? AND size = ? AND quantity >= ?
        )
      `).bind(
        reservationId,
        groupId,
        item.productSlug,
        item.size,
        item.quantity,
        expiresAt,
        unixTime(),
        item.productSlug,
        item.size,
        item.quantity,
      ),
      D1.prepare(`
        UPDATE stock
        SET quantity = quantity - ?
        WHERE product_slug = ? AND size = ?
          AND EXISTS (
            SELECT 1 FROM checkout_reservations
            WHERE id = ? AND status = 'active'
          )
      `).bind(item.quantity, item.productSlug, item.size, reservationId),
    ]
  })

  const results = await D1.batch(statements)
  const unavailable = items.some((_, index) => results[index * 2].meta?.changes !== 1)

  if (unavailable) {
    // A cart can contain more than one reservable registration. Release any
    // earlier holds from this attempt before reporting the sold-out item.
    await releaseReservationGroup(D1, groupId)
    throw new ReservationUnavailableError()
  }
}

// Returns true when this Checkout Session had a reservation and its capacity
// has now been made permanent. A session without a reservation uses the normal
// merchandise stock-decrement path in the webhook.
export async function completeReservationGroup(D1, groupId) {
  if (!groupId)
    return false

  const update = await D1.prepare(`
    UPDATE checkout_reservations
    SET status = 'paid', completed_at = ?
    WHERE group_id = ? AND status = 'active'
  `).bind(unixTime(), groupId).run()

  if (update.meta?.changes > 0)
    return true

  const reservation = await D1.prepare(
    'SELECT status FROM checkout_reservations WHERE group_id = ? LIMIT 1',
  ).bind(groupId).first()

  if (reservation)
    throw new Error(`Reservation ${groupId} was no longer active when payment completed`)

  return false
}

export class ReservationUnavailableError extends Error {
  constructor() {
    super('This registration just sold out. Please refresh the page and try again.')
  }
}

async function releaseActiveReservations(D1, condition, bindings, now) {
  // Both statements are a D1 batch, so there is no window for a completed
  // payment to change a reservation to paid between restoring its stock and
  // marking it released.
  const stockUpdates = D1.prepare(`
    UPDATE stock
    SET quantity = quantity + (
      SELECT SUM(reservation.quantity)
      FROM checkout_reservations reservation
      WHERE reservation.product_slug = stock.product_slug
        AND reservation.size = stock.size
        AND reservation.status = 'active'
        AND ${condition}
    )
    WHERE EXISTS (
      SELECT 1
      FROM checkout_reservations reservation
      WHERE reservation.product_slug = stock.product_slug
        AND reservation.size = stock.size
        AND reservation.status = 'active'
        AND ${condition}
    )
  `).bind(...bindings, ...bindings)
  const release = D1.prepare(`
    UPDATE checkout_reservations
    SET status = 'released', released_at = ?
    WHERE status = 'active' AND ${condition}
  `).bind(now, ...bindings)
  const results = await D1.batch([stockUpdates, release])

  return results.at(-1).meta?.changes || 0
}

function unixTime() {
  return Math.floor(Date.now() / 1000)
}
