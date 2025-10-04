# Find My Friends - Supabase Backend

Minimal backend setup using Supabase for real-time friend location tracking.

## Database Schema

**Two tables:**
1. `user_locations` - Current browsing location per user
2. `friendships` - Friend connections between users

## Setup Instructions

### 1. Get API Credentials

1. Go to **Supabase Project Settings** (gear icon)
2. Click **API** in the sidebar
3. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 2. Configure Extension

You'll use these credentials in the browser extension to connect to Supabase.

## API Usage

The extension will use Supabase JS client to:

### Update Your Location
```javascript
await supabase
  .from('user_locations')
  .upsert({
    user_id: user.id,
    url: currentUrl,
    last_updated: new Date()
  });
```

### Get Friends' Locations
```javascript
// Get your friendships
const { data: friendships } = await supabase
  .from('friendships')
  .select('friend_id')
  .eq('user_id', user.id);

// Get their locations
const friendIds = friendships.map(f => f.friend_id);
const { data: locations } = await supabase
  .from('user_locations')
  .select('*')
  .in('user_id', friendIds);
```

### Add a Friend
```javascript
await supabase
  .from('friendships')
  .insert({
    user_id: myUserId,
    friend_id: theirUserId
  });
```

## Row Level Security (RLS)

The schema includes security policies:
- ✅ Users can only update their own location
- ✅ Users can only see friends' locations
- ✅ Users can only manage their own friendships

## Next Steps

1. Install `@supabase/supabase-js` in the extension
2. Add authentication UI
3. Update background.js to sync locations
4. Update popup.js to fetch real friends' data
