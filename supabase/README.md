# AHPS Supabase Migration

Run `supabase/schema.sql` in the Supabase SQL Editor. Then copy the project URL and publishable/anon key from Project Settings -> API into `js/supabase-config.js`.

Do not place a Supabase secret/service-role key in browser code.
Existing Firebase data must be imported into the matching tables before production cutover.
