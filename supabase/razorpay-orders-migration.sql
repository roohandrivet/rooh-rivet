alter table public.orders
add column if not exists razorpay_order_id text,
add column if not exists razorpay_payment_id text,
add column if not exists razorpay_signature text,
add column if not exists paid_at timestamp with time zone;

create unique index if not exists orders_razorpay_order_id_idx
on public.orders (razorpay_order_id)
where razorpay_order_id is not null;

create unique index if not exists orders_razorpay_payment_id_idx
on public.orders (razorpay_payment_id)
where razorpay_payment_id is not null;
