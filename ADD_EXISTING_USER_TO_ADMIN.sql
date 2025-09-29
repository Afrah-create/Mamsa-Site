-- SQL Script to Add Existing Supabase Auth Users to admin_users Table
-- Run this in your Supabase SQL Editor

-- Method 1: Add a specific user by email
-- Replace 'user@example.com' with the actual email from Authentication > Users
INSERT INTO admin_users (user_id, role, permissions)
SELECT 
    u.id as user_id,
    'admin' as role,
    '["news", "events", "gallery", "leadership", "contact", "settings"]'::jsonb as permissions
FROM auth.users u
WHERE u.email = 'user@example.com'
AND u.email_confirmed_at IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM admin_users au WHERE au.user_id = u.id
);

-- Method 2: Add all confirmed users who are not already admins
INSERT INTO admin_users (user_id, role, permissions)
SELECT 
    u.id as user_id,
    'editor' as role,
    '["news", "events", "gallery"]'::jsonb as permissions
FROM auth.users u
WHERE u.email_confirmed_at IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM admin_users au WHERE au.user_id = u.id
);

-- Method 3: Check what users are available
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    CASE 
        WHEN au.user_id IS NOT NULL THEN 'Already Admin'
        WHEN u.email_confirmed_at IS NULL THEN 'Unconfirmed Email'
        ELSE 'Available for Admin Assignment'
    END as admin_status
FROM auth.users u
LEFT JOIN admin_users au ON u.id = au.user_id
ORDER BY u.created_at DESC;

-- Method 4: Remove admin access (if needed)
-- DELETE FROM admin_users WHERE user_id = '[USER_ID]';

-- Available Roles:
-- 'admin' - Full access including admin management
-- 'editor' - Content management access
-- 'moderator' - Limited content access

-- Available Permissions (can be combined):
-- '["news"]' - News management only
-- '["events"]' - Events management only
-- '["gallery"]' - Gallery management only
-- '["leadership"]' - Leadership management only
-- '["contact"]' - Contact information management
-- '["settings"]' - Site settings management
-- '["admin_users"]' - Admin user management (admin role only)
