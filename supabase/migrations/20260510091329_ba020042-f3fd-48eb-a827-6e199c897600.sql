
alter table public.orders
  add constraint orders_name_len check (char_length(customer_name) between 1 and 120),
  add constraint orders_phone_len check (char_length(phone) between 4 and 40),
  add constraint orders_address_len check (char_length(address) between 3 and 250),
  add constraint orders_notes_len check (notes is null or char_length(notes) <= 1000),
  add constraint orders_total_pos check (total >= 0 and food_total >= 0 and delivery_fee >= 0);
