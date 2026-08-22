create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique,
  name text not null,
  description text,
  version text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists editions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  edition_code text not null,
  name text not null,
  activation_model text not null default 'online',
  status text not null default 'active',
  unique(product_id, edition_code)
);

create table if not exists features (
  id uuid primary key default gen_random_uuid(),
  feature_code text not null unique,
  name text not null,
  description text,
  value_type text not null default 'boolean',
  status text not null default 'active'
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  edition_id uuid references editions(id) on delete set null,
  plan_code text not null,
  name text not null,
  billing_type text not null default 'subscription',
  duration_days integer,
  price numeric(12,2) not null default 0,
  currency text not null default 'INR',
  max_activations integer not null default 1,
  max_students integer,
  max_teachers integer,
  status text not null default 'active',
  unique(product_id, plan_code)
);

create table if not exists plan_features (
  plan_id uuid not null references plans(id) on delete cascade,
  feature_id uuid not null references features(id) on delete cascade,
  enabled boolean not null default true,
  limit_value text,
  primary key(plan_id, feature_id)
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null unique,
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists licenses (
  id uuid primary key default gen_random_uuid(),
  license_key_hash text not null unique,
  license_key_hint text,
  customer_id uuid not null references customers(id) on delete restrict,
  product_id uuid not null references products(id) on delete restrict,
  edition_id uuid references editions(id) on delete set null,
  plan_id uuid references plans(id) on delete set null,
  starts_at timestamptz not null,
  expires_at timestamptz,
  status text not null default 'active',
  allowed_activations integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists instances (
  id uuid primary key default gen_random_uuid(),
  instance_code text not null unique,
  product_id uuid not null references products(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  domain text,
  platform text not null default 'online',
  installation_name text,
  fingerprint_hash text,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  status text not null default 'active'
);

create table if not exists activations (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references licenses(id) on delete cascade,
  instance_id uuid not null references instances(id) on delete cascade,
  activated_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  status text not null default 'active',
  unique(license_id, instance_id)
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references licenses(id) on delete cascade,
  billing_cycle text not null,
  external_customer_ref text,
  external_subscription_ref text,
  starts_at timestamptz not null,
  renews_at timestamptz,
  status text not null default 'active'
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  license_id uuid references licenses(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  provider text,
  external_payment_ref text,
  paid_at timestamptz,
  status text not null default 'pending'
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_licenses_customer on licenses(customer_id);
create index if not exists idx_licenses_product on licenses(product_id);
create index if not exists idx_activations_license on activations(license_id);
create index if not exists idx_instances_product on instances(product_id);
create index if not exists idx_subscriptions_license on subscriptions(license_id);

-- Example dynamic product/feature seed. Replace or extend through the manager UI.
insert into products(product_code, name, description, version)
values ('RAS-ASSESS', 'RAS Assessment', 'Online and local examination platform', '1.0')
on conflict (product_code) do nothing;

insert into features(feature_code, name, description, value_type)
values
  ('ASSESSMENTS', 'Assessments', 'Create and conduct assessments', 'boolean'),
  ('QUESTION_MANAGER', 'Question Manager', 'Create and manage questions', 'boolean'),
  ('LIVE_MONITOR', 'Live Monitor', 'Real-time examination monitoring', 'boolean'),
  ('REPORTS', 'Reports', 'Assessment and performance reports', 'boolean'),
  ('RESULT_ANALYSIS', 'Result Analysis', 'Advanced result analytics', 'boolean')
on conflict (feature_code) do nothing;
