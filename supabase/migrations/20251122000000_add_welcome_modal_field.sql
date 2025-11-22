-- Add welcome_modal_seen field to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS welcome_modal_seen BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_welcome_modal 
ON user_profiles(welcome_modal_seen) 
WHERE welcome_modal_seen = FALSE;
