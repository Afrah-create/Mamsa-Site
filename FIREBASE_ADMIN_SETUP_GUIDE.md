# Firebase Admin System Setup Guide

## Overview
This guide will help you set up and use the Firebase-powered admin system for the Madi Makerere Students Association website.

## Prerequisites
- Firebase project created and configured
- Admin credentials set up
- Website files deployed

## Firebase Project Setup

### 1. Firebase Console Configuration

#### Authentication Setup
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Email/Password authentication
3. Add admin users:
   - Go to Authentication → Users
   - Click "Add user"
   - Enter admin email and password
   - Note: First admin user should be created manually

#### Firestore Database Setup
1. Go to Firebase Console → Firestore Database
2. Create database in production mode
3. Set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor'];
    }
    
    // Content collections
    match /{collection}/{document} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor'];
    }
  }
}
```

#### Storage Setup
1. Go to Firebase Console → Storage
2. Create storage bucket
3. Set up security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor'];
    }
  }
}
```

### 2. Initial Data Setup

#### Create Initial Collections
Run these commands in Firebase Console → Firestore Database:

1. **Users Collection** (`users`):
```json
{
  "uid": "admin-user-id",
  "name": "Administrator",
  "email": "admin@mamsa.com",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

2. **News Collection** (`news`):
```json
{
  "title": "Welcome to MAMSA",
  "excerpt": "Welcome to the Madi Makerere Students Association website...",
  "content": "Full news article content here...",
  "category": "general",
  "published": true,
  "image": "images/news/welcome.jpg",
  "views": 0,
  "likes": 0,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

3. **Events Collection** (`events`):
```json
{
  "title": "Welcome Event",
  "description": "Join us for our welcome event...",
  "eventDate": "2024-02-01",
  "eventTime": "10:00",
  "location": "Makerere University",
  "category": "social",
  "image": "images/events/welcome.jpg",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

4. **Leadership Collection** (`leadership`):
```json
{
  "name": "John Doe",
  "position": "President",
  "bio": "Student leader with passion for community...",
  "email": "president@mamsa.com",
  "phone": "+256700000000",
  "photo": "images/leadership/president.jpg",
  "order": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

5. **Gallery Collection** (`gallery`):
```json
{
  "url": "images/gallery/event1.jpg",
  "caption": "Student Event 2024",
  "category": "events",
  "uploadedAt": "2024-01-01T00:00:00Z"
}
```

## Admin System Usage

### 1. Accessing the Admin Panel

1. Navigate to `/admin/login.html`
2. Use your Firebase admin credentials
3. You'll be redirected to `/admin/admin-firebase.html`

### 2. Content Management

#### News Management
- **Add News**: Click "Add News Article" button
- **Edit News**: Click edit button on any news item
- **Publish/Unpublish**: Toggle publication status
- **Delete News**: Click delete button (with confirmation)

#### Events Management
- **Add Event**: Click "Add Event" button
- **Edit Event**: Click edit button on any event
- **Delete Event**: Click delete button (with confirmation)

#### Leadership Management
- **Add Member**: Click "Add Leadership Member" button
- **Edit Member**: Click edit button on any member
- **Delete Member**: Click delete button (with confirmation)

#### Gallery Management
- **Upload Images**: Click "Upload Image" button
- **Edit Images**: Click edit button on any image
- **Delete Images**: Click delete button (with confirmation)

### 3. User Management

#### Adding New Admins
1. Go to User Management section
2. Fill in the user form:
   - Email address
   - Full name
   - Role (Admin/Editor/Contributor)
3. Click "Add User"
4. The system will create a Firebase user account

#### Role Permissions
- **Admin**: Full access to all features
- **Editor**: Can create, edit, and delete content
- **Contributor**: Can create and edit content (cannot delete)

### 4. Settings Management

#### General Settings
- Site name and description
- Contact information
- Social media links
- Maintenance mode toggle

#### Backup & Restore
- **Export Data**: Download all content as JSON
- **Import Data**: Upload previously exported data
- **Automatic Backups**: System creates daily backups

## Real-time Features

### 1. Live Content Updates
- Changes made in admin panel appear instantly on the website
- Multiple admins can work simultaneously
- Conflict resolution handles simultaneous edits

### 2. Offline Support
- Admin panel works offline
- Changes are queued and synced when connection is restored
- Local caching ensures fast loading

### 3. Activity Monitoring
- Real-time dashboard statistics
- Recent activity feed
- User action tracking

## Troubleshooting

### Common Issues

#### 1. Login Problems
- **Issue**: Cannot log in to admin panel
- **Solution**: 
  - Check Firebase Authentication settings
  - Verify user exists in Firebase Console
  - Check browser console for errors

#### 2. Content Not Syncing
- **Issue**: Changes not appearing on website
- **Solution**:
  - Check Firebase connection
  - Verify Firestore security rules
  - Check browser console for errors

#### 3. Image Upload Issues
- **Issue**: Images not uploading
- **Solution**:
  - Check Firebase Storage rules
  - Verify file size limits
  - Check browser console for errors

#### 4. Permission Errors
- **Issue**: Access denied errors
- **Solution**:
  - Check user role in Firestore
  - Verify security rules
  - Ensure user is properly authenticated

### Debug Mode
Enable debug mode by adding `?debug=true` to the admin URL:
```
/admin/admin-firebase.html?debug=true
```

This will show additional console logs and error information.

## Security Best Practices

### 1. User Management
- Regularly review admin users
- Remove inactive accounts
- Use strong passwords
- Enable two-factor authentication (if available)

### 2. Content Security
- Validate all user inputs
- Sanitize uploaded files
- Regular content backups
- Monitor for suspicious activity

### 3. Firebase Security
- Keep Firebase rules updated
- Regular security rule reviews
- Monitor Firebase usage
- Set up alerts for unusual activity

## Performance Optimization

### 1. Caching
- Content is cached locally for fast loading
- Automatic cache invalidation on updates
- Offline-first approach

### 2. Image Optimization
- Automatic image compression
- Responsive image sizing
- Lazy loading implementation

### 3. Database Optimization
- Efficient queries with limits
- Indexed fields for fast searches
- Pagination for large datasets

## Support and Maintenance

### 1. Regular Tasks
- Monitor Firebase usage and costs
- Review and update content regularly
- Backup data weekly
- Update security rules as needed

### 2. Updates
- Keep Firebase SDK updated
- Monitor for security updates
- Test new features before deployment

### 3. Monitoring
- Set up Firebase monitoring
- Track website performance
- Monitor user engagement
- Review error logs regularly

## Contact and Support

For technical support or questions about the admin system:
- Check the browser console for error messages
- Review Firebase Console for authentication and database issues
- Contact the development team for advanced troubleshooting

---

**Note**: This admin system is designed to be user-friendly while maintaining security and performance. Regular maintenance and monitoring will ensure optimal operation.
