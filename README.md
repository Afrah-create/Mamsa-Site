# Madi Makerere University Students Association (MAMSA)

## Project Structure for Separate Hosting

This repository contains the official website for the Madi Makerere University Students Association, organized for separate hosting of the public website and admin panel.

```
mamsa/
├── 📁 admin/                    # Admin panel (host separately)
│   ├── *.html                   # Admin interface pages
│   ├── css/                     # Admin stylesheets
│   ├── js/                      # Admin JavaScript files
│   ├── data/                    # Content data (duplicate for admin)
│   └── images/                  # All images (duplicate for admin)
├── 📁 user_site/               # Public website (host separately)
│   ├── *.html                   # Public website pages
│   ├── css/                     # Website stylesheets
│   ├── js/                      # Website JavaScript files
│   ├── data/                    # Content data
│   └── images/                  # All images
├── 📄 README.md                # This documentation
├── 📄 PROJECT_STRUCTURE.md     # Detailed structure guide
├── 📄 FIREBASE_REMOVAL_SUMMARY.md # Migration documentation
└── 📄 HEADER_*.md              # Setup guides
```

## Separate Hosting Setup

### 🌐 Public Website (`user_site/`)
**Host this directory as your main website**

- **Entry Point**: `index.html`
- **URL Structure**: Your main domain (e.g., `mamsa.org`)
- **Content**: All public-facing pages for students and visitors
- **Assets**: Complete set of images, CSS, and JavaScript

### ⚙️ Admin Panel (`admin/`)
**Host this directory as your admin interface**

- **Entry Point**: `login.html`
- **URL Structure**: Subdomain or path (e.g., `admin.mamsa.org` or `mamsa.org/admin`)
- **Content**: Administrative interface for content management
- **Assets**: Complete duplicate of assets for independent operation

## Features

### Public Website (`user_site/`)
- **Homepage**: Welcome page with latest news, events, and leadership preview
- **About Us**: Mission, vision, and association information
- **Leadership**: Team members and organizational structure
- **Events**: Upcoming and past events with calendar view
- **News**: Latest announcements and news articles
- **Gallery**: Photo gallery with filtering and lightbox
- **Services**: Student support services and resources
- **Contact**: Contact information and FAQ

### Admin Panel (`admin/`)
- **Dashboard**: Overview of content and statistics
- **Content Management**: Create, edit, and manage website content
- **Analytics**: View website statistics and performance
- **User Management**: Admin user accounts and permissions
- **Settings**: Website configuration and preferences

## Deployment Instructions

### Option 1: Separate Domains/Subdomains

**Public Website:**
```bash
# Deploy user_site/ to your main domain
# Example: mamsa.org
```

**Admin Panel:**
```bash
# Deploy admin/ to a subdomain
# Example: admin.mamsa.org
```

### Option 2: Same Domain, Different Paths

**Public Website:**
```bash
# Deploy user_site/ to root path
# Example: mamsa.org/
```

**Admin Panel:**
```bash
# Deploy admin/ to admin path
# Example: mamsa.org/admin/
```

### Hosting Services

**GitHub Pages:**
- Create separate repositories for each directory
- Or use GitHub Pages with custom paths

**Netlify:**
- Deploy each directory as separate sites
- Configure custom domains for each

**Vercel:**
- Deploy each directory as separate projects
- Link to same GitHub repository with different paths

**Traditional Hosting:**
- Upload `user_site/` to public_html
- Upload `admin/` to admin subdirectory
- Configure proper access controls for admin

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)
- **Content**: JSON-based content management
- **Backend**: Ready for Supabase integration (Firebase removed)

## Admin Access

- **URL**: `/login.html` (within admin directory)
- **Default Credentials**: 
  - Username: `admin`
  - Password: `admin123`

## Content Management

### Current System
- **Static Content**: Edit files directly in each directory
- **Dynamic Content**: Modify `data/content.json` in both directories
- **Images**: Add to appropriate folders in `images/` directory
- **Synchronization**: Manually sync changes between directories

### Future (Supabase Integration)
- **Centralized Content**: Single source of truth
- **Real-time Sync**: Automatic updates across both sites
- **Admin Interface**: Full content management capabilities

## Local Development

### Public Website
```bash
cd user_site
# Serve locally or open index.html in browser
python -m http.server 8000
# Access at: http://localhost:8000
```

### Admin Panel
```bash
cd admin
# Serve locally or open login.html in browser
python -m http.server 8001
# Access at: http://localhost:8001
```

## Migration Status

### ✅ Completed
- Firebase integration removed
- Project restructured for separate hosting
- All file paths updated for independent operation
- Duplicate assets created for each directory
- Admin interface structure in place

### 🔄 Next Steps (Supabase Integration)
- [ ] Set up Supabase project
- [ ] Implement centralized authentication
- [ ] Create shared content management API
- [ ] Add file storage capabilities
- [ ] Implement real-time synchronization
- [ ] Restore full admin functionality

## Benefits of Separate Hosting

### 🔒 Security
- Admin panel can be hosted with additional security measures
- Separate access controls and authentication
- Isolated admin functionality from public site

### 🚀 Performance
- Each site can be optimized independently
- Different caching strategies
- Separate CDN configurations

### 🛠️ Maintenance
- Independent updates and deployments
- Separate monitoring and logging
- Different backup strategies

### 👥 Team Workflow
- Different teams can work on each site
- Independent development cycles
- Separate testing and staging environments

## Contributing

1. Fork the repository
2. Make changes to the appropriate directory (`user_site/` or `admin/`)
3. Test thoroughly in both environments
4. Submit a pull request

## Support

For technical support or questions:
- Check the documentation files in the root directory
- Review the Firebase removal summary for migration details
- Contact the development team for advanced issues

## License

This project is for the Madi Makerere University Students Association. All rights reserved.

---

**Note**: This project has been restructured for separate hosting and is ready for Supabase integration. Each directory contains all necessary assets for independent operation.