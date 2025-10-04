-- Find My Friends - Minimal Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_locations CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;

-- Current location (one per user)
CREATE TABLE user_locations (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  url TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friendships (simple bidirectional)
CREATE TABLE friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  friend_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);

-- Row Level Security (RLS)

-- Locations: Users can update own, friends can view
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own location" ON user_locations;
CREATE POLICY "Users can update own location"
  ON user_locations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Friends can view locations" ON user_locations;
CREATE POLICY "Friends can view locations"
  ON user_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = user_locations.user_id)
         OR (friendships.friend_id = auth.uid() AND friendships.user_id = user_locations.user_id)
    )
  );

-- Friendships: Users can manage their friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view friendships" ON friendships;
CREATE POLICY "Users can view friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete friendships" ON friendships;
CREATE POLICY "Users can delete friendships"
  ON friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
