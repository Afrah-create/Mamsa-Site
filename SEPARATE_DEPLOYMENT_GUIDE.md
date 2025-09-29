# Separate Deployment Guide for MAMSA Admin & User Sites

## 🎯 **Deployment Strategy**

Deploy **Admin Portal** and **User Site** as separate Vercel projects:

- **Admin Portal**: `admin.madimakerere.org` (or `mamsa-admin.vercel.app`)
- **User Site**: `madimakerere.org` (or `mamsa-site.vercel.app`)

## 📁 **Project Structure**

```
d:\mamsa\
├── admin\                    ← Deploy as separate project
│   ├── .env                  ← Supabase credentials here
│   ├── vercel.json           ← Admin-specific config
│   ├── package.json          ← Admin dependencies
│   ├── index.html
│   ├── login.html
│   ├── js\
│   │   ├── supabase-config.js
│   │   └── admin-content-manager.js
│   └── css\
│
├── user_site\                ← Deploy as separate project
│   ├── vercel.json           ← User site config
│   ├── package.json          ← User site dependencies
│   ├── index.html
│   ├── about.html
│   ├── events.html
│   └── ...
│
└── README.md
```

## 🚀 **Deployment Steps**

### **Step 1: Deploy Admin Portal**

#### **1.1 Prepare Admin Project**
```bash
cd admin
# Create .env file with your Supabase credentials
cp env.example .env
# Edit .env with your actual credentials
```

#### **1.2 Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. **New Project** → Import from GitHub
3. **Root Directory**: Set to `admin/`
4. **Environment Variables**:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
5. **Deploy**

#### **1.3 Configure Custom Domain (Optional)**
- **Admin URL**: `admin.madimakerere.org` or `mamsa-admin.vercel.app`

### **Step 2: Deploy User Site**

#### **2.1 Prepare User Site**
```bash
cd user_site
# No .env needed - user site doesn't use Supabase
```

#### **2.2 Deploy to Vercel**
1. **New Project** → Import from GitHub
2. **Root Directory**: Set to `user_site/`
3. **No environment variables needed**
4. **Deploy**

#### **2.3 Configure Custom Domain (Optional)**
- **User Site URL**: `madimakerere.org` or `mamsa-site.vercel.app`

## 🔧 **Configuration Files**

### **Admin Portal (`admin/vercel.json`)**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/",
      "dest": "/index.html"
    },
    {
      "src": "/login",
      "dest": "/login.html"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

### **User Site (`user_site/vercel.json`)**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/",
      "dest": "/index.html"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

## 🔐 **Supabase Configuration**

### **Update Supabase Settings**
1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. **Site URL**: `https://admin.madimakerere.org` (or your admin URL)
3. **Redirect URLs**:
   ```
   https://admin.madimakerere.org/login.html
   https://admin.madimakerere.org/login.html?reset=success
   https://admin.madimakerere.org/login.html?invite=true
   ```

## 📋 **Environment Variables**

### **Admin Portal Only**
Create `admin/.env`:
```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### **User Site**
No environment variables needed.

## 🎯 **Benefits of Separate Deployment**

### **✅ Advantages:**
- **Security**: Admin credentials isolated from public site
- **Performance**: Each site optimized independently
- **Scalability**: Scale admin and user sites separately
- **Maintenance**: Update sites independently
- **Custom Domains**: Different domains for admin vs public

### **🔧 Management:**
- **Admin Portal**: Secure, authentication-required
- **User Site**: Public, no authentication needed
- **Shared Data**: Both sites can read from same Supabase database

## 🚨 **Important Notes**

### **Admin Portal:**
- Requires Supabase authentication
- Environment variables needed
- Custom domain recommended for security

### **User Site:**
- No authentication required
- No environment variables
- Can use main domain

### **Database Access:**
- **Admin Portal**: Full CRUD access (authenticated)
- **User Site**: Read-only access (public data)

## 🎉 **Final URLs**

After deployment:
- **Admin Portal**: `https://admin.madimakerere.org`
- **User Site**: `https://madimakerere.org`

Both sites will be live and functional! 🚀
