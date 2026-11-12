-- Paste this whole file into Supabase -> SQL Editor -> Run. Safe to run more than once.
-- It does NOT drop or re-seed anything.

-- 1) Undo the test changes: order 1012 was cancelled by a test, and ticket #2 is a test ticket.
update orders set status = 'placed' where id = 1012 and status = 'cancelled';
delete from support_tickets where id = 2 and customer_id = 'C001' and order_id = 1003;

-- 2) Speed: indexes for every lookup the app does.
create index if not exists idx_orders_customer_date  on orders (customer_id, order_date desc, id desc);
create index if not exists idx_order_items_order     on order_items (order_id);
create index if not exists idx_order_items_product   on order_items (product_id);
create index if not exists idx_returns_order_product on returns (order_id, product_id);
create index if not exists idx_returns_created       on returns (created_at desc);
create index if not exists idx_tickets_customer      on support_tickets (customer_id, created_at desc);
create index if not exists idx_tickets_created       on support_tickets (created_at desc);

-- 3) Check: expect order 1012 = placed, tickets = only #1, returns = only #1, 7 indexes listed.
select id, status from orders where id = 1012;
select id, customer_id from support_tickets order by id;
select id from returns order by id;
select indexname from pg_indexes where schemaname = 'public' and indexname like 'idx\_%' order by 1;
