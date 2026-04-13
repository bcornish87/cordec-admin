-- Allow admin users to delete any submission.
-- Required for the Dashboard activity feed delete button.

CREATE POLICY "Admins can delete all sign-offs"
  ON sign_offs FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all hourly agreements"
  ON hourly_agreements FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all invoices"
  ON invoices FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
