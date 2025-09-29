# Deployment Guide for Separate Hosting

## Quick Start

### 🌐 Deploy Public Website
1. **Upload** the entire `user_site/` directory to your web server
2. **Configure** your domain to point to this directory
3. **Access** at your main domain (e.g., `mamsa.org`)

### ⚙️ Deploy Admin Panel
1. **Upload** the entire `admin/` directory to your web server
2. **Configure** subdomain or path routing
3. **Access** at admin URL (e.g., `admin.mamsa.org` or `mamsa.org/admin`)

## Detailed Deployment Options

### Option 1: GitHub Pages (Free)

**For Public Website:**
```bash
# Create new repository: mamsa-public
git clone https://github.com/yourusername/mamsa-public.git
cd mamsa-public
# Copy contents of user_site/ to this repository
git add .
git commit -m "Initial public website deployment"
git push origin main
# Enable GitHub Pages in repository settings
```

**For Admin Panel:**
```bash
# Create new repository: mamsa-admin
git clone https://github.com/yourusername/mamsa-admin.git
cd mamsa-admin
# Copy contents of admin/ to this repository
git add .
git commit -m "Initial admin panel deployment"
git push origin main
# Enable GitHub Pages in repository settings
```

### Option 2: Netlify (Recommended)

**For Public Website:**
1. Go to [Netlify](https://netlify.com)
2. Drag and drop the `user_site/` folder
3. Configure custom domain
4. Set up automatic deployments from Git

**For Admin Panel:**
1. Create new Netlify site
2. Drag and drop the `admin/` folder
3. Configure subdomain (e.g., `admin.yoursite.netlify.app`)
4. Set up access controls and authentication

### Option 3: Vercel

**For Public Website:**
```bash
cd user_site
npx vercel
# Follow prompts to deploy
```

**For Admin Panel:**
```bash
cd admin
npx vercel
# Follow prompts to deploy
```

### Option 4: Traditional Web Hosting

**For Public Website:**
1. Upload `user_site/` contents to `public_html/`
2. Configure domain DNS
3. Set up SSL certificate

**For Admin Panel:**
1. Upload `admin/` contents to `admin/` subdirectory
2. Configure `.htaccess` for access control:
```apache
# .htaccess for admin directory
AuthType Basic
AuthName "Admin Access"
AuthUserFile /path/to/.htpasswd
Require valid-user
```
3. Create `.htpasswd` file with admin credentials

## Domain Configuration

### Separate Domains
```
mamsa.org          → Public website (user_site/)
admin.mamsa.org    → Admin panel (admin/)
```

### Same Domain, Different Paths
```
mamsa.org/         → Public website (user_site/)
mamsa.org/admin/   → Admin panel (admin/)
```

## Security Configuration

### Admin Panel Security
```apache
# .htaccess for admin panel
<Directory "admin">
    AuthType Basic
    AuthName "Admin Access"
    AuthUserFile /path/to/.htpasswd
    Require valid-user
    
    # Additional security headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
</Directory>
```

### SSL Configuration
```nginx
# Nginx SSL configuration
server {
    listen 443 ssl;
    server_name mamsa.org;
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    root /path/to/user_site;
    index index.html;
}

server {
    listen 443 ssl;
    server_name admin.mamsa.org;
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    root /path/to/admin;
    index login.html;
    
    # Admin access restrictions
    location / {
        auth_basic "Admin Area";
        auth_basic_user_file /path/to/.htpasswd;
    }
}
```

## Content Management

### Manual Content Updates
1. **Edit content** in `data/content.json` in both directories
2. **Update images** in `images/` directory in both directories
3. **Redeploy** both sites with updated content

### Automated Content Sync (Future)
When Supabase is implemented:
1. **Update content** through admin interface
2. **Changes automatically sync** to public website
3. **Real-time updates** across both sites

## Monitoring and Maintenance

### Health Checks
```bash
# Check public website
curl -I https://mamsa.org

# Check admin panel
curl -I https://admin.mamsa.org
```

### Backup Strategy
```bash
# Backup public website
tar -czf mamsa-public-$(date +%Y%m%d).tar.gz user_site/

# Backup admin panel
tar -czf mamsa-admin-$(date +%Y%m%d).tar.gz admin/
```

### Update Process
```bash
# Update public website
cd user_site
git pull origin main
# Redeploy

# Update admin panel
cd admin
git pull origin main
# Redeploy
```

## Troubleshooting

### Common Issues

**Images not loading:**
- Check image paths are relative to the directory
- Verify images are in the correct `images/` folder
- Check file permissions

**CSS not loading:**
- Verify CSS files are in the `css/` folder
- Check CSS paths in HTML files
- Clear browser cache

**JavaScript errors:**
- Check JavaScript files are in the `js/` folder
- Verify script paths in HTML files
- Check browser console for errors

**Admin login not working:**
- Verify admin credentials: `admin` / `admin123`
- Check if `login.html` is accessible
- Verify JavaScript is loading properly

### Performance Optimization

**Enable Compression:**
```apache
# .htaccess compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

**Set Cache Headers:**
```apache
# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Verify all file paths are correct
3. Check server error logs
4. Contact your hosting provider for server-specific issues

---

**Note**: This deployment guide assumes you're hosting both directories separately. Each directory contains all necessary assets for independent operation.
