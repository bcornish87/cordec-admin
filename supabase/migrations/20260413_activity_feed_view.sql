-- Unified activity feed view across all five submission tables.
-- Used by the Dashboard "Recent Submissions" feed.
-- Each source table is normalised to a common shape.

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
  'Hourly Agreement'::text  AS form_type,
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
LEFT JOIN profiles p ON p.user_id = inv.user_id

UNION ALL

SELECT
  ir.id,
  'Issue Report'::text      AS form_type,
  ir.user_id,
  p.first_name,
  p.last_name,
  ir.site_name,
  ir.plot_name,
  ir.status,
  ir.created_at,
  'issue_reports'::text     AS source_table
FROM issue_reports ir
LEFT JOIN profiles p ON p.user_id = ir.user_id

UNION ALL

SELECT
  qr.id,
  'Quality Report'::text    AS form_type,
  qr.user_id,
  p.first_name,
  p.last_name,
  qr.site_name,
  qr.plot_name,
  qr.status,
  qr.created_at,
  'quality_reports'::text   AS source_table
FROM quality_reports qr
LEFT JOIN profiles p ON p.user_id = qr.user_id;

-- Grant read access to authenticated users
GRANT SELECT ON activity_feed TO authenticated;
