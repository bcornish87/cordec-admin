-- Only count sites with garages/externals when at least one plot_task of
-- that type has a price (rate) associated. Internals are unchanged.
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT json_build_object(
    'active_developers', (SELECT count(*) FROM developers WHERE is_archived = false),
    'active_sites', (SELECT count(*) FROM sites WHERE is_archived = false),
    'inactive_site_status', (SELECT count(*) FROM sites WHERE is_archived = false AND status = 'inactive'),
    'total_units', (SELECT count(*) FROM plots p JOIN sites s ON s.id = p.site_id WHERE p.is_archived = false AND s.is_archived = false),
    'decorators', (SELECT count(DISTINCT user_id) FROM user_roles WHERE role = 'decorator'),
    'staff', (SELECT count(DISTINCT user_id) FROM user_roles WHERE role != 'decorator'),
    'active_users', (SELECT count(*) FROM profiles WHERE is_active = true),
    'inactive_users', (SELECT count(*) FROM profiles WHERE is_active = false),
    'contacts', (SELECT count(*) FROM contacts WHERE is_archived = false),
    'sites_with_internals', (SELECT count(DISTINCT s.id) FROM sites s JOIN plots p ON p.site_id = s.id JOIN plot_tasks pt ON pt.plot_id = p.id WHERE s.is_archived = false AND pt.type = 'internal' AND pt.archived = false),
    'sites_with_externals', (SELECT count(DISTINCT s.id) FROM sites s JOIN plots p ON p.site_id = s.id JOIN plot_tasks pt ON pt.plot_id = p.id WHERE s.is_archived = false AND pt.type = 'external' AND pt.archived = false AND pt.price > 0),
    'sites_with_garages', (SELECT count(DISTINCT s.id) FROM sites s JOIN plots p ON p.site_id = s.id JOIN plot_tasks pt ON pt.plot_id = p.id WHERE s.is_archived = false AND pt.type = 'garage' AND pt.archived = false AND pt.price > 0),
    'total_value', (SELECT coalesce(sum(pt.price), 0) FROM plot_tasks pt JOIN plots p ON p.id = pt.plot_id JOIN sites s ON s.id = p.site_id WHERE pt.archived = false AND pt.price > 0 AND p.is_archived = false AND s.is_archived = false),
    'priced_tasks', (SELECT count(*) FROM plot_tasks pt JOIN plots p ON p.id = pt.plot_id JOIN sites s ON s.id = p.site_id WHERE pt.archived = false AND pt.price > 0 AND p.is_archived = false AND s.is_archived = false),
    'unpriced_tasks', (SELECT count(*) FROM plot_tasks pt JOIN plots p ON p.id = pt.plot_id JOIN sites s ON s.id = p.site_id WHERE pt.archived = false AND (pt.price IS NULL OR pt.price = 0) AND p.is_archived = false AND s.is_archived = false),
    'top_developers', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT d.name,
          count(DISTINCT s.id) as sites,
          count(DISTINCT p.id) as units
        FROM developers d
        LEFT JOIN sites s ON s.developer_id = d.id AND s.is_archived = false
        LEFT JOIN plots p ON p.site_id = s.id AND p.is_archived = false
        WHERE d.is_archived = false
        GROUP BY d.id, d.name
        ORDER BY count(DISTINCT p.id) DESC
        LIMIT 5
      ) t
    )
  );
$function$;
