
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  notes text,
  items jsonb not null,
  food_total numeric(10,2) not null,
  delivery_fee numeric(10,2) not null,
  total numeric(10,2) not null,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Anyone can submit orders"
  on public.orders for insert
  to anon, authenticated
  with check (true);
