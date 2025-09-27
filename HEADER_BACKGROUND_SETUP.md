# Page Header Background Images Setup Guide

## Overview

The website now supports unique background images for each page header section instead of just the green background color. Each page can have its own distinctive background image while maintaining consistent styling and text readability.

## Implementation Details

### CSS Classes Added:
- `.about-header` - About Us page header
- `.leadership-header` - Leadership Team page header  
- `.events-header` - Events page header
- `.news-header` - News & Updates page header
- `.gallery-header` - Photo Gallery page header
- `.services-header` - Our Services page header
- `.contact-header` - Contact Us page header

### Required Background Images:

You need to add the following images to the `images/` folder:

1. **about-header-bg.jpg** - About Us page header
   - Suggested content: University buildings, campus overview, academic environment
   - Recommended size: 1920x800px

2. **leadership-header-bg.jpg** - Leadership Team page header  
   - Suggested content: Meeting rooms, student leadership, collaboration spaces
   - Recommended size: 1920x800px

3. **events-header-bg.jpg** - Events page header
   - Suggested content: Event venues, gatherings, cultural activities
   - Recommended size: 1920x800px

4. **news-header-bg.jpg** - News & Updates page header
   - Suggested content: Communication, announcements, bulletin boards
   - Recommended size: 1920x800px

5. **gallery-header-bg.jpg** - Photo Gallery page header
   - Suggested content: Photography, memories, student life moments
   - Recommended size: 1920x800px

6. **services-header-bg.jpg** - Our Services page header
   - Suggested content: Support services, help desk, student assistance
   - Recommended size: 1920x800px

7. **contact-header-bg.jpg** - Contact Us page header
   - Suggested content: Communication, office spaces, contact methods
   - Recommended size: 1920x800px

## Features Implemented:

### ✅ **Page-Specific Backgrounds**
- Each page now has its own unique background image
- Maintains consistent overlay and text readability
- Falls back to the default page-header-bg.jpg if specific images aren't available

### ✅ **Enhanced Visual Appeal**
- Green gradient overlay (70-80% opacity) maintains brand consistency
- Dark overlay ensures text remains readable over any background
- Parallax effect with `background-attachment: fixed` on desktop

### ✅ **Mobile Optimization**
- Uses `background-attachment: scroll` on mobile devices for better performance
- Responsive padding and font sizes
- Optimized for touch devices

### ✅ **Fallback System**
- If specific page images aren't available, falls back to default image
- If no images load, falls back to solid green background color
- Ensures the site always looks professional

## How to Add Your Images:

1. **Prepare Your Images:**
   - Use high-quality images (1920x800px recommended)
   - Optimize for web (under 400KB each)
   - Ensure images work well with text overlay

2. **Add to Images Folder:**
   ```
   images/
   ├── about-header-bg.jpg
   ├── leadership-header-bg.jpg  
   ├── events-header-bg.jpg
   ├── news-header-bg.jpg
   ├── gallery-header-bg.jpg
   ├── services-header-bg.jpg
   └── contact-header-bg.jpg
   ```

3. **Test Each Page:**
   - Visit each page to ensure images load properly
   - Check text readability over the background
   - Verify mobile responsiveness

## Current Status:

- ✅ CSS implementation complete
- ✅ HTML classes added to all pages
- ✅ Mobile responsiveness added
- ✅ Fallback system implemented
- ⏳ **You need to add the actual background images**

## Technical Details:

### CSS Structure:
```css
.page-header.about-header {
    background: linear-gradient(rgba(46, 125, 50, 0.7), rgba(27, 94, 32, 0.8)), 
                url('images/about-header-bg.jpg') center/cover no-repeat;
    background-attachment: fixed;
}
```

### HTML Structure:
```html
<section class="page-header about-header">
    <div class="container">
        <h1 class="page-title">About Us</h1>
        <p class="page-subtitle">Learn about our mission, vision, and journey</p>
    </div>
</section>
```

## Next Steps:

1. **Add your background images** to the images folder with the exact filenames listed above
2. **Test each page** to ensure images display correctly
3. **Optimize images** for web performance if needed
4. **Consider using WebP format** with JPG fallbacks for better compression

The background image system is now fully implemented and ready for your custom images!
