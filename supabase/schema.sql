create extension if not exists pgcrypto;

create table if not exists public.admins (
  id text primary key default gen_random_uuid()::text,
  username text not null unique,
  password text not null,
  "createdAt" timestamptz default now()
);

create table if not exists public.students (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  "class" text not null,
  section text not null,
  "rollNo" text not null,
  password text not null,
  academicyear text,
  "accountExpiry" text,
  status text default 'active',
  lastlogin text,
  "admissionNo" text
);

create table if not exists public.teachers (
  id text primary key default gen_random_uuid()::text,
  "teacherName" text not null,
  "employeeId" text not null unique,
  subject text not null,
  status text default 'active',
  role text default 'teacher',
  password text not null,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz
);

create table if not exists public.settings (
  id text primary key,
  academicyear text,
  "accountExpiry" text,
  classes jsonb default '[]'::jsonb,
  sections jsonb default '[]'::jsonb
);

create table if not exists public.exams (
  id text primary key default gen_random_uuid()::text,
  "examName" text not null,
  subject text,
  "targetType" text,
  "examClass" text,
  duration numeric default 30,
  "totalMarks" numeric default 0,
  "startDate" text,
  "endDate" text,
  status text default 'active',
  "createdAt" timestamptz default now()
);

create table if not exists public.questions (
  id text primary key default gen_random_uuid()::text,
  "examId" text not null,
  "class" text,
  section text,
  "questionType" text default 'mcq',
  question text not null,
  "optionA" text,
  "optionB" text,
  "optionC" text,
  "optionD" text,
  answer text,
  answers jsonb default '[]'::jsonb,
  "blankAnswers" jsonb default '[]'::jsonb,
  "modelAnswer" text,
  explanation text,
  marks numeric default 1
);

create table if not exists public.results (
  id text primary key default gen_random_uuid()::text,
  "studentName" text,
  "participantName" text,
  "studentClass" text,
  "studentSection" text,
  section text,
  "rollNo" text,
  "admissionNo" text,
  "examId" text,
  "examName" text,
  subject text,
  "examClass" text,
  score numeric default 0,
  "automaticMarks" numeric default 0,
  "descriptiveMarks" numeric default 0,
  "totalMarks" numeric default 0,
  "correctAnswers" integer default 0,
  "totalQuestions" integer default 0,
  percentage numeric default 0,
  "hasDescriptiveQuestions" boolean default false,
  "subjectiveAnswers" jsonb default '[]'::jsonb,
  review jsonb default '[]'::jsonb,
  "reviewStatus" text default 'not_required',
  "resultPublished" boolean default false,
  "reviewedBy" text,
  "reviewedAt" timestamptz,
  "submittedAt" timestamptz default now(),
  "questionOrder" jsonb default '[]'::jsonb,
  "teacherName" text
);

create index if not exists idx_students_login on public.students ("class", section, "rollNo");
create index if not exists idx_exams_class on public.exams ("examClass");
create index if not exists idx_questions_exam on public.questions ("examId");
create index if not exists idx_results_exam on public.results ("examId");
create index if not exists idx_results_roll on public.results ("rollNo");
create index if not exists idx_results_status on public.results ("reviewStatus");

insert into public.settings (id, classes, sections)
values ('config', '["1","2","3","4","5","6","7","8","9","10"]'::jsonb, '[]'::jsonb)
on conflict (id) do nothing;

alter table public.admins enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.settings enable row level security;
alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.results enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.admins, public.students, public.teachers, public.settings, public.exams, public.questions, public.results to anon, authenticated;

drop policy if exists ahps_admins_all on public.admins;
create policy ahps_admins_all on public.admins for all to anon, authenticated using (true) with check (true);
drop policy if exists ahps_students_all on public.students;
create policy ahps_students_all on public.students for all to anon, authenticated using (true) with check (true);
drop policy if exists ahps_teachers_all on public.teachers;
create policy ahps_teachers_all on public.teachers for all to anon, authenticated using (true) with check (true);
drop policy if exists ahps_settings_all on public.settings;
create policy ahps_settings_all on public.settings for all to anon, authenticated using (true) with check (true);
drop policy if exists ahps_exams_all on public.exams;
create policy ahps_exams_all on public.exams for all to anon, authenticated using (true) with check (true);
drop policy if exists ahps_questions_all on public.questions;
create policy ahps_questions_all on public.questions for all to anon, authenticated using (true) with check (true);
drop policy if exists ahps_results_all on public.results;
create policy ahps_results_all on public.results for all to anon, authenticated using (true) with check (true);
