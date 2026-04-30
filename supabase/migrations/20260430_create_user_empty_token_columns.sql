-- Fix create_user RPC so admin-created auth.users rows have all GoTrue
-- token columns set to '' instead of NULL. GoTrue's /recover (and other)
-- handlers scan these columns into Go strings; a NULL crashes the scan
-- with "converting NULL to string is unsupported", which surfaces in the
-- UI as "Unable to process request" when an admin-created user clicks
-- Forgot password.
--
-- Backfill any existing rows in the same shape so they're recoverable.

UPDATE auth.users SET
  email_change               = COALESCE(email_change, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  confirmation_token         = COALESCE(confirmation_token, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, '')
WHERE
  email_change               IS NULL OR
  email_change_token_new     IS NULL OR
  email_change_token_current IS NULL OR
  recovery_token             IS NULL OR
  confirmation_token         IS NULL OR
  phone_change               IS NULL OR
  phone_change_token         IS NULL OR
  reauthentication_token     IS NULL;

CREATE OR REPLACE FUNCTION public.create_user(
  _email text,
  _password text,
  _first_name text,
  _last_name text,
  _phone text DEFAULT NULL,
  _post_code text DEFAULT NULL,
  _role text DEFAULT 'decorator',
  _rate numeric DEFAULT 18,
  _sort_code text DEFAULT NULL,
  _account_number text DEFAULT NULL,
  _national_insurance_number text DEFAULT NULL,
  _utr_number text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _new_user_id uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  _new_user_id := (
    SELECT id FROM auth.users WHERE email = _email
  );

  IF _new_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'A user with this email already exists';
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change, email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token,
    raw_app_meta_data, raw_user_meta_data
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated', _email,
    crypt(_password, gen_salt('bf')),
    now(), now(), now(),
    '', '',
    '', '', '',
    '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('first_name', _first_name, 'last_name', _last_name)
  )
  RETURNING id INTO _new_user_id;

  INSERT INTO public.profiles (
    user_id, first_name, last_name, email, phone, post_code,
    sort_code, account_number, national_insurance_number, utr_number, status
  )
  VALUES (
    _new_user_id, _first_name, _last_name, _email, _phone, _post_code,
    _sort_code, _account_number, _national_insurance_number, _utr_number, 'approved'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name                = EXCLUDED.first_name,
    last_name                 = EXCLUDED.last_name,
    email                     = EXCLUDED.email,
    phone                     = EXCLUDED.phone,
    post_code                 = EXCLUDED.post_code,
    sort_code                 = EXCLUDED.sort_code,
    account_number            = EXCLUDED.account_number,
    national_insurance_number = EXCLUDED.national_insurance_number,
    utr_number                = EXCLUDED.utr_number,
    status                    = 'approved';

  INSERT INTO public.user_roles (user_id, role, rate)
  VALUES (_new_user_id, _role::app_role, _rate);

  RETURN _new_user_id;
END;
$function$;
