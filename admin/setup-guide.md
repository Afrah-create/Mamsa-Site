# MAMSA Admin Panel Setup Guide

This guide will walk you through setting up the MAMSA admin panel with Supabase backend.

## Prerequisites

- A Supabase account (free tier available)
- Basic knowledge of web development
- A web server or hosting service

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `mamsa-admin`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire content from `supabase-schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the schema
6. You should see "Success. No rows returned" message

## Step 3: Configure Authentication

1. Go to **Authentication > Settings**
2. Configure the following:
   - **Site URL**: `http://localhost:8000` (for local development)
   - **Redirect URLs**: Add your admin panel URLs
3. Go to **Authentication > Users**
4. Click "Add user" to create your first admin user:
   - Email: `admin@madimakerere.org`
   - Password: (choose a strong password)
   - Auto Confirm User: ✅ (checked)

## Step 4: Get API Credentials

1. Go to **Settings > API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## Step 5: Configure Admin Panel

1. Open `admin/js/supabase-config.js`
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

## Step 6: Set Up File Storage

The schema automatically creates storage buckets. To verify:

1. Go to **Storage** in your Supabase dashboard
2. You should see two buckets:
   - `images` (public)
   - `documents` (private)

## Step 7: Test the Setup

### Local Testing

1. Serve the admin directory using a local server:

```bash
# Using Python
cd admin
python -m http.server 8000

# Using Node.js
cd admin
npx serve -p 8000

# Using PHP
cd admin
php -S localhost:8000
```

2. Open `http://localhost:8000/login.html`
3. Log in with your admin credentials
4. You should see the dashboard

### Production Deployment

1. Upload the `admin` directory to your web server
2. Update the Site URL in Supabase to your production domain
3. Update the redirect URLs
4. Test the login functionality

## Step 8: Initial Content Setup

### Add Sample Data

You can add sample content through the admin panel:

1. **News**: Add a welcome article
2. **Events**: Add upcoming events
3. **Leadership**: Add team members
4. **Gallery**: Upload some images
5. **About**: Update mission, vision, etc.
6. **Contact**: Add contact information

### Import Existing Data

If you have existing content in JSON format:

1. Go to the respective management page
2. Use the "Add" buttons to create new items
3. Fill in the forms with your existing data

## Step 9: Security Configuration

### Row Level Security (RLS)

The schema includes RLS policies. To verify:

1. Go to **Authentication > Policies**
2. You should see policies for all tables
3. Policies allow authenticated users to manage content

### Additional Security (Optional)

1. **IP Restrictions**: Add your office IP addresses
2. **Email Domain Restrictions**: Restrict to your organization's domain
3. **Two-Factor Authentication**: Enable for admin users

## Step 10: Backup and Maintenance

### Database Backups

1. Go to **Settings > Database**
2. Enable automatic backups
3. Set backup frequency (daily recommended)

### Monitoring

1. **Dashboard**: Monitor usage and performance
2. **Logs**: Check for errors in the Logs section
3. **API Usage**: Monitor API calls and limits

## Troubleshooting

### Common Issues

1. **"Invalid login credentials"**
   - Check email/password
   - Verify user exists in Supabase
   - Check if user is confirmed

2. **"Failed to load data"**
   - Check browser console for errors
   - Verify Supabase URL and key
   - Check RLS policies

3. **"File upload failed"**
   - Check storage bucket policies
   - Verify file size limits
   - Check file type restrictions

4. **"Permission denied"**
   - Check RLS policies
   - Verify user authentication
   - Check table permissions

### Debug Mode

Enable debug mode by adding this to your browser console:

```javascript
localStorage.setItem('debug', 'true');
```

### Getting Help

1. Check the browser console for error messages
2. Review Supabase logs in the dashboard
3. Test with a fresh Supabase project
4. Check the GitHub issues for common problems

## Next Steps

1. **Customize**: Modify the admin panel to match your needs
2. **Integrate**: Connect with your main website
3. **Automate**: Set up automated backups and monitoring
4. **Scale**: Add more admin users and permissions
5. **Enhance**: Add new features and content types

## Support

For technical support:
- Check the [Supabase Documentation](https://supabase.com/docs)
- Review the admin panel code comments
- Test with sample data first
- Use browser developer tools for debugging

## Security Checklist

- [ ] Strong database password
- [ ] Admin user with strong password
- [ ] RLS policies enabled
- [ ] Storage bucket policies configured
- [ ] Site URL and redirect URLs set
- [ ] Regular backups enabled
- [ ] Monitor API usage
- [ ] Test login functionality
- [ ] Verify file uploads work
- [ ] Check content management features

## Performance Tips

1. **Images**: Optimize images before upload
2. **Database**: Use indexes for frequently queried fields
3. **Caching**: Enable CDN for static assets
4. **Monitoring**: Set up performance monitoring
5. **Updates**: Keep Supabase client library updated

Your MAMSA admin panel is now ready to use! 🎉
