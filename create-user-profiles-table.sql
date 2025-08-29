-- Create user_profiles table for registered/authenticated users
-- This table extends auth.users with additional profile information

-- Drop table if exists (for development only)
-- DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create the user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  -- Primary key matches auth.users.id for 1:1 relationship
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic profile information
  email TEXT NOT NULL,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  date_of_birth DATE,
  
  -- Size profile as JSONB for flexibility
  size_profile JSONB DEFAULT '{
    "chest": null,
    "waist": null,
    "inseam": null,
    "neck": null,
    "sleeve": null,
    "shoulder_width": null,
    "jacket_length": null,
    "shoe_size": {
      "us": null,
      "uk": null,
      "eu": null,
      "width": "medium"
    },
    "preferred_fit": {
      "jackets": "regular",
      "pants": "regular",
      "shirts": "regular"
    },
    "body_type": null,
    "measured_by": "self",
    "confidence_level": 3
  }'::jsonb,
  
  -- Style preferences as JSONB
  style_preferences JSONB DEFAULT '{
    "preferred_colors": [],
    "accent_colors": [],
    "avoid_colors": [],
    "preferred_styles": [],
    "occasions": [],
    "brands": [],
    "avoid_materials": [],
    "budget_ranges": {
      "suits": {"min": 0, "max": 0},
      "shirts": {"min": 0, "max": 0},
      "accessories": {"min": 0, "max": 0}
    }
  }'::jsonb,
  
  -- Saved addresses as JSONB array
  saved_addresses JSONB DEFAULT '[]'::jsonb,
  
  -- Saved payment methods (tokenized, no actual card data)
  saved_payment_methods JSONB DEFAULT '[]'::jsonb,
  
  -- Wishlist items (array of product IDs)
  wishlist_items JSONB DEFAULT '[]'::jsonb,
  
  -- Notification preferences
  notification_preferences JSONB DEFAULT '{
    "order_updates": {"email": true, "sms": false, "push": false},
    "promotions": {"email": true, "sms": false, "push": false},
    "size_reminders": true,
    "appointment_reminders": true,
    "new_arrivals": false,
    "personalized_recommendations": true
  }'::jsonb,
  
  -- Onboarding status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON public.user_profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- Create GIN indexes for JSONB columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_profiles_size_profile ON public.user_profiles USING GIN (size_profile);
CREATE INDEX IF NOT EXISTS idx_user_profiles_style_preferences ON public.user_profiles USING GIN (style_preferences);
CREATE INDEX IF NOT EXISTS idx_user_profiles_wishlist ON public.user_profiles USING GIN (wishlist_items);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can do everything (for admin/backend operations)
CREATE POLICY "Service role has full access" ON public.user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to automatically create user_profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Helper functions for common operations

-- Function to add item to wishlist
CREATE OR REPLACE FUNCTION public.add_to_wishlist(user_id UUID, product_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET wishlist_items = wishlist_items || jsonb_build_array(product_id)
  WHERE id = user_id
    AND NOT (wishlist_items @> jsonb_build_array(product_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove item from wishlist
CREATE OR REPLACE FUNCTION public.remove_from_wishlist(user_id UUID, product_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET wishlist_items = wishlist_items - product_id::text
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update size profile
CREATE OR REPLACE FUNCTION public.update_size_profile(
  user_id UUID,
  new_size_profile JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    size_profile = size_profile || new_size_profile,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update style preferences
CREATE OR REPLACE FUNCTION public.update_style_preferences(
  user_id UUID,
  new_preferences JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    style_preferences = style_preferences || new_preferences,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add sample data for testing (optional)
/*
INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  display_name,
  size_profile,
  style_preferences
) VALUES (
  'YOUR_USER_ID_HERE',
  'test@example.com',
  'Test User',
  'TestUser',
  '{
    "chest": 42,
    "waist": 34,
    "inseam": 32,
    "neck": 15.5,
    "preferred_fit": {
      "jackets": "slim",
      "pants": "regular",
      "shirts": "slim"
    }
  }'::jsonb,
  '{
    "preferred_colors": ["#000000", "#1a1a1a", "#003366"],
    "preferred_styles": ["business", "casual"],
    "occasions": ["work", "date night"],
    "brands": ["Hugo Boss", "Ralph Lauren"]
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;
*/

-- Grant permissions (if needed for your setup)
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- Comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Extended user profile information for registered users';
COMMENT ON COLUMN public.user_profiles.id IS 'UUID matching auth.users.id';
COMMENT ON COLUMN public.user_profiles.size_profile IS 'JSON object containing all body measurements and fit preferences';
COMMENT ON COLUMN public.user_profiles.style_preferences IS 'JSON object containing style, color, and brand preferences';
COMMENT ON COLUMN public.user_profiles.saved_addresses IS 'JSON array of saved shipping addresses';
COMMENT ON COLUMN public.user_profiles.saved_payment_methods IS 'JSON array of tokenized payment methods (no actual card data)';
COMMENT ON COLUMN public.user_profiles.wishlist_items IS 'JSON array of product IDs saved to wishlist';
COMMENT ON COLUMN public.user_profiles.notification_preferences IS 'JSON object of notification settings';