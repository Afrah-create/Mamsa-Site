-- MAMSA Admin Database Schema for Supabase
-- This file contains the SQL schema for setting up the database tables

-- Create custom types
CREATE TYPE event_status AS ENUM ('upcoming', 'ongoing', 'past', 'cancelled');
CREATE TYPE event_category AS ENUM ('social', 'academic', 'cultural', 'sports', 'career', 'community');
CREATE TYPE news_category AS ENUM ('announcements', 'cultural', 'academics', 'sports', 'community');
CREATE TYPE gallery_category AS ENUM ('cultural', 'academic', 'sports', 'leadership', 'community', 'campus');

-- News table
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    category news_category NOT NULL DEFAULT 'announcements',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    image VARCHAR(500),
    featured BOOLEAN DEFAULT FALSE,
    author VARCHAR(255) NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME,
    location VARCHAR(255),
    category event_category NOT NULL DEFAULT 'social',
    image VARCHAR(500),
    status event_status NOT NULL DEFAULT 'upcoming',
    registration_required BOOLEAN DEFAULT FALSE,
    max_participants INTEGER,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leadership table
CREATE TABLE leadership (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    bio TEXT,
    image VARCHAR(500),
    year VARCHAR(50),
    course VARCHAR(255),
    social_media JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery table
CREATE TABLE gallery (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category gallery_category NOT NULL DEFAULT 'campus',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    image VARCHAR(500) NOT NULL,
    photographer VARCHAR(255),
    tags TEXT[],
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- About page content
CREATE TABLE about (
    id SERIAL PRIMARY KEY,
    section VARCHAR(100) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    service_key VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact information
CREATE TABLE contact (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    office_hours TEXT,
    social_media JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site settings
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users (for additional admin management)
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_date ON news(date);
CREATE INDEX idx_news_featured ON news(featured);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_leadership_department ON leadership(department);
CREATE INDEX idx_gallery_category ON gallery(category);
CREATE INDEX idx_gallery_featured ON gallery(featured);
CREATE INDEX idx_gallery_date ON gallery(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leadership_updated_at BEFORE UPDATE ON leadership FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gallery_updated_at BEFORE UPDATE ON gallery FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_about_updated_at BEFORE UPDATE ON about FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_updated_at BEFORE UPDATE ON contact FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadership ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE about ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated users to read all data" ON news FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read all data" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read all data" ON leadership FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read all data" ON gallery FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read all data" ON about FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read all data" ON services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read all data" ON contact FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read all data" ON settings FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert, update, and delete (admin operations)
CREATE POLICY "Allow authenticated users to manage news" ON news FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage events" ON events FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage leadership" ON leadership FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage gallery" ON gallery FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage about" ON about FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage services" ON services FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage contact" ON contact FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage settings" ON settings FOR ALL TO authenticated USING (true);

-- Admin users policies
CREATE POLICY "Allow users to read their own admin record" ON admin_users FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to manage admin users" ON admin_users FOR ALL TO authenticated USING (true);

-- Insert initial data
INSERT INTO about (section, content) VALUES 
('mission', 'To foster unity among Madi students at Makerere University, promote academic excellence, provide a platform for personal and professional development, and advocate for student rights and welfare while maintaining strong cultural identity and values.'),
('vision', 'To be the leading student association that empowers Madi students to achieve academic excellence, develop leadership skills, and contribute meaningfully to society while preserving and promoting our rich cultural heritage.'),
('history', 'The Madi Makerere University Students Association was founded in 2009 by a group of dedicated students with the vision of creating a supportive community for Madi students. Over the years, we have grown from a small group of 20 students to a vibrant association with over 500 active members.'),
('objectives', '["Promote academic achievement through study groups, mentorship programs, and academic support services", "Foster unity and friendship among Madi students through social events, cultural activities, and networking opportunities", "Represent student interests and advocate for their rights and welfare within the university and beyond", "Preserve and promote Madi culture, traditions, and values through cultural events and educational programs", "Develop leadership skills among members through training programs, workshops, and leadership opportunities", "Engage in community service projects that benefit society and contribute to national development"]'),
('achievements', '["Over 500 active members across all academic years", "Organized 50+ successful events and activities annually", "15 years of dedicated service to the student community", "25+ community service projects completed", "100+ scholarships and financial aid opportunities facilitated", "10+ strategic partnerships with organizations and institutions"]');

INSERT INTO contact (phone, email, address, office_hours, social_media) VALUES 
('+256 700 000 000', 'info@madimakerere.org', 'Makerere University, Kampala, Uganda', 'Monday - Friday: 8:00 AM - 5:00 PM\nSaturday: 9:00 AM - 2:00 PM\nSunday: Closed', '{"facebook": "https://facebook.com/madimakerere", "twitter": "https://twitter.com/madimakerere", "instagram": "https://instagram.com/madimakerere", "linkedin": "https://linkedin.com/company/madi-makerere-association", "whatsapp": "+256 700 000 000", "youtube": "https://youtube.com/madimakerere"}');

INSERT INTO services (service_key, title, description, features) VALUES 
('academicSupport', 'Academic Support', 'Comprehensive academic support services to help you excel in your studies', '["Study groups for all subjects", "One-on-one tutoring from senior students", "Access to academic resources and materials", "Exam preparation and revision sessions", "Academic counseling and guidance"]'),
('studentWelfare', 'Student Welfare', 'Support services to help you navigate challenges and thrive during your university journey', '["Professional counseling services", "Financial aid information and assistance", "Accommodation support and resources", "Emergency support and assistance", "Health and wellness programs"]'),
('careerServices', 'Career Services', 'Career development services and job placement assistance', '["Career counseling and planning", "Job opportunities and internships", "Resume building and interview preparation", "Networking events and career fairs", "Professional development workshops"]'),
('socialActivities', 'Social Activities', 'Connect with fellow students through diverse social activities and cultural events', '["Student clubs and organizations", "Cultural events and celebrations", "Sports activities and tournaments", "Social gatherings and networking", "Recreational activities and trips"]'),
('advocacy', 'Student Advocacy', 'Representing your interests and advocating for your rights', '["Student representation in university committees", "Policy advocacy and reform initiatives", "Dispute resolution and mediation", "Rights protection and promotion", "Student voice amplification"]');

INSERT INTO settings (setting_key, setting_value) VALUES 
('siteTitle', 'Madi Makerere University Students Association'),
('siteDescription', 'Official website of the Madi Makerere University Students Association - Connecting students, fostering community, and promoting excellence in education and leadership.'),
('itemsPerPage', '10'),
('enableComments', 'true'),
('enableNewsletter', 'true'),
('enableEventRegistration', 'true'),
('enablePhotoUpload', 'true'),
('maintenanceMode', 'false');

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
('images', 'images', true),
('documents', 'documents', false);

-- Set up storage policies
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');
CREATE POLICY "Allow authenticated users to update images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images');
CREATE POLICY "Allow authenticated users to delete images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'images');
CREATE POLICY "Allow public to view images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Allow authenticated users to update documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Allow authenticated users to delete documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Allow authenticated users to view documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
