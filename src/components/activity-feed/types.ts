export type FormType = 'Issue Report' | 'Hourly Instruction' | 'Sign Off' | 'Quality Report' | 'Invoice';

export type ActivitySourceTable =
  | 'sign_offs'
  | 'hourly_agreements'
  | 'invoices'
  | 'issue_report_submissions'
  | 'quality_report_submissions';

export interface FeedItem {
  id: string;
  form_type: FormType;
  submitted_by: string;
  site_id: string | null;
  site_name: string | null;
  plot_name: string | null;
  created_at: string;
  status: string | null;
  source_table: ActivitySourceTable;
}

export interface Site {
  id: string;
  name: string;
  developer_id: string;
}

export interface Developer {
  id: string;
  name: string;
}
