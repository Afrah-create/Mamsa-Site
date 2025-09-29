# Vercel Deployment Guide for MAMSA with Supabase Authentication

## 🚀 Pre-Deployment Checklist

### 1. **Complete Supabase Setup**

#### ✅ Authentication Configuration
1. **Go to Supabase Dashboard → Authentication → Settings**
   - Set **Site URL**: `https://your-app.vercel.app` (replace with your Vercel domain)
   - Add **Additional Redirect URLs**:
     ```
     https://your-app.vercel.app/admin/login.html
     https://your-app.vercel.app/admin/login.html?reset=success
     https://your-app.vercel.app/admin/login.html?invite=true
     ```

2. **Email Configuration** (Required for password reset)
   - Go to **Authentication → Settings**
   - Configure **SMTP Provider** OR use Supabase's built-in email
   - Test email templates for:
     - Email confirmation
     - Password reset
     - Admin invitations

3. **Security Settings**
   - Set password requirements (recommended: 8+ characters)
   - Configure rate limits for login attempts
   - Set session duration

### 2. **Create Environment Variables**

#### Create `.env` file in your project root:
```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Update `admin/js/supabase-config.js`:
```javascript
// Supabase Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lvcwbyqzjmpyopmbzqvc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 3. **Create Your Initial Admin User**

#### Method 1: Using SQL Editor
1. Go to Supabase → SQL Editor
2. Run this query (replace email with your actual email):
```sql
INSERT INTO admin_users (user_id, role, permissions)
SELECT 
    u.id,
    'admin',
    '["news", "events", "gallery", "leadership", "contact", "settings", "admin_users"]'::jsonb
FROM auth.users u
WHERE u.email = 'your-email@example.com';
```

#### Method 2: Through Admin Interface (After deployment)
1. Create user in Supabase → Authentication → Users
2. Access your deployed admin panel
3. Use "Add Existing User" feature

### 4. **Vercel Configuration**

#### Create `vercel.json` in project root:
```json
{
  "builds": [
    {
      "src": "admin/**/*.html",
      "use": "@vercel/static"
    },
    {
      "src": "/",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/admin",
      "dest": "/admin/index.html"
    },
    {
      "src": "/admin/login",
      "dest": "/admin/login.html"
    },
    {
      "src": "/(.*)",
      "dest": "/user_site/$1"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

### 5. **Security Updates for Production**

#### Update `admin/js/supabase-config.js` for production:
```javascript
// Check if we're in production
const isProduction = window.location.hostname !== 'localhost';

const SUPABASE_URL = isProduction 
  ? import.meta.env.VITE_SUPABASE_URL
  : 'your-local-dev-url';

const SUPABASE_ANON_KEY = isProduction 
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : 'your-local-dev-key';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration');
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 6. **Fix Path Issues**

#### Update admin HTML files to use relative paths:
- Check all image paths: should be `images/filename.ext`
- Check CSS imports: should be `css/filename.css`
- Check JS imports: should be `js/filename.js`

### 7. **Database Final Setup**

#### Run these SQL commands in Supabase:
```sql
-- Update RLS policies for production
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin_users management" ON admin_users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND 'admin_users' = ANY(au.permissions)
    )
    OR
    NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Enable storage policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true), ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
```

## 📦 Deployment Steps

### 1. **Prepare Repository**
```bash
# Initialize git if needed
git init
git add .
git commit -m "Initial commit with Supabase auth"
git branch -M main
git remote add origin https://github.com/yourusername/mamsa.git
git push -u origin main
```

### 2. **Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonet key
4. Deploy!

### 3. **Update Supabase Configuration**
After deployment, update Supabase:
1. **Site URL**: `https://your-app.vercel.app`
2. **Redirect URLs**: Add your Vercel domain
3. **CORS**: Allow your Vercel domain

## 🔧 Post-Deployment Testing

### 1. **Test Authentication Flow**
- [ ] Visit admin panel: `https://your-app.vercel.app/admin`
- [ ] Should redirect to login
- [ ] Test login with admin credentials
- [ ] Test password reset functionality
- [ ] Test admin user management

### 2. **Test Admin Features**
- [ ] Can access all admin pages
- [ ] Can add/edit content
- [ ] Can manage users
- [ ] Can upload files

### 3. **Test Security**
- [ ] Non-admin users get proper error messages
- [ ] Invalid sessions redirect to login
- [ ] API calls require authentication

## 🚨 Common Deployment Issues

### Issue 1: "Authentication failed"
**Solution**: Check environment variables in Vercel dashboard

### Issue 2: "Site URL mismatch"
**Solution**: Update Supabase Site URL to your Vercel domain

### Issue 3: "CORS error"
**Solution**: Add your Vercel domain to Supabase CORS settings

### Issue 4: "File uploads not working"
**Solution**: Check storage bucket policies and CORS settings

## 📝 Final Checklist

### Before Deploying:
- [ ] Environment variables configured
- [ ] Supabase URLs updated for production
- [ ] At least one admin user created
- [ ] Email configuration tested
- [ ] File paths checked

### After Deploying:
- [ ] Authentication works
- [ ] Admin panel accessible
- [ ] Content management functional
- [ ] User management working
- [ ] File uploads working

## 🎯 Your Next Steps

1. **Update environment variables** in your project
2. **Create your admin user** in Supabase
3. **Deploy to Vercel** with the provided configuration
4. **Update Supabase settings** with your Vercel domain
5. **Test everything** thoroughly

Your authentication system is ready for production deployment! 🚀
