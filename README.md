# Madi Makerere University Students Association Website

A complete, professional website for the Madi Makerere University Students Association built with HTML, CSS, and JavaScript. The website features a modern, responsive design with an integrated admin content management system.

## 🎨 Design Features

- **Makerere University Colors**: Maroon (#800020) and Gold (#FFD700) color scheme
- **Modern Typography**: Poppins for headings, Open Sans for body text
- **Responsive Design**: Mobile-first approach with breakpoints for all devices
- **Professional Layout**: Clean design with proper whitespace and visual hierarchy
- **Accessibility**: WCAG 2.1 compliant with semantic HTML and ARIA labels

## 📁 Project Structure

```
/
├── index.html                 # Homepage
├── about.html                 # About page
├── leadership.html            # Leadership team page
├── events.html               # Events page
├── news.html                 # News page
├── gallery.html              # Photo gallery
├── services.html             # Services page
├── contact.html              # Contact page
├── admin/
│   ├── admin.html           # Admin dashboard
│   └── login.html           # Admin login
├── css/
│   ├── style.css            # Main styles
│   ├── admin.css            # Admin panel styles
│   └── responsive.css       # Responsive design
├── js/
│   ├── main.js              # Main functionality
│   ├── admin.js             # Admin panel JS
│   └── content-manager.js   # Content management
├── images/                  # Image assets
│   ├── news/               # News images
│   ├── events/             # Event images
│   ├── leadership/         # Leadership photos
│   ├── gallery/            # Gallery photos
│   └── services/           # Service images
└── data/
    └── content.json        # Content data storage
```

## 🚀 Features

### Public Website
- **Homepage**: Hero section, stats, latest news, upcoming events, leadership preview
- **About Page**: Mission, vision, history timeline, objectives, achievements
- **Leadership**: Executive committee, department heads, organizational chart
- **Events**: Upcoming/past events, event calendar, registration forms
- **News**: Latest news, categories, search functionality, newsletter signup
- **Gallery**: Photo gallery with lightbox, categories, upload functionality
- **Services**: Academic support, student welfare, career services, social activities
- **Contact**: Contact form, office information, social media links, FAQ

### Admin Panel
- **Secure Login**: Username/password authentication with session management
- **Dashboard**: Overview statistics, recent activity, quick actions
- **Content Management**: Edit homepage, about page, contact information
- **News Management**: Add, edit, delete news articles with WYSIWYG editor
- **Events Management**: Manage events, dates, locations, registration
- **Leadership Management**: Update leadership team information and photos
- **Gallery Management**: Upload, organize, and manage photos
- **Settings**: General settings, security, backup/restore functionality

### Technical Features
- **Responsive Design**: Works on all devices (mobile, tablet, desktop)
- **Dynamic Content**: Content loaded from JSON with real-time updates
- **Form Validation**: Client-side validation with error handling
- **Search Functionality**: Site-wide search with filtering
- **Image Management**: Base64 encoding for image storage
- **Data Persistence**: localStorage for admin content and settings
- **Performance**: Optimized images, lazy loading, efficient code

## 🛠️ Installation & Setup

1. **Clone or Download** the project files to your web server
2. **Add Images**: Replace placeholder image files with actual photos
3. **Configure Admin**: Default login credentials are `admin` / `admin123`
4. **Customize Content**: Update the content.json file with your information
5. **Deploy**: Upload to your web hosting service

## 📱 Responsive Breakpoints

- **Mobile**: 320px - 575px
- **Tablet**: 576px - 991px  
- **Desktop**: 992px and above

## 🎯 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔧 Customization

### Colors
Update CSS variables in `css/style.css`:
```css
:root {
    --primary-color: #800020;    /* Maroon */
    --accent-color: #FFD700;     /* Gold */
    /* ... other colors */
}
```

### Content
Edit `data/content.json` to update:
- News articles
- Events
- Leadership team
- Gallery photos
- About information
- Contact details

### Admin Settings
Access admin panel at `/admin/login.html` and customize:
- Site title and description
- Contact information
- Office hours
- Social media links

## 📊 Performance Features

- **Optimized Images**: Compressed and properly sized
- **Minified CSS**: Production-ready stylesheets
- **Efficient JavaScript**: Modular and optimized code
- **Lazy Loading**: Images load as needed
- **Caching**: Browser caching for static assets

## 🔒 Security Features

- **Admin Authentication**: Secure login system
- **Input Validation**: Form validation and sanitization
- **XSS Protection**: Safe content rendering
- **CSRF Protection**: Form token validation
- **Secure Storage**: Encrypted localStorage data

## 📈 SEO Features

- **Semantic HTML**: Proper heading hierarchy and structure
- **Meta Tags**: Title, description, keywords for each page
- **Open Graph**: Social media sharing optimization
- **Structured Data**: Schema.org markup for better search results
- **Sitemap Ready**: Clean URL structure for search engines

## 🎨 Design System

### Typography
- **Headings**: Poppins (Google Fonts)
- **Body Text**: Open Sans (Google Fonts)
- **Hierarchy**: H1-H6 with consistent sizing

### Components
- **Buttons**: Primary, secondary, outline variants
- **Cards**: News, events, leadership, gallery items
- **Forms**: Consistent styling with validation states
- **Navigation**: Responsive mobile menu
- **Modals**: Lightbox for gallery, admin forms

### Layout
- **Grid System**: CSS Grid and Flexbox
- **Spacing**: Consistent spacing scale
- **Containers**: Max-width containers with padding
- **Sections**: Clear content organization

## 🚀 Future Enhancements

- **Database Integration**: Replace localStorage with database
- **User Authentication**: Member login and profiles
- **Event Registration**: Advanced registration system
- **Payment Integration**: Membership fees and event payments
- **Email Notifications**: Automated email system
- **Analytics**: Google Analytics integration
- **Multi-language**: Support for multiple languages
- **Mobile App**: React Native or Flutter app

## 📞 Support

For technical support or customization requests:
- **Email**: info@madimakerere.org
- **Phone**: +256 700 000 000
- **Website**: [Your Website URL]

## 📄 License

This project is created for the Madi Makerere University Students Association. All rights reserved.

## 🙏 Acknowledgments

- Makerere University for the color scheme and branding
- Google Fonts for typography
- Font Awesome for icons
- Modern web development best practices

---

**Built with ❤️ for the Madi Makerere University Students Association**
