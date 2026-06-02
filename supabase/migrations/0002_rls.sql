-- Applied to the hosted project via Supabase MCP on 2026-06-02. Kept here for source control.
alter table yachts enable row level security;
alter table services enable row level security;
alter table service_options enable row level security;
alter table yacht_services enable row level security;
alter table availability_blocks enable row level security;
alter table booking_drafts enable row level security;
alter table bookings enable row level security;

-- Public (anon + authenticated) may READ only active public catalog + availability.
create policy "public read active yachts" on yachts
  for select using (is_active = true);
create policy "public read active services" on services
  for select using (is_active = true);
create policy "public read active service_options" on service_options
  for select using (is_active = true);
create policy "public read active yacht_services" on yacht_services
  for select using (is_active = true);
create policy "public read availability" on availability_blocks
  for select using (true);

-- Authenticated admins may read/write everything (admin role check refined in Phase 4).
create policy "admin all yachts" on yachts
  for all to authenticated using (true) with check (true);
create policy "admin all services" on services
  for all to authenticated using (true) with check (true);
create policy "admin all service_options" on service_options
  for all to authenticated using (true) with check (true);
create policy "admin all yacht_services" on yacht_services
  for all to authenticated using (true) with check (true);
create policy "admin all availability" on availability_blocks
  for all to authenticated using (true) with check (true);
create policy "admin read bookings" on bookings
  for select to authenticated using (true);
create policy "admin update bookings" on bookings
  for update to authenticated using (true) with check (true);

-- booking_drafts and booking writes happen via the service role (Server Actions),
-- which bypasses RLS. No anon write policies are defined, so anon cannot write.
