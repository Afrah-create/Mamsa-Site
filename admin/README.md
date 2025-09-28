# MAMSA Admin Panel

A comprehensive admin panel for managing the Madi Makerere University Students Association website content using Supabase as the backend.

## Features

- **Authentication**: Secure login system using Supabase Auth
- **Dashboard**: Overview of content statistics and recent activity
- **Content Management**: 
  - News articles management
  - Events management
  - Leadership team management
  - Gallery management
  - About page content
  - Services information
  - Contact information
  - Site settings
- **File Upload**: Image upload using Supabase Storage
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live data synchronization

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to your project dashboard
3. Navigate to SQL Editor
4. Run the SQL schema from `supabase-schema.sql`
5. Go to Settings > API to get your project URL and anon key

### 2. Configuration

1. Open `js/supabase-config.js`
2. Replace the placeholder values with your actual Supabase credentials:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. Authentication Setup

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:8000` for local development)
3. Add redirect URLs for your admin panel
4. Create your first admin user:
   - Go to Authentication > Users
   - Click "Add user"
   - Enter email and password
   - The user will be able to access the admin panel

### 4. Storage Setup

The schema automatically creates storage buckets for images and documents. You can configure additional storage policies in your Supabase dashboard if needed.

## File Structure

```
admin/
├── index.html              # Main admin dashboard
├── login.html              # Login page
├── css/
│   ├── admin.css          # Admin-specific styles
│   ├── style.css          # Base styles
│   └── responsive.css     # Responsive design
├── js/
│   ├── supabase-config.js # Supabase configuration
│   ├── admin-content-manager.js # Main admin functionality
│   ├── login.js           # Login functionality
│   └── main.js            # Shared utilities
├── images/                # Admin panel images
├── supabase-schema.sql    # Database schema
└── README.md             # This file
```

## Usage

### Accessing the Admin Panel

1. Navigate to `login.html` in your browser
2. Enter your admin credentials
3. You'll be redirected to the main dashboard

### Managing Content

#### News Management
- View all news articles
- Add new articles
- Edit existing articles
- Delete articles
- Filter by category and search

#### Events Management
- Manage upcoming and past events
- Add event details including location, time, and contact information
- Set event status and registration requirements

#### Leadership Management
- Add and manage leadership team members
- Update member information, photos, and social media links
- Organize by departments

#### Gallery Management
- Upload and manage images
- Organize by categories
- Set featured images
- Add descriptions and tags

### File Uploads

The admin panel supports image uploads through Supabase Storage:
- Images are stored in the `images` bucket
- Public access is enabled for images
- Automatic URL generation for easy use in content

## Development

### Local Development

1. Serve the admin directory using a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve admin
   
   # Using PHP
   php -S localhost:8000
   ```

2. Access the admin panel at `http://localhost:8000`

### Customization

#### Adding New Content Types

1. Add the table schema to `supabase-schema.sql`
2. Update `supabase-config.js` with the new table name
3. Add the management interface in `admin-content-manager.js`
4. Update the navigation in `index.html`

#### Styling

- Modify `css/admin.css` for admin-specific styles
- Update `css/style.css` for base styles
- Adjust `css/responsive.css` for mobile responsiveness

## Security

- Row Level Security (RLS) is enabled on all tables
- Authentication is required for all admin operations
- File uploads are restricted to authenticated users
- Admin users can only access their own records

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check your Supabase URL and anon key
   - Verify your site URL in Supabase settings
   - Ensure RLS policies are correctly set

2. **File uploads failing**
   - Check storage bucket policies
   - Verify file size limits
   - Ensure proper file types are allowed

3. **Data not loading**
   - Check browser console for errors
   - Verify table names in configuration
   - Ensure RLS policies allow data access

### Support

For issues and questions:
1. Check the browser console for error messages
2. Verify Supabase dashboard for data and logs
3. Review the schema and policies
4. Test with a fresh Supabase project if needed

## Future Enhancements

- [ ] Advanced content editor with rich text formatting
- [ ] Bulk operations for content management
- [ ] Analytics and reporting dashboard
- [ ] User role management
- [ ] Content approval workflow
- [ ] Backup and restore functionality
- [ ] Multi-language support
- [ ] API endpoints for external integrations

## License

This project is part of the MAMSA website and follows the same licensing terms.
