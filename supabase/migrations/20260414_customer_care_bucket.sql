-- Storage bucket for customer-care PDFs. Kept PRIVATE because the PDFs contain
-- homeowner PII (names, phones, emails). Access is via signed URLs rather than
-- the public URL pattern used by `logos` and `site-plans`.

INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-care', 'customer-care', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can read customer-care objects"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'customer-care' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can upload customer-care objects"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'customer-care' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update customer-care objects"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'customer-care' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete customer-care objects"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'customer-care' AND has_role(auth.uid(), 'admin'::app_role));
