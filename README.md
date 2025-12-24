# MAMSA Admin Panel

A modern, responsive admin panel for the Madi Makerere University Students Association (MAMSA), built with Next.js and Supabase.

## 🚀 Features

### 📊 Dashboard
- Overview statistics and metrics
- Recent activity tracking
- Quick access to key functions
- Real-time data updates

### 📰 News Management
- Create, edit, and delete news articles
- Rich text editing capabilities
- Featured image uploads
- Article status management (Draft, Published, Archived)
- Tag-based categorization
- Real-time updates

### 🎉 Events Management
- Comprehensive event creation and editing
- Event status tracking (Upcoming, Ongoing, Completed, Cancelled)
- Capacity management and registration requirements
- Organizer and contact information
- Event tags and categories

### 👥 Leadership Management
- Team member profiles
- Position and department management
- Bio and contact information
- Social media links
- Profile image management

### 🖼️ Gallery Management
- Image upload and organization
- Category-based filtering
- Photo metadata management
- Status and featured image controls

### 👤 User Management
- Admin user creation and management
- Role-based permissions
- User profile management
- Activity tracking

### ⚙️ Profile Settings
- Personal information management
- Profile picture uploads
- Password change functionality
- Account settings

## 🛠️ Technology Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Base64 encoding for images
- **Icons**: Heroicons (SVG)
- **Deployment**: Ready for Vercel/Netlify

## 📁 Project Structure

```
mamsa-admin/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard page
│   │   ├── news/              # News management
│   │   ├── events/            # Events management
│   │   ├── leadership/        # Leadership management
│   │   ├── gallery/           # Gallery management
│   │   ├── users/             # User management
│   │   ├── profile/           # Profile settings
│   │   ├── login/             # Authentication
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   │   ├── AdminLayout.tsx    # Main layout wrapper
│   │   ├── NewsModal.tsx      # News creation/editing
│   │   ├── EventModal.tsx     # Event creation/editing
│   │   ├── LeadershipModal.tsx # Leadership management
│   │   ├── GalleryModal.tsx   # Gallery management
│   │   ├── UserModal.tsx      # User management
│   │   ├── ConfirmModal.tsx   # Confirmation dialogs
│   │   └── ChangePasswordModal.tsx # Password management
│   └── lib/                   # Utilities and configurations
│       ├── supabase.ts        # Supabase client (browser)
│       └── supabase-server.ts # Supabase client (server)
├── public/                    # Static assets
├── setup-news-backend.sql     # Database setup script
├── fix-admin-users-table.sql  # User table fixes
├── fix-rls-policies.sql       # Security policies
└── package.json               # Dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mamsa-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL scripts in your Supabase SQL editor:
     ```bash
     # Run these in order:
     setup-news-backend.sql
     fix-admin-users-table.sql
     fix-rls-policies.sql
     ```

4. **Environment Configuration**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   
   **Important:** The `SUPABASE_SERVICE_ROLE_KEY` is required for admin user management. You can find it in your Supabase Dashboard under **Settings > API > Service Role Key** (keep this secret and never commit it to version control).

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

The admin panel uses Supabase Authentication with:
- Email/password authentication
- Row Level Security (RLS) policies
- Protected routes and middleware
- Session management

### Default Admin Account
After setting up the database, create an admin account through Supabase Auth or use the signup functionality.

## 📊 Database Schema

### Core Tables
- `admin_users` - Admin user profiles and permissions
- `news_articles` - News articles and content
- `events` - Event information and management
- `leadership` - Team member profiles
- `gallery` - Image gallery management

### Features
- Real-time subscriptions for live updates
- Automatic timestamps (created_at, updated_at)
- Soft delete capabilities
- Comprehensive RLS policies

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Consistent with modern design standards
- **Interactive Elements**: Hover effects, transitions, and animations
- **Modal System**: Intuitive creation and editing interfaces
- **Bulk Operations**: Select multiple items for batch actions
- **Search and Filtering**: Find content quickly
- **Real-time Updates**: See changes instantly across sessions

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for consistent styling
- Component-based architecture

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Configure environment variables

### Traditional Hosting
1. Build the project: `npm run build`
2. Upload the `.next` folder and `public` folder
3. Configure your server for Next.js
4. Set environment variables

## 🔒 Security Features

- Row Level Security (RLS) policies
- Protected API routes
- Input validation and sanitization
- Secure authentication flow
- Environment variable protection
- CSRF protection

## 📈 Performance

- Server-side rendering (SSR)
- Static generation where possible
- Image optimization
- Code splitting
- Lazy loading
- Real-time subscriptions

## 🧪 Testing

The application includes:
- Type safety with TypeScript
- Error boundaries for graceful failures
- Comprehensive error handling
- Fallback mechanisms for data loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📝 License

This project is developed for the Madi Makerere University Students Association. All rights reserved.

## 🆘 Support

For support and questions:
- Check the documentation in the `/docs` folder
- Review the SQL setup scripts for database issues
- Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with full admin functionality
- Complete CRUD operations for all content types
- Real-time updates and synchronization
- Responsive design and modern UI
- Supabase integration with RLS security

---

**Built with ❤️ for MAMSA**