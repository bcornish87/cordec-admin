-- Bulk upsert plot_tasks from a JSONB array.
-- Each element must have: plot_id, task_template_id, name, type, sort_order, price.
-- Uses raw INSERT … ON CONFLICT which handles partial unique indexes correctly,
-- unlike the PostgREST upsert endpoint.
CREATE OR REPLACE FUNCTION bulk_upsert_plot_tasks(items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO plot_tasks (plot_id, task_template_id, name, type, sort_order, price, archived)
  SELECT
    (elem->>'plot_id')::uuid,
    (elem->>'task_template_id')::uuid,
    elem->>'name',
    (elem->>'type')::text,
    COALESCE((elem->>'sort_order')::int, 0),
    (elem->>'price')::numeric,
    false
  FROM jsonb_array_elements(items) AS elem
  ON CONFLICT (plot_id, task_template_id)
  DO UPDATE SET
    price    = EXCLUDED.price,
    archived = false,
    name     = EXCLUDED.name,
    type     = EXCLUDED.type;
END;
$$;
