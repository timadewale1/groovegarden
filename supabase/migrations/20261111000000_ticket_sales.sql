create table if not exists public.ticket_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  full_name text not null,
  email text not null,
  phone text not null,
  event_name text not null,
  event_date date not null,
  currency text not null check (currency = 'NGN'),
  unit_amount_kobo bigint not null check (unit_amount_kobo > 0),
  amount_kobo bigint not null check (amount_kobo > 0),
  quantity integer not null check (quantity = 1),
  status text not null check (status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  email_claimed_at timestamptz,
  email_sent_at timestamptz
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ticket_orders(id) on delete restrict,
  ticket_code varchar(5) not null unique check (ticket_code ~ '^[0-9]{5}$'),
  slot_number integer not null check (slot_number = 1),
  created_at timestamptz not null default now(),
  unique (order_id, slot_number)
);

alter table public.ticket_orders enable row level security;
alter table public.tickets enable row level security;

revoke all on public.ticket_orders from anon, authenticated;
revoke all on public.tickets from anon, authenticated;
grant all on public.ticket_orders to service_role;
grant all on public.tickets to service_role;

create or replace function public.complete_ticket_order(
  p_reference text,
  p_amount_kobo bigint,
  p_currency text,
  p_email text
)
returns table (
  ticket_code varchar(5),
  full_name text,
  email text,
  phone text,
  event_name text,
  event_date text,
  quantity integer,
  amount_kobo bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.ticket_orders%rowtype;
  v_slot integer;
  v_code varchar(5);
  v_inserted integer;
  v_attempts integer;
begin
  select *
    into v_order
    from public.ticket_orders
    where reference = p_reference
    for update;

  if not found then
    raise exception 'Ticket order not found';
  end if;

  if v_order.amount_kobo <> p_amount_kobo
    or v_order.amount_kobo <> v_order.unit_amount_kobo * v_order.quantity
    or v_order.currency <> p_currency
    or lower(v_order.email) <> lower(p_email)
    or v_order.status not in ('pending', 'paid') then
    raise exception 'Payment does not match ticket order';
  end if;

  if v_order.status = 'pending' then
    update public.ticket_orders
      set status = 'paid', paid_at = now()
      where id = v_order.id;
  end if;

  for v_slot in 1..v_order.quantity loop
    if exists (
      select 1 from public.tickets
      where order_id = v_order.id and slot_number = v_slot
    ) then
      continue;
    end if;

    v_attempts := 0;
    loop
      v_attempts := v_attempts + 1;
      if v_attempts > 90000 then
        raise exception 'No ticket IDs are available';
      end if;
      v_code := (floor(random() * 90000)::integer + 10000)::text;
      insert into public.tickets (order_id, ticket_code, slot_number)
        values (v_order.id, v_code, v_slot)
        on conflict (ticket_code) do nothing;
      get diagnostics v_inserted = row_count;
      exit when v_inserted = 1;
    end loop;
  end loop;

  return query
    select t.ticket_code, v_order.full_name, v_order.email, v_order.phone,
      v_order.event_name, v_order.event_date::text, v_order.quantity, v_order.amount_kobo
    from public.tickets t
    where t.order_id = v_order.id
    order by t.slot_number;
end;
$$;

create or replace function public.claim_ticket_email(p_reference text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed boolean := false;
begin
  update public.ticket_orders
    set email_claimed_at = now()
    where reference = p_reference
      and status = 'paid'
      and email_sent_at is null
      and (email_claimed_at is null or email_claimed_at < now() - interval '10 minutes')
    returning true into v_claimed;
  return coalesce(v_claimed, false);
end;
$$;

create or replace function public.mark_ticket_email_sent(p_reference text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ticket_orders
    set email_sent_at = now(), email_claimed_at = null
    where reference = p_reference and status = 'paid';
  if not found then
    raise exception 'Paid ticket order not found';
  end if;
end;
$$;

create or replace function public.release_ticket_email(p_reference text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ticket_orders
    set email_claimed_at = null
    where reference = p_reference and email_sent_at is null;
end;
$$;

revoke all on function public.complete_ticket_order(text, bigint, text, text) from public, anon, authenticated;
revoke all on function public.claim_ticket_email(text) from public, anon, authenticated;
revoke all on function public.mark_ticket_email_sent(text) from public, anon, authenticated;
revoke all on function public.release_ticket_email(text) from public, anon, authenticated;
grant execute on function public.complete_ticket_order(text, bigint, text, text) to service_role;
grant execute on function public.claim_ticket_email(text) to service_role;
grant execute on function public.mark_ticket_email_sent(text) to service_role;
grant execute on function public.release_ticket_email(text) to service_role;

alter table public.ticket_orders
  drop constraint if exists ticket_orders_quantity_check;
alter table public.ticket_orders
  add constraint ticket_orders_quantity_check check (quantity = 1);
alter table public.tickets
  drop constraint if exists tickets_slot_number_check;
alter table public.tickets
  add constraint tickets_slot_number_check check (slot_number = 1);
