-- Admins need to edit any site row (grid reference, lat/lng, archive, status).
-- Existing RLS presumably restricts UPDATE to the row's creator, which breaks
-- the admin UI when a site was created by another user. Matches the pattern
-- used by sign_offs / hourly_agreements / customer_care_jobs admin policies.

CREATE POLICY "Admins can update all sites"
  ON public.sites FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
