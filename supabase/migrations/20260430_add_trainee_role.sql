-- Add 'trainee' to the app_role enum (UK National Minimum Wage rate handled at app level)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'trainee';
