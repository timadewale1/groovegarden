alter table public.ticket_orders
  drop constraint if exists ticket_orders_quantity_check;

alter table public.ticket_orders
  add constraint ticket_orders_quantity_check
  check (quantity between 1 and 5);

alter table public.tickets
  drop constraint if exists tickets_slot_number_check;

alter table public.tickets
  add constraint tickets_slot_number_check
  check (slot_number between 1 and 5);
