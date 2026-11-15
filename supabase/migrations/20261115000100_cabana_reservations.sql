alter table public.ticket_orders
  add column if not exists ticket_type text not null default 'entry',
  add column if not exists cabana_name text;

alter table public.ticket_orders
  drop constraint if exists ticket_orders_ticket_type_check;

alter table public.ticket_orders
  add constraint ticket_orders_ticket_type_check
  check (ticket_type in ('entry', 'cabana_regular', 'cabana_premium'));

alter table public.ticket_orders
  drop constraint if exists ticket_orders_cabana_details_check;

alter table public.ticket_orders
  add constraint ticket_orders_cabana_details_check
  check (
    (ticket_type = 'entry' and cabana_name is null)
    or (ticket_type in ('cabana_regular', 'cabana_premium') and cabana_name is not null and quantity = 1)
  );

create table if not exists public.cabanas (
  name text primary key,
  ticket_type text not null check (ticket_type in ('cabana_regular', 'cabana_premium')),
  price_naira integer not null check (price_naira > 0),
  booking_reference text references public.ticket_orders(reference) on delete restrict,
  booking_event_date date,
  reserved_until timestamptz,
  booked_at timestamptz,
  check ((booking_reference is null) = (reserved_until is null) or booked_at is not null)
);

alter table public.cabanas
  add column if not exists booking_event_date date;

insert into public.cabanas (name, ticket_type, price_naira) values
  ('Annex 1', 'cabana_regular', 100000),
  ('Annex 2', 'cabana_regular', 100000),
  ('VIP 1', 'cabana_regular', 100000),
  ('VIP 2', 'cabana_regular', 100000),
  ('VIP 3', 'cabana_regular', 100000),
  ('VIP 4', 'cabana_regular', 100000),
  ('VIP 5', 'cabana_regular', 100000),
  ('Crown buy n sell', 'cabana_regular', 100000),
  ('Zinex', 'cabana_regular', 100000),
  ('Snack station', 'cabana_regular', 100000),
  ('Cabana 7', 'cabana_regular', 100000),
  ('Platinum 1', 'cabana_premium', 200000),
  ('Platinum 2', 'cabana_premium', 200000),
  ('Platinum 3', 'cabana_premium', 200000)
on conflict (name) do update
  set ticket_type = excluded.ticket_type,
      price_naira = excluded.price_naira;

alter table public.cabanas enable row level security;
revoke all on public.cabanas from anon, authenticated;
grant all on public.cabanas to service_role;

create or replace function public.reserve_cabana_order(
  p_cabana_name text,
  p_reference text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_event_name text,
  p_event_date date
)
returns table (available boolean, amount_kobo bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cabana public.cabanas%rowtype;
begin
  select *
    into v_cabana
    from public.cabanas
    where name = p_cabana_name
    for update;

  if not found then
    return query select false, null::bigint;
    return;
  end if;

  if v_cabana.booking_event_date is distinct from p_event_date then
    update public.cabanas
      set booking_reference = null, booking_event_date = p_event_date,
          reserved_until = null, booked_at = null
      where name = p_cabana_name;
    v_cabana.booking_reference := null;
    v_cabana.reserved_until := null;
    v_cabana.booked_at := null;
  end if;

  if v_cabana.booked_at is not null or v_cabana.reserved_until > now() then
    return query select false, null::bigint;
    return;
  end if;

  insert into public.ticket_orders (
    reference, full_name, email, phone, event_name, event_date, currency,
    unit_amount_kobo, amount_kobo, quantity, status, ticket_type, cabana_name
  ) values (
    p_reference, p_full_name, p_email, p_phone, p_event_name, p_event_date, 'NGN',
    v_cabana.price_naira::bigint * 100, v_cabana.price_naira::bigint * 100, 1, 'pending',
    v_cabana.ticket_type, v_cabana.name
  );

  update public.cabanas
    set booking_reference = p_reference,
        booking_event_date = p_event_date,
        reserved_until = now() + interval '5 minutes'
    where name = v_cabana.name;

  return query select true, v_cabana.price_naira::bigint * 100;
end;
$$;

drop function public.complete_ticket_order(text, bigint, text, text);

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
  amount_kobo bigint,
  ticket_type text,
  cabana_name text
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
    or v_order.status not in ('pending', 'paid', 'failed') then
    raise exception 'Payment does not match ticket order';
  end if;

  if v_order.ticket_type <> 'entry' then
    perform 1
      from public.cabanas
      where name = v_order.cabana_name
        and booking_reference = v_order.reference
        and booking_event_date = v_order.event_date
        and (
          (v_order.status = 'paid' and booked_at is not null)
          or (v_order.status <> 'paid' and booked_at is null)
        )
      for update;
    if not found then
      raise exception 'Cabana hold expired or is no longer available';
    end if;

    update public.cabanas
      set booked_at = coalesce(booked_at, now()),
          reserved_until = null
      where name = v_order.cabana_name and booking_reference = v_order.reference;
  end if;

  if v_order.status <> 'paid' then
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
        on conflict on constraint tickets_ticket_code_key do nothing;
      get diagnostics v_inserted = row_count;
      exit when v_inserted = 1;
    end loop;
  end loop;

  return query
    select t.ticket_code, v_order.full_name, v_order.email, v_order.phone,
      v_order.event_name, v_order.event_date::text, v_order.quantity, v_order.amount_kobo,
      v_order.ticket_type, v_order.cabana_name
    from public.tickets t
    where t.order_id = v_order.id
    order by t.slot_number;
end;
$$;

create or replace function public.fail_ticket_order(p_reference text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  update public.ticket_orders
    set status = 'failed'
    where reference = p_reference and status = 'pending'
    returning status into v_status;

  if found then
    update public.cabanas
      set booking_reference = null, reserved_until = null
      where booking_reference = p_reference and booked_at is null;
    return true;
  end if;

  select status
    into v_status
    from public.ticket_orders
    where reference = p_reference;

  return coalesce(v_status = 'failed', false);
end;
$$;

drop function if exists public.redeem_ticket(text);

create function public.redeem_ticket(p_ticket_code text)
returns table (
  status text,
  ticket_code varchar(5),
  full_name text,
  event_name text,
  event_date date,
  used_at timestamptz,
  ticket_type text,
  cabana_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket_id uuid;
  v_ticket_code varchar(5);
  v_used_at timestamptz;
  v_full_name text;
  v_event_name text;
  v_event_date date;
  v_ticket_type text;
  v_cabana_name text;
begin
  select t.id, t.ticket_code, t.used_at, o.full_name, o.event_name, o.event_date,
      o.ticket_type, o.cabana_name
    into v_ticket_id, v_ticket_code, v_used_at, v_full_name, v_event_name, v_event_date,
      v_ticket_type, v_cabana_name
    from public.tickets t
    join public.ticket_orders o on o.id = t.order_id
    where t.ticket_code = p_ticket_code
      and o.status = 'paid'
    for update of t;

  if not found then
    status := 'not_found';
    return next;
    return;
  end if;

  if v_used_at is not null then
    status := 'used';
    ticket_code := v_ticket_code;
    used_at := v_used_at;
    ticket_type := v_ticket_type;
    cabana_name := v_cabana_name;
    return next;
    return;
  end if;

  update public.tickets
    set used_at = now()
    where id = v_ticket_id
    returning public.tickets.used_at into v_used_at;

  status := 'valid';
  ticket_code := v_ticket_code;
  full_name := v_full_name;
  event_name := v_event_name;
  event_date := v_event_date;
  used_at := v_used_at;
  ticket_type := v_ticket_type;
  cabana_name := v_cabana_name;
  return next;
end;
$$;

revoke all on function public.reserve_cabana_order(text, text, text, text, text, text, date) from public, anon, authenticated;
revoke all on function public.complete_ticket_order(text, bigint, text, text) from public, anon, authenticated;
revoke all on function public.fail_ticket_order(text) from public, anon, authenticated;
revoke all on function public.redeem_ticket(text) from public, anon, authenticated;
grant execute on function public.reserve_cabana_order(text, text, text, text, text, text, date) to service_role;
grant execute on function public.complete_ticket_order(text, bigint, text, text) to service_role;
grant execute on function public.fail_ticket_order(text) to service_role;
grant execute on function public.redeem_ticket(text) to service_role;
