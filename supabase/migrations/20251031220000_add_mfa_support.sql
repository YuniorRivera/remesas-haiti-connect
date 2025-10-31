-- Add MFA fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS two_factor_method TEXT CHECK (two_factor_method IN ('sms', 'email', 'totp')),
  ADD COLUMN IF NOT EXISTS totp_secret TEXT,
  ADD COLUMN IF NOT EXISTS backup_codes TEXT[];

-- Create table for OTP codes
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('sms', 'email')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  ip_address TEXT,
  attempt_count INTEGER DEFAULT 0 NOT NULL
);

-- Create index for quick lookups
CREATE INDEX idx_otp_codes_user_id ON otp_codes(user_id, expires_at) WHERE used = false;
CREATE INDEX idx_otp_codes_code ON otp_codes(code) WHERE used = false AND expires_at > now();

-- Create table for TOTP enrollments
CREATE TABLE IF NOT EXISTS totp_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  secret TEXT NOT NULL,
  verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  backup_codes TEXT[]
);

-- RLS policies for otp_codes
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own OTP codes"
  ON otp_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage OTP codes"
  ON otp_codes FOR ALL
  USING (true);

-- RLS policies for totp_enrollments
ALTER TABLE totp_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own TOTP enrollments"
  ON totp_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage TOTP enrollments"
  ON totp_enrollments FOR ALL
  USING (true);

-- Function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION clean_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM otp_codes 
  WHERE expires_at < now() - interval '1 day';
END;
$$;

-- Create trigger to clean up old OTP codes periodically
CREATE OR REPLACE FUNCTION trigger_clean_otps()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clean up expired codes after each new OTP creation
  IF random() < 0.1 THEN -- 10% chance to avoid too frequent cleanup
    PERFORM clean_expired_otps();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_otp_codes_trigger
  AFTER INSERT ON otp_codes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_clean_otps();

-- Function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes(count INTEGER DEFAULT 10)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
DECLARE
  codes TEXT[];
  i INTEGER;
BEGIN
  FOR i IN 1..count LOOP
    codes := array_append(codes, upper(substr(md5(random()::text || i::text), 1, 8)));
  END LOOP;
  RETURN codes;
END;
$$;

-- Update profiles to allow users to update their own MFA settings
CREATE POLICY "Users can update their own MFA settings"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Only allow MFA-related columns to be updated by user
    (OLD.two_factor_enabled IS DISTINCT FROM NEW.two_factor_enabled OR
     OLD.two_factor_method IS DISTINCT FROM NEW.two_factor_method)
  );

