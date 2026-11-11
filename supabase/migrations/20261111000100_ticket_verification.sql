alter table public.tickets
  add column if not exists used_at timestamptz;

create or replace function public.redeem_ticket(p_ticket_code text)
returns table (
  status text,
  ticket_code varchar(5),
  full_name text,
  event_name text,
  event_date date,
  used_at timestamptz
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
begin
  select t.id, t.ticket_code, t.used_at, o.full_name, o.event_name, o.event_date
    into v_ticket_id, v_ticket_code, v_used_at, v_full_name, v_event_name, v_event_date
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
  return next;
end;
$$;

revoke all on function public.redeem_ticket(text) from public, anon, authenticated;
grant execute on function public.redeem_ticket(text) to service_role;
