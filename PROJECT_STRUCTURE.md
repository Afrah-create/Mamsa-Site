# Project Structure for Separate Hosting

## Overview

The MAMSA project is now organized for **separate hosting** of the public website and admin panel. Each directory contains all necessary assets for independent operation.

## Directory Organization

### 📁 `/admin/` - Standalone Admin Panel
**Can be hosted independently** (e.g., `admin.mamsa.org`)

```
admin/
├── *.html                    # Admin interface pages
├── css/                      # Complete stylesheets
│   ├── admin.css            # Admin-specific styles
│   ├── responsive.css       # Responsive design
│   └── style.css            # Main website styles
├── js/                       # Complete JavaScript
│   ├── admin-content-manager.js # Admin functionality
│   └── main.js              # Main website functionality
├── data/                     # Content data
│   └── content.json         # Website content
└── images/                   # Complete image collection
    ├── events/              # Event photos
    ├── gallery/             # Gallery images
    ├── header-sections/     # Header backgrounds
    ├── index/               # Homepage images
    ├── leadership/          # Leadership photos
    ├── news/                # News images
    ├── services/            # Service images
    └── *.png, *.jpg         # Logos and assets
```

### 📁 `/user_site/` - Standalone Public Website
**Can be hosted independently** (e.g., `mamsa.org`)

```
user_site/
├── *.html                   # Public website pages
├── css/                     # Complete stylesheets
│   ├── admin.css           # Admin-specific styles
│   ├── responsive.css      # Responsive design
│   └── style.css           # Main website styles
├── js/                      # Complete JavaScript
│   ├── admin-content-manager.js # Admin functionality
│   └── main.js             # Main website functionality
├── data/                    # Content data
│   └── content.json        # Website content
└── images/                  # Complete image collection
    ├── events/             # Event photos
    ├── gallery/            # Gallery images
    ├── header-sections/    # Header backgrounds
    ├── index/              # Homepage images
    ├── leadership/         # Leadership photos
    ├── news/               # News images
    ├── services/           # Service images
    └── *.png, *.jpg        # Logos and assets
```

## File Path Relationships

### Within Each Directory (Local Paths)
```html
<!-- Images -->
<img src="images/logo.png" alt="Logo">

<!-- CSS -->
<link rel="stylesheet" href="css/style.css">

<!-- JavaScript -->
<script src="js/main.js"></script>

<!-- Data -->
<script>
  fetch('data/content.json')
</script>
```

### No Cross-Directory Dependencies
- ✅ Each directory is completely self-contained
- ✅ No relative paths between directories
- ✅ All assets duplicated for independence

## Hosting Configurations

### Configuration 1: Separate Domains
```
Public Website:  https://mamsa.org
Admin Panel:     https://admin.mamsa.org
```

### Configuration 2: Same Domain, Different Paths
```
Public Website:  https://mamsa.org/
Admin Panel:     https://mamsa.org/admin/
```

### Configuration 3: Different Servers
```
Public Website:  https://mamsa.org (Server A)
Admin Panel:     https://admin.mamsa.org (Server B)
```

## Benefits of Separate Hosting

### 🔒 Security Advantages
- **Isolated Admin Access**: Admin panel can have additional security layers
- **Separate Authentication**: Different login systems and access controls
- **Reduced Attack Surface**: Public site and admin have no shared vulnerabilities
- **IP Restrictions**: Admin can be restricted to specific IP addresses

### 🚀 Performance Benefits
- **Independent Optimization**: Each site can be optimized separately
- **Different CDN Strategies**: Public site for global reach, admin for security
- **Separate Caching**: Different caching policies for public vs admin content
- **Load Distribution**: Admin traffic doesn't affect public site performance

### 🛠️ Operational Advantages
- **Independent Deployments**: Update public site without affecting admin
- **Separate Monitoring**: Different analytics and monitoring for each site
- **Different Backup Strategies**: Public site for content, admin for security
- **Scalability**: Scale each site independently based on usage

### 👥 Team Workflow Benefits
- **Parallel Development**: Teams can work on both sites simultaneously
- **Independent Testing**: Test public features without affecting admin
- **Separate Staging**: Different staging environments for each site
- **Role-based Access**: Developers can access only the site they're working on

## Deployment Strategies

### Static Hosting Services

**GitHub Pages:**
```bash
# Create two repositories
mamsa-public    # Contains user_site/
mamsa-admin     # Contains admin/
```

**Netlify:**
```bash
# Deploy as separate sites
Site 1: Connect to user_site/ directory
Site 2: Connect to admin/ directory
```

**Vercel:**
```bash
# Deploy as separate projects
Project 1: user_site/ directory
Project 2: admin/ directory
```

### Traditional Hosting

**Shared Hosting:**
```bash
# Upload user_site/ to public_html
# Upload admin/ to admin subdirectory
# Configure .htaccess for admin access control
```

**VPS/Dedicated Server:**
```bash
# Separate virtual hosts
Server A: Serve user_site/ on main domain
Server B: Serve admin/ on admin subdomain
```

## Content Synchronization

### Current Manual Process
1. Update content in one directory
2. Manually copy changes to the other directory
3. Deploy both sites independently

### Future Automated Process (Supabase)
1. Update content through admin interface
2. Changes automatically sync to public site
3. Real-time updates across both sites

## Security Considerations

### Admin Panel Security
- **HTTPS Required**: Always use SSL certificates
- **Access Restrictions**: Limit admin access by IP or VPN
- **Strong Authentication**: Implement multi-factor authentication
- **Regular Updates**: Keep admin panel updated with security patches

### Public Website Security
- **Content Validation**: Sanitize all user inputs
- **Image Security**: Validate uploaded images
- **Rate Limiting**: Prevent abuse of public endpoints
- **Monitoring**: Monitor for suspicious activity

## Maintenance Workflow

### Regular Tasks
1. **Content Updates**: Update both directories with new content
2. **Security Updates**: Apply security patches to both sites
3. **Backup Verification**: Ensure both sites are properly backed up
4. **Performance Monitoring**: Monitor both sites for performance issues

### Emergency Procedures
1. **Public Site Issues**: Can fix without affecting admin access
2. **Admin Issues**: Can fix without affecting public site
3. **Content Recovery**: Restore from backups independently
4. **Rollback**: Rollback one site without affecting the other

## Future Enhancements

### Supabase Integration
- **Centralized Content**: Single source of truth for content
- **Real-time Sync**: Automatic synchronization between sites
- **Unified Authentication**: Single sign-on across both sites
- **Shared Analytics**: Combined analytics and reporting

### API Layer
- **Content API**: RESTful API for content management
- **Image API**: Centralized image management and processing
- **User API**: Unified user management across both sites
- **Analytics API**: Shared analytics and reporting

This structure provides maximum flexibility for hosting while maintaining the ability to integrate them in the future when Supabase is implemented.