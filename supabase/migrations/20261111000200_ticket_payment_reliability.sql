alter table public.ticket_orders
  drop constraint if exists ticket_orders_status_check;

alter table public.ticket_orders
  add constraint ticket_orders_status_check
  check (status in ('pending', 'paid', 'failed'));

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
    or v_order.status not in ('pending', 'paid', 'failed') then
    raise exception 'Payment does not match ticket order';
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
    return true;
  end if;

  select status
    into v_status
    from public.ticket_orders
    where reference = p_reference;

  return coalesce(v_status = 'failed', false);
end;
$$;

revoke all on function public.complete_ticket_order(text, bigint, text, text) from public, anon, authenticated;
revoke all on function public.fail_ticket_order(text) from public, anon, authenticated;
grant execute on function public.complete_ticket_order(text, bigint, text, text) to service_role;
grant execute on function public.fail_ticket_order(text) to service_role;
