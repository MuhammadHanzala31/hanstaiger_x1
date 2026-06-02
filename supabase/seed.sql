-- Applied to the hosted project via Supabase MCP on 2026-06-02. Kept here for source control.
insert into yachts (slug, name, tagline, hero_image, base_price, included_guests, extra_guest_price,
  max_guests, min_nights, max_nights, deposit_mode, deposit_value, season_start, season_end, sort_order)
values (
  'x1', 'Hanstaiger X1', 'Book the X1 experience',
  'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=2400&q=80',
  2000000, 4, 500000, 12, 3, 14, 'percent', 20,
  '2026-05-01', '2026-10-31', 0
);

with svc as (
  insert into services (name, category, description, sort_order) values
    ('Private Chef', 'dining', 'Tailored onboard dining', 0),
    ('Jetskis', 'water', 'High-performance jetskis', 1),
    ('Spa & Massage', 'wellness', 'Onboard wellness', 2),
    ('Water Toys', 'water', 'Seabobs, paddleboards, and more', 3),
    ('DJ Station', 'entertainment', 'Onboard DJ and sound system', 4)
  returning id, name
)
insert into service_options (service_id, name, price, sort_order)
select svc.id, opt.name, opt.price, opt.ord from svc, lateral (
  values
    ('Private Chef','Breakfast', 50000, 0),
    ('Private Chef','Lunch', 80000, 1),
    ('Private Chef','Dinner', 120000, 2),
    ('Jetskis','Half day', 60000, 0),
    ('Jetskis','Full day', 100000, 1),
    ('Spa & Massage','Single session', 40000, 0),
    ('Water Toys','Full package', 70000, 0),
    ('DJ Station','Evening set', 90000, 0),
    ('DJ Station','Full day', 160000, 1)
) as opt(svc_name, name, price, ord)
where opt.svc_name = svc.name;

insert into yacht_services (yacht_id, service_id)
select y.id, s.id from yachts y cross join services s where y.slug = 'x1';
