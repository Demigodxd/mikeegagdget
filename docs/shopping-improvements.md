# Shopping clarity review

The homepage hero, navigation, mobile bottom bar, brand colours, prices, product catalogue, and financing/valuation configuration are preserved. Generated HTML changes reflect the shared components; they are not a redesign.

## Changes

- `assets/buy-flow.js`, `assets/customer-fields.mjs`, `commerce/order-messages.mjs`: required customer/contact fields, conditional delivery state/address, notes, quantity validation, subtotal, order reference, pending-delivery quote and plain-language inquiry messages. No payment is taken or represented as completed. No customer data is stored server-side; this static site has no secure order API.
- `assets/commerce.js`: prominent Buy Outright links use the existing guided checkout; colour options follow the selected recorded variant; financing messages use the shared formatter.
- `assets/journey.js`: friendly EasyBuy breakdown, upfront fees where applicable, numbered monthly schedule, customer fields, validation and submission events; duration handlers no longer accumulate on revisiting the plan.
- `assets/landing-page.js`: tracking excludes WhatsApp message query strings; internal Buy links no longer trigger WhatsApp Contact events.
- `assets/storefront-ui.mjs`, `assets/storefront.css`: explicit model-name photo fallbacks, card Buy Outright links and form styling using the existing palette and geometry.
- `commerce/storefront-data.mjs`, `assets/storefront.js`, `templates/home.html.template`, `scripts/generate-storefront.mjs`: Open Box and colour filters; connectivity is a separate variant attribute/filter. Unknown connectivity stays unknown (no current record confirms Wi-Fi Only). Existing availability remains confirmation-only, never fabricated as in stock.
- `scripts/generate-upgrade-pages.mjs`: fixes an unclosed financing-fields wrapper in the guided form.
- `scripts/audit-image-coverage.mjs`, `docs/image-coverage.md`: reproducible inventory-wide image report.
- Tests: updated journey expectations and added financing reconciliation, quantity, delivery, colour-group and tracking-privacy checks.

## Policy requiring merchant review

The source of truth remains `easy-buy/easy-buy-core.mjs`: iPhone 11–12 deposit 50%; 13–15 deposit 60%; 16–18 deposit 70%; other devices start at 40%, with a ₦250,000 financed-balance cap. Durations are 1–3 monthly payments. Apple standard interest is 20% flat monthly; the separate 7.5% route requires qualification and adds ₦5,000 upfront. Other devices calculate at 7.5% with the existing fee. Some earlier business examples use different deposits/caps/durations. None were silently substituted. The existing external eligibility route is preserved; this site does not approve credit.

## Assets and limitations

159 listings: 28 have existing local photography and 131 use model-name placeholders. The report does not certify existing photo rights, device identity or colour accuracy. Supplier references did not provide verified, reusable assets; no photos were copied without that evidence. Provide authorized exact-model photos to complete photo coverage. Product variants do not contain live stock or per-colour images; the UI preserves recorded groups and asks to confirm the exact unit. Display labels say Not Activated without claiming a seal.

## Review

Run `npm ci` then `npm run check`. Run `npm run dev -- --host 0.0.0.0` for a local preview. No production deployment or merge is authorized. Review Buy Outright with pickup/delivery, EasyBuy for 1–3 months, and Swap on mobile before merging.
