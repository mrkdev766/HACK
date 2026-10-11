-- Migration: 20261011000002_add_budget_corrections_and_preferred_transport.sql
-- Adds preferred transport mode and price correction fields to destinations table

alter table public.destinations
  add column if not exists preferred_transport text default 'walking',
  add column if not exists custom_notes text,
  add column if not exists actual_spend numeric(10,2);
