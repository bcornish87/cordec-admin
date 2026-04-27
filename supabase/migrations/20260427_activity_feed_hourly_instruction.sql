-- Rename the form_type label emitted by the activity_feed view
-- from "Hourly Agreement" to "Hourly Instruction" so the dashboard
-- feed matches the renamed UI/email/PDF labels. The underlying
-- table (hourly_agreements) is unchanged.

CREATE OR REPLACE VIEW activity_feed AS

SELECT
  so.id,
  'Sign Off'::text          AS form_type,
  so.user_id,
  p.first_name,
  p.last_name,
  so.site_name,
  so.plot_name,
  NULL::text                AS status,
  so.created_at,
  'sign_offs'::text         AS source_table
FROM sign_offs so
LEFT JOIN profiles p ON p.user_id = so.user_id

UNION ALL

SELECT
  ha.id,
  'Hourly Instruction'::text AS form_type,
  ha.user_id,
  p.first_name,
  p.last_name,
  ha.site_name,
  ha.plot_name,
  NULL::text                AS status,
  ha.created_at,
  'hourly_agreements'::text AS source_table
FROM hourly_agreements ha
LEFT JOIN profiles p ON p.user_id = ha.user_id

UNION ALL

SELECT
  inv.id,
  'Invoice'::text           AS form_type,
  inv.user_id,
  p.first_name,
  p.last_name,
  NULL::text                AS site_name,
  NULL::text                AS plot_name,
  inv.status,
  inv.created_at,
  'invoices'::text          AS source_table
FROM invoices inv
LEFT JOIN profiles p ON p.user_id = inv.user_id;

GRANT SELECT ON activity_feed TO authenticated;
