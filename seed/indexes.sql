-- Run this alone in Supabase -> SQL Editor to add the indexes WITHOUT resetting data.
-- (The same statements are in ecommerce_support.sql, so a full re-seed also creates them.)

create index if not exists idx_orders_customer_date on orders (customer_id, order_date desc, id desc);
create index if not exists idx_order_items_order    on order_items (order_id);
create index if not exists idx_order_items_product  on order_items (product_id);
create index if not exists idx_returns_order_product on returns (order_id, product_id);
create index if not exists idx_returns_created      on returns (created_at desc);
create index if not exists idx_tickets_customer     on support_tickets (customer_id, created_at desc);
create index if not exists idx_tickets_created      on support_tickets (created_at desc);
