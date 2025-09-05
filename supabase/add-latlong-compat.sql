-- =====================================================
-- Compatibility layer: support latitude/longitude on issues
-- Adds lat/lng columns and keeps them in sync with geography 'location'
-- Safe to run multiple times.
-- =====================================================

-- Add columns if missing
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS longitude double precision;

-- Create trigger function to sync location <-> lat/lng
CREATE OR REPLACE FUNCTION public.sync_issues_location() RETURNS TRIGGER AS $$
BEGIN
  -- If lat/lng provided, set location
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSIF NEW.location IS NOT NULL THEN
    -- If only location provided, backfill lat/lng
    NEW.latitude := COALESCE(NEW.latitude, ST_Y(NEW.location::geometry));
    NEW.longitude := COALESCE(NEW.longitude, ST_X(NEW.location::geometry));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_sync_issues_location ON public.issues;
CREATE TRIGGER trg_sync_issues_location
  BEFORE INSERT OR UPDATE ON public.issues
  FOR EACH ROW EXECUTE PROCEDURE public.sync_issues_location();

-- Simple smoke check
SELECT 'LATLNG COMPAT READY' AS status;
