# Supabase Database Setup Guide

## Step 1: Create Tables in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **"New query"**
4. Copy and paste the contents of `supabase-schema.sql` into the editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" - this means the tables were created successfully

## Step 2: Verify Tables Were Created

1. Go to **Table Editor** (in the left sidebar)
2. You should see two new tables:
   - `subscriptions`
   - `notification_settings`

## Step 3: Verify Row Level Security (RLS)

1. In **Table Editor**, click on the `subscriptions` table
2. Click on the **"Policies"** tab
3. You should see 4 policies:
   - Users can view their own subscriptions
   - Users can insert their own subscriptions
   - Users can update their own subscriptions
   - Users can delete their own subscriptions
4. Do the same for `notification_settings` table

## Step 4: Test the Setup (Optional)

You can test that RLS is working by:

1. Go to **SQL Editor**
2. Run this query (it should return empty since you're not authenticated):
   ```sql
   SELECT * FROM subscriptions;
   ```
3. This confirms that RLS is protecting your data

## What Was Created

### `subscriptions` Table
- Stores all subscription data
- Linked to users via `user_id` (references `auth.users`)
- Includes all fields: name, cost, renewal_date, cycle, status, category
- Has indexes for fast queries
- Automatically tracks created_at and updated_at

### `notification_settings` Table
- Stores user notification preferences
- One row per user (enforced by UNIQUE constraint)
- Stores email_enabled and timeframe preferences

### Security
- Row Level Security (RLS) is enabled
- Users can only access their own data
- All policies are automatically enforced

## Next Steps

After running the SQL script, the code will automatically start using the database instead of localStorage. The migration will happen automatically when users sign in.

