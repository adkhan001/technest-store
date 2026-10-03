# TechNest Store

A responsive electronics storefront using HTML, CSS, vanilla JavaScript, Supabase Postgres and a Supabase Edge Function. Deployed on Vercel from this repository.

## Working features

- 25 real device models across six categories, with 66 locally hosted product photographs
- Database-backed catalog, current stock, search, filters, product galleries and comparison
- Browser-persisted cart, wishlist, profile and recently viewed products
- Checkout with server-calculated totals, stock validation and atomic inventory updates
- Database-persisted orders and private-key order tracking across devices
- Contact messages and newsletter subscriptions saved to Supabase
- Responsive storefront, dark mode, keyboard controls and reduced-motion support

This is an academic demonstration. Catalog prices and stock are sample values; no payments or shipments are processed. Product images and starting descriptions come from [DummyJSON](https://dummyjson.com/docs/products). No fabricated reviews or commercial sales claims are shown.

## Run locally

```sh
python -m http.server 8000
```

Visit `http://localhost:8000`. The site connects to its configured Supabase project. Localhost port 8000 is allowed by the function's CORS configuration.

## Database

- `products`: publicly readable active products; inventory changes only through the backend
- `orders`: private customer details and order snapshots
- `contact_messages`: private inquiries
- `newsletter_subscribers`: private email subscriptions

Schema: `database/schema.sql`; initial catalog: `database/seed.sql`.

`supabase/functions/store-api/index.ts` validates checkout, tracking and form submissions. Only the server-side Edge Function has the service-role key. RLS and grants block public access to private tables. The checkout transaction recalculates prices and locks product rows before reducing stock.

The frontend uses a public publishable key for the catalog and a legacy public anon JWT for the Edge Function gateway's JWT verification. Neither grants access to private tables. No secret or service-role key is committed.

## Panel demonstration

1. Open `system.html` to show the live catalog records and stock.
2. Open a product, add it to the cart and place an order with fictitious delivery details.
3. Note the order reference and private tracking key.
4. Reload `system.html`: the product stock has decreased.
5. Open Track Order and retrieve the saved order using the reference and key.
6. Open Supabase Table Editor to show the `orders` record and product table.

The Account page stores a delivery profile locally; it is not an authenticated customer account. Cart and wishlist persistence are local browser features. Order status reflects the database and does not simulate shipping progress.


## Retail storefront update
Expanded catalog with manufacturer photography from Logitech and PlayStation alongside the original DummyJSON sample catalog. Manufacturer source URLs are recorded per item in `database/catalog.json`. Prices and stock are sample data for the internship project, not retailer quotations. Re-seeding preserves existing stock quantities.

Account tabs now target the actual profile form; labels and keyboard tab navigation are wired. Featured collection tabs filter products, category navigation provides direct links, and the catalog supports search, brand/category filters, price sorting and pagination. All shared pages use the retail design system in `css/retail.css`.
