/** Maximum trip length in days. Keeps total generation time well under
 *  the 300s Vercel function timeout (~17 chunks x 12s = ~204s + overhead). */
export const MAX_TRIP_DAYS = 120;
