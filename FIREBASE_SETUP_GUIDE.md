# Firebase Setup Guide for Madi Makerere Students Association

## Prerequisites
- Google account
- Firebase project access
- Basic understanding of web development

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `madi-makerere-students`
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Optionally enable other providers (Google, Facebook, etc.)

## Step 3: Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users)
5. Click "Done"

## Step 4: Configure Storage

1. Go to "Storage"
2. Click "Get started"
3. Review security rules
4. Choose a location
5. Click "Done"

## Step 5: Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (`</>`)
4. Register app with nickname: `madi-makerere-web`
5. Copy the configuration object

## Step 6: Update Configuration Files

Replace the placeholder configuration in these files:

### `firebase-config.js`
```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "madi-makerere-students.firebaseapp.com",
    projectId: "madi-makerere-students",
    storageBucket: "madi-makerere-students.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### `admin/admin.html` and `admin/login.html`
Update the Firebase configuration in the script tags.

## Step 7: Set Up Firestore Collections

Create the following collections in Firestore:

### Collections Structure:
```
/pages
  - Document ID: auto-generated
  - Fields: pageType, content, createdAt, updatedAt, createdBy, updatedBy

/news
  - Document ID: auto-generated
  - Fields: title, category, content, excerpt, image, publishedAt, featured, createdAt, updatedAt, createdBy, updatedBy

/events
  - Document ID: auto-generated
  - Fields: title, description, eventDate, time, location, category, status, image, createdAt, updatedAt, createdBy, updatedBy

/leadership
  - Document ID: auto-generated
  - Fields: name, position, department, bio, image, email, phone, createdAt, updatedAt, createdBy, updatedBy

/gallery
  - Document ID: auto-generated
  - Fields: title, image, category, caption, uploadedAt, uploadedBy

/users
  - Document ID: user UID
  - Fields: email, displayName, role, createdAt, lastLogin, isActive

/settings
  - Document ID: auto-generated
  - Fields: siteTitle, siteDescription, itemsPerPage, createdAt, updatedAt

/backups
  - Document ID: auto-generated
  - Fields: name, timestamp, createdBy, version, collections

/editing_locks
  - Document ID: auto-generated
  - Fields: contentId, contentType, lockedBy, lockedAt, userDisplayName

/content_history
  - Document ID: auto-generated
  - Fields: contentId, contentType, action, changes, updatedBy, updatedAt, userDisplayName

/content_conflicts
  - Document ID: auto-generated
  - Fields: contentId, contentType, localChanges, serverData, conflictAt, resolvedBy, resolution

/activity_logs
  - Document ID: auto-generated
  - Fields: action, userId, timestamp, userAgent, ip
```

## Step 8: Set Up Security Rules

### Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin users can read/write all content
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor'];
    }
    
    // Contributors can read all content but only write to specific collections
    match /news/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor', 'contributor'];
    }
    
    match /events/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor', 'contributor'];
    }
    
    // Public read access for published content
    match /pages/{document} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor'];
    }
    
    match /news/{document} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor', 'contributor'];
    }
    
    match /events/{document} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor', 'contributor'];
    }
    
    match /leadership/{document} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor'];
    }
    
    match /gallery/{document} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor', 'contributor'];
    }
  }
}
```

### Storage Security Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload files to their own folder
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin users can upload to any folder
    match /{allPaths=**} {
      allow read, write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor'];
    }
    
    // Public read access for uploaded content
    match /content/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor', 'contributor'];
    }
  }
}
```

## Step 9: Create Initial Admin User

1. Go to Authentication > Users
2. Click "Add user"
3. Enter admin email and password
4. Go to Firestore Database
5. Create a document in `/users` collection with the admin's UID
6. Set the document fields:
   - `email`: admin email
   - `displayName`: "Administrator"
   - `role`: "admin"
   - `createdAt`: current timestamp
   - `isActive`: true

## Step 10: Test the Setup

1. Open the admin login page
2. Try logging in with the admin credentials
3. Check if the admin dashboard loads
4. Test creating, editing, and deleting content
5. Verify that changes are saved to Firestore

## Step 11: Deploy to Production

1. Update Firestore security rules for production
2. Set up proper user roles and permissions
3. Configure backup and recovery procedures
4. Set up monitoring and alerts
5. Test all functionality thoroughly

## Troubleshooting

### Common Issues:

1. **Authentication not working**
   - Check if Email/Password is enabled in Authentication
   - Verify the configuration object is correct
   - Check browser console for errors

2. **Permission denied errors**
   - Verify Firestore security rules
   - Check user role in Firestore
   - Ensure user is properly authenticated

3. **Storage upload failures**
   - Check Storage security rules
   - Verify file size limits
   - Check file type restrictions

4. **Real-time updates not working**
   - Verify Firestore listeners are set up correctly
   - Check for JavaScript errors in console
   - Ensure proper cleanup of listeners

## Security Best Practices

1. **Never expose API keys in client-side code**
   - Use environment variables
   - Implement proper access controls
   - Regularly rotate API keys

2. **Implement proper user roles**
   - Admin: Full access
   - Editor: Content management
   - Contributor: Limited content creation

3. **Set up monitoring**
   - Enable Firebase Analytics
   - Set up alerts for suspicious activity
   - Monitor storage and database usage

4. **Regular backups**
   - Set up automated backups
   - Test restore procedures
   - Store backups securely

## Support

For additional help:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Support](https://firebase.google.com/support)
- [Firebase Community](https://firebase.google.com/community)
