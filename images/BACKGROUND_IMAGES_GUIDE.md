# Background Images Setup Guide

## Hero Section Background Images

The website now uses background images for hero sections instead of solid green colors. Here's how to set them up:

### Required Images:

1. **Hero Background** (`images/hero-bg.jpg`)
   - Used for the main homepage hero section
   - Recommended size: 1920x1080px or higher
   - Should represent: University campus, students studying, academic environment
   - Format: JPG or PNG
   - File size: Under 500KB for web optimization

2. **Page Header Background** (`images/page-header-bg.jpg`)
   - Used for all other page headers (About, Leadership, Events, etc.)
   - Recommended size: 1920x800px or higher
   - Should represent: University library, academic buildings, study areas
   - Format: JPG or PNG
   - File size: Under 400KB for web optimization

### How to Add Images:

1. **Replace Placeholder Files:**
   - Replace `images/hero-bg.jpg` with your actual hero background image
   - Replace `images/page-header-bg.jpg` with your actual page header background image

2. **Image Optimization:**
   - Use tools like TinyPNG or ImageOptim to compress images
   - Ensure images are web-optimized for fast loading
   - Consider using WebP format for better compression (with fallbacks)

3. **Fallback Colors:**
   - If images fail to load, the sections will fall back to the green color scheme
   - The CSS includes fallback background colors for reliability

### Design Considerations:

- **Overlay Effect:** Images have a green overlay (70% opacity for hero, 80% for page headers)
- **Dark Overlay:** Additional dark overlay (20-30% opacity) ensures text readability
- **Responsive:** Images scale properly on all device sizes
- **Performance:** Optimized for fast loading without compromising quality

### Current Implementation:

- Hero sections use `background: linear-gradient(rgba(46, 125, 50, 0.7), rgba(27, 94, 32, 0.7)), url('images/hero-bg.jpg')`
- Page headers use `background: linear-gradient(rgba(46, 125, 50, 0.8), rgba(27, 94, 32, 0.8)), url('images/page-header-bg.jpg')`
- Fallback colors ensure the design works even without images

### Testing:

1. Add your images to the `images/` folder
2. Refresh the website to see the new backgrounds
3. Test on different screen sizes to ensure proper scaling
4. Verify text readability over the background images
