# Lisa backend deployment

Project: Lisa Electronics (`uojdmwszuiqzbsojydgp`), organization victor.
Development branch: lisa-supabase-backend. The existing storefront is retained.

## Vercel environment variables
Configure these in Vercel for the development branch's Preview environment first; redeploy after saving:
- SUPABASE_URL: https://uojdmwszuiqzbsojydgp.supabase.co
- SUPABASE_PUBLISHABLE_KEY: project's publishable key
- SUPABASE_SERVICE_ROLE_KEY: server-only secret from Supabase project settings
- PAYSTACK_SECRET_KEY: client account TEST secret initially, server-only
- PAYMENTS_ENABLED: false until end-to-end testing passes
- SITE_URL: exact HTTPS preview origin (production custom domain at launch)
Never commit secrets or prefix them with VITE_ or NEXT_PUBLIC_.

## First administrator
In Supabase Authentication > Users, create/invite the intended administrator. After verifying their identity, insert their Auth UUID into public.admin_users using the SQL editor. Ordinary signups never receive admin privileges. Sign in at /admin/ with that account. Sessions are kept in memory and signing out clears them.

## Products
397 variant records imported from 292 existing catalog entries in 19 categories. Drafts, zero confirmed stock. Existing prices are preserved, not freshly verified. Review each exact condition/storage/colour and price, enter actual stock and publish. Each variant has a separate SKU. Image URLs reference the existing hosted images; admin accepts HTTPS image URLs, not file uploads yet.
Admin edits currently feed /api/products and /checkout; the existing static catalogue pages are not yet synced from the database.

## Checkout
/checkout/ supports choosing one variant and quantity for SHOP PICKUP only. API supports up to 20 unique products. No delivery fee is invented. Stock is reserved atomically before starting Paystack. Totals come from the database. Payment confirmation checks reference, amount, currency and is idempotent. Webhooks require raw-body HMAC validation.
Set the Paystack webhook to https://YOUR-DOMAIN/api/paystack-webhook.

## Remaining before enabling payments
- Configure secrets and admin account.
- Test deployed Vercel webhook raw-body handling with Paystack test payments, callbacks, declines and retries.
- Implement pending-order reconciliation and safe reservation release; abandoned/initialization-failed orders currently retain reserved stock. Do not manually restock without checking Paystack for late payments.
- Add checkout rate limiting/abuse protection before public use.
- Connect existing product pages to the live catalogue and checkout.
- Add order fulfillment controls, image file uploads, email receipts, and agreed delivery options.
Keep PAYMENTS_ENABLED=false until the remaining checkout requirements pass. This is a development implementation, not a production-ready payment launch.

## Optional physical stock
Apply schema/optional-stock.sql after checkout.sql. New and imported products default to sourcing orders without a stock count. Enable track_stock to count physical units, and leave allow_backorder on to source any shortfall. Disable allow_backorder for stock-only sales. Checkout atomically reserves only existing physical units, never a negative count, and snapshots reserved_quantity and sourcing_quantity per item. Payments remain disabled pending Paystack and reservation reconciliation tests.
