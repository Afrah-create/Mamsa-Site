/* Main JavaScript functionality for Madi Makerere University Students Association */

// Global variables
let currentPage = window.location.pathname.split('/').pop() || 'index.html';
let contentData = {};
let isAdminLoggedIn = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    updateFooterYear();
    
    // Fallback FAQ initialization after a short delay to ensure DOM is ready
    setTimeout(function() {
        const faqItems = document.querySelectorAll('.faq-item');
        if (faqItems.length > 0) {
            initializeFAQ();
        }
    }, 100);
});

// Update footer year dynamically
function updateFooterYear() {
    const currentYear = new Date().getFullYear();
    const footerYearElements = document.querySelectorAll('.footer-year');
    
    footerYearElements.forEach(element => {
        element.textContent = currentYear;
    });
    
    // Also update any hardcoded years in footer text
    const footerTexts = document.querySelectorAll('.footer-bottom p');
    footerTexts.forEach(text => {
        text.innerHTML = text.innerHTML.replace(/2024/g, currentYear);
    });
}

// Initialize application
function initializeApp() {
    loadContentData();
    initializeNavigation();
    initializeForms();
    initializeAnimations();
    initializePageSpecificFeatures();
    initializeEventCategories();
    
    // Initialize Firebase content synchronization
    initializeFirebaseSync();
    
    // Check if user is on admin page
    if (currentPage.includes('admin')) {
        initializeAdminFeatures();
    }
}

// Initialize Firebase content synchronization
async function initializeFirebaseSync() {
    try {
        // Check if Firebase is available
        if (typeof window.firebase !== 'undefined') {
            // Import content synchronizer dynamically
            const { contentSynchronizer } = await import('./content-synchronizer.js');
            
            // Initialize content synchronizer
            await contentSynchronizer.initializeWebsiteSync();
            
            // Listen for content updates
            window.addEventListener('contentUpdated', (event) => {
                const { type, data } = event.detail;
                console.log(`Content updated: ${type}`, data);
                
                // Update specific sections based on content type
                switch (type) {
                    case 'news':
                        contentSynchronizer.updateNewsSection(data);
                        break;
                    case 'events':
                        contentSynchronizer.updateEventsSection(data);
                        break;
                    case 'leadership':
                        contentSynchronizer.updateLeadershipSection(data);
                        break;
                    case 'gallery':
                        contentSynchronizer.updateGallerySection(data);
                        break;
                }
            });
            
            console.log('Firebase content synchronization initialized');
        } else {
            console.log('Firebase not available, using static content');
        }
    } catch (error) {
        console.error('Error initializing Firebase sync:', error);
        // Fallback to static content loading
        console.log('Falling back to static content loading');
    }
}

// Load content data from JSON file
async function loadContentData() {
    try {
        const response = await fetch('data/content.json');
        if (response.ok) {
            contentData = await response.json();
            populatePageContent();
        } else {
            console.warn('Content data not found, using default content');
            loadDefaultContent();
        }
    } catch (error) {
        console.error('Error loading content data:', error);
        loadDefaultContent();
    }
}

// Load default content if JSON file is not available
function loadDefaultContent() {
    contentData = {
        news: [
            {
                id: 1,
                title: "Welcome to the New Academic Year",
                excerpt: "We're excited to welcome all students to another promising academic year.",
                content: "The Madi Makerere University Students Association is thrilled to welcome all students to the new academic year. We have exciting plans and activities lined up for you.",
                category: "announcements",
                date: "2024-01-15",
                image: "images/news/welcome-2024.jpg",
                featured: true
            },
            {
                id: 2,
                title: "Cultural Week Celebration",
                excerpt: "Join us for our annual cultural week celebration showcasing Madi traditions.",
                content: "Our annual cultural week celebration is coming up! This is a great opportunity to showcase our rich Madi culture and traditions to the university community.",
                category: "cultural",
                date: "2024-01-10",
                image: "images/news/cultural-week.jpg",
                featured: false
            },
            {
                id: 3,
                title: "Academic Excellence Awards",
                excerpt: "Congratulations to our members who received academic excellence awards.",
                content: "We're proud to announce that several of our members have received academic excellence awards for their outstanding performance in the previous semester.",
                category: "academics",
                date: "2024-01-05",
                image: "images/news/awards.jpg",
                featured: false
            }
        ],
        events: [
            {
                id: 1,
                title: "Orientation for New Members",
                date: "2024-02-15",
                time: "10:00 AM",
                location: "Main Hall",
                description: "Welcome orientation for new association members",
                category: "social",
                image: "images/events/orientation.jpg",
                status: "upcoming"
            },
            {
                id: 2,
                title: "Study Group Session",
                date: "2024-02-20",
                time: "2:00 PM",
                location: "Library",
                description: "Group study session for all members",
                category: "academic",
                image: "images/events/study-group.jpg",
                status: "upcoming"
            },
            {
                id: 3,
                title: "Sports Tournament",
                date: "2024-01-30",
                time: "9:00 AM",
                location: "Sports Complex",
                description: "Annual sports tournament",
                category: "sports",
                image: "images/events/sports-tournament.jpg",
                status: "past"
            }
        ],
        leadership: [
            {
                id: 1,
                name: "John Doe",
                position: "President",
                department: "Executive",
                email: "president@madimakerere.org",
                phone: "+256 700 000 001",
                bio: "Dedicated student leader with a passion for community development.",
                image: "images/leadership/president.jpg",
                year: "Year 3",
                course: "Computer Science"
            },
            {
                id: 2,
                name: "Jane Smith",
                position: "Vice President",
                department: "Executive",
                email: "vicepresident@madimakerere.org",
                phone: "+256 700 000 002",
                bio: "Experienced leader focused on student welfare and academic excellence.",
                image: "images/leadership/vice-president.jpg",
                year: "Year 3",
                course: "Business Administration"
            },
            {
                id: 3,
                name: "Michael Johnson",
                position: "Secretary General",
                department: "Executive",
                email: "secretary@madimakerere.org",
                phone: "+256 700 000 003",
                bio: "Organized and detail-oriented leader managing association communications.",
                image: "images/leadership/secretary.jpg",
                year: "Year 2",
                course: "Public Administration"
            }
        ],
        gallery: [
            {
                id: 1,
                title: "Cultural Week Performance",
                description: "Traditional dance performance during cultural week",
                category: "cultural",
                date: "2024-01-15",
                image: "images/gallery/cultural-performance.jpg",
                photographer: "Association Media Team"
            },
            {
                id: 2,
                title: "Study Group Session",
                description: "Students collaborating during study group session",
                category: "academic",
                date: "2024-01-10",
                image: "images/gallery/study-group.jpg",
                photographer: "Academic Affairs Team"
            },
            {
                id: 3,
                title: "Sports Tournament",
                description: "Exciting moments from our annual sports tournament",
                category: "sports",
                date: "2024-01-05",
                image: "images/gallery/sports-tournament.jpg",
                photographer: "Sports Committee"
            }
        ],
        about: {
            mission: "To foster unity among Madi students at Makerere University, promote academic excellence, provide a platform for personal and professional development, and advocate for student rights and welfare while maintaining strong cultural identity and values.",
            vision: "To be the leading student association that empowers Madi students to achieve academic excellence, develop leadership skills, and contribute meaningfully to society while preserving and promoting our rich cultural heritage."
        },
        contact: {
            phone: "+256 700 000 000",
            email: "info@madimakerere.org",
            address: "Makerere University, Kampala, Uganda",
            officeHours: "Monday - Friday: 8:00 AM - 5:00 PM\nSaturday: 9:00 AM - 2:00 PM\nSunday: Closed"
        }
    };
    
    populatePageContent();
}

// Populate page content based on current page
function populatePageContent() {
    switch (currentPage) {
        case 'index.html':
            populateHomepage();
            break;
        case 'about.html':
            populateAboutPage();
            break;
        case 'leadership.html':
            populateLeadershipPage();
            break;
        case 'events.html':
            populateEventsPage();
            break;
        case 'news.html':
            populateNewsPage();
            break;
        case 'gallery.html':
            populateGalleryPage();
            break;
        case 'services.html':
            populateServicesPage();
            break;
        case 'contact.html':
            populateContactPage();
            break;
    }
}

// Initialize navigation
function initializeNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Initialize forms
function initializeForms() {
    // Newsletter form
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmission);
    }
    
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmission);
    }
    
    // Event registration form
    const eventRegistrationForm = document.getElementById('event-registration-form');
    if (eventRegistrationForm) {
        eventRegistrationForm.addEventListener('submit', handleEventRegistration);
    }
    
    // Leadership interest form
    const leadershipForm = document.getElementById('leadership-interest-form');
    if (leadershipForm) {
        leadershipForm.addEventListener('submit', handleLeadershipInterest);
    }
    
    // Photo upload form
    const photoUploadForm = document.getElementById('photo-upload-form');
    if (photoUploadForm) {
        photoUploadForm.addEventListener('submit', handlePhotoUpload);
    }
    
    // Service request forms
    const serviceForms = document.querySelectorAll('[id$="-form"]');
    serviceForms.forEach(form => {
        if (form.id.includes('support') || form.id.includes('welfare') || form.id.includes('career')) {
            form.addEventListener('submit', handleServiceRequest);
        }
    });
}

// Initialize animations
function initializeAnimations() {
    // Animate stats on homepage
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    if (statNumbers.length > 0) {
        animateStats();
    }
    
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.stat-item, .news-card, .event-card, .leader-card');
    animateElements.forEach(el => observer.observe(el));
}

// Initialize page-specific features
function initializePageSpecificFeatures() {
    switch (currentPage) {
        case 'events.html':
            initializeEventFilters();
            initializeEventCalendar();
            break;
        case 'news.html':
            initializeNewsFilters();
            initializeNewsSearch();
            initializeNewsModal();
            break;
        case 'gallery.html':
            initializeGalleryFilters();
            initializeLightbox();
            break;
        case 'services.html':
            initializeServiceTabs();
            break;
        case 'contact.html':
            initializeFAQ();
            break;
    }
}

// Populate homepage content
function populateHomepage() {
    // Populate latest news
    const latestNewsGrid = document.getElementById('latest-news-grid');
    if (latestNewsGrid && contentData.news) {
        const latestNews = contentData.news.slice(0, 3);
        latestNewsGrid.innerHTML = latestNews.map(news => `
            <div class="news-card">
                <img src="${news.image}" alt="${news.title}" class="card-image">
                <div class="card-content">
                    <div class="card-meta">
                        <span class="card-category">${news.category}</span>
                        <span class="card-date">${formatDate(news.date)}</span>
                    </div>
                    <h3 class="card-title">${news.title}</h3>
                    <p class="card-excerpt">${news.excerpt}</p>
                    <a href="news.html" class="card-link">Read More <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        `).join('');
    }
    
    // Populate upcoming events
    const upcomingEventsGrid = document.getElementById('upcoming-events-grid');
    if (upcomingEventsGrid && contentData.events) {
        const upcomingEvents = contentData.events.filter(event => event.status === 'upcoming').slice(0, 3);
        upcomingEventsGrid.innerHTML = upcomingEvents.map(event => `
            <div class="event-card">
                <img src="${event.image}" alt="${event.title}" class="card-image">
                <div class="card-content">
                    <div class="card-meta">
                        <span class="card-category">${event.category}</span>
                        <span class="card-date">${formatDate(event.date)}</span>
                    </div>
                    <h3 class="card-title">${event.title}</h3>
                    <p class="card-excerpt">${event.description}</p>
                    <div class="event-details">
                        <p><i class="fas fa-clock"></i> ${event.time}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    </div>
                    <a href="events.html" class="card-link">Learn More <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        `).join('');
    }
    
    // Populate leadership preview
    const leadershipPreviewGrid = document.getElementById('leadership-preview-grid');
    if (leadershipPreviewGrid && contentData.leadership) {
        const executiveLeaders = contentData.leadership.filter(leader => leader.department === 'Executive').slice(0, 4);
        leadershipPreviewGrid.innerHTML = executiveLeaders.map(leader => `
            <div class="leader-card">
                <img src="${leader.image}" alt="${leader.name}" class="leader-photo">
                <h3 class="leader-name">${leader.name}</h3>
                <p class="leader-position">${leader.position}</p>
                <p class="leader-bio">${leader.bio}</p>
            </div>
        `).join('');
    }
}

// Populate about page
function populateAboutPage() {
    if (contentData.about) {
        const missionContent = document.getElementById('mission-content');
        const visionContent = document.getElementById('vision-content');
        
        if (missionContent) {
            missionContent.textContent = contentData.about.mission;
        }
        if (visionContent) {
            visionContent.textContent = contentData.about.vision;
        }
    }
}

// Populate leadership page
function populateLeadershipPage() {
    if (!contentData.leadership) return;
    
    // Populate executive committee
    const executiveGrid = document.getElementById('executive-grid');
    if (executiveGrid) {
        const executiveLeaders = contentData.leadership.filter(leader => leader.department === 'Executive');
        executiveGrid.innerHTML = executiveLeaders.map(leader => `
            <div class="leader-card">
                <img src="${leader.image}" alt="${leader.name}" class="leader-photo">
                <h3 class="leader-name">${leader.name}</h3>
                <p class="leader-position">${leader.position}</p>
                <p class="leader-bio">${leader.bio}</p>
                <div class="leader-contact">
                    <p><i class="fas fa-envelope"></i> ${leader.email}</p>
                    <p><i class="fas fa-phone"></i> ${leader.phone}</p>
                </div>
            </div>
        `).join('');
    }
    
    // Populate organizational chart
    const presidentName = document.getElementById('president-name');
    const vicePresidentName = document.getElementById('vice-president-name');
    const secretaryName = document.getElementById('secretary-name');
    const treasurerName = document.getElementById('treasurer-name');
    
    if (presidentName) {
        const president = contentData.leadership.find(leader => leader.position === 'President');
        presidentName.textContent = president ? president.name : 'Loading...';
    }
    
    if (vicePresidentName) {
        const vicePresident = contentData.leadership.find(leader => leader.position === 'Vice President');
        vicePresidentName.textContent = vicePresident ? vicePresident.name : 'Loading...';
    }
    
    if (secretaryName) {
        const secretary = contentData.leadership.find(leader => leader.position === 'Secretary General');
        secretaryName.textContent = secretary ? secretary.name : 'Loading...';
    }
    
    if (treasurerName) {
        const treasurer = contentData.leadership.find(leader => leader.position === 'Treasurer');
        treasurerName.textContent = treasurer ? treasurer.name : 'Loading...';
    }
}

// Populate events page
function populateEventsPage() {
    if (!contentData.events) return;
    
    // Populate upcoming events
    const upcomingEventsGrid = document.getElementById('upcoming-events-grid');
    if (upcomingEventsGrid) {
        const upcomingEvents = contentData.events.filter(event => event.status === 'upcoming');
        upcomingEventsGrid.innerHTML = upcomingEvents.map(event => `
            <div class="event-card">
                <img src="${event.image}" alt="${event.title}" class="card-image">
                <div class="card-content">
                    <div class="card-meta">
                        <span class="card-category">${event.category}</span>
                        <span class="card-date">${formatDate(event.date)}</span>
                    </div>
                    <h3 class="card-title">${event.title}</h3>
                    <p class="card-excerpt">${event.description}</p>
                    <div class="event-details">
                        <p><i class="fas fa-clock"></i> ${event.time}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    </div>
                    <button class="btn btn-primary" onclick="registerForEvent(${event.id})">Register</button>
                </div>
            </div>
        `).join('');
    }
    
    // Populate past events
    const pastEventsGrid = document.getElementById('past-events-grid');
    if (pastEventsGrid) {
        const pastEvents = contentData.events.filter(event => event.status === 'past');
        pastEventsGrid.innerHTML = pastEvents.map(event => `
            <div class="event-card">
                <img src="${event.image}" alt="${event.title}" class="card-image">
                <div class="card-content">
                    <div class="card-meta">
                        <span class="card-category">${event.category}</span>
                        <span class="card-date">${formatDate(event.date)}</span>
                    </div>
                    <h3 class="card-title">${event.title}</h3>
                    <p class="card-excerpt">${event.description}</p>
                    <div class="event-details">
                        <p><i class="fas fa-clock"></i> ${event.time}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Populate event selection dropdown
    const eventSelection = document.getElementById('event-selection');
    if (eventSelection) {
        const upcomingEvents = contentData.events.filter(event => event.status === 'upcoming');
        eventSelection.innerHTML = '<option value="">Select Event</option>' + 
            upcomingEvents.map(event => `<option value="${event.id}">${event.title}</option>`).join('');
    }
}

// Populate news page
function populateNewsPage() {
    if (!contentData.news) return;
    
    // Populate featured article
    const featuredArticle = document.getElementById('featured-article');
    if (featuredArticle) {
        const featuredNews = contentData.news.find(news => news.featured);
        if (featuredNews) {
            featuredArticle.innerHTML = `
                <div class="featured-news-card">
                    <img src="${featuredNews.image}" alt="${featuredNews.title}" class="featured-image">
                    <div class="featured-content">
                        <div class="card-meta">
                            <span class="card-category">${featuredNews.category}</span>
                            <span class="card-date">${formatDate(featuredNews.date)}</span>
                        </div>
                        <h2 class="featured-title">${featuredNews.title}</h2>
                        <p class="featured-excerpt">${featuredNews.excerpt}</p>
                        <button class="btn btn-primary" onclick="openNewsModal(${featuredNews.id})">Read Full Article</button>
                    </div>
                </div>
            `;
        }
    }
    
    // Populate news grid
    const newsGrid = document.getElementById('news-grid');
    if (newsGrid) {
        newsGrid.innerHTML = contentData.news.map(news => `
            <div class="news-card" data-category="${news.category}">
                <img src="${news.image}" alt="${news.title}" class="card-image">
                <div class="card-content">
                    <div class="card-meta">
                        <span class="card-category">${news.category}</span>
                        <span class="card-date">${formatDate(news.date)}</span>
                    </div>
                    <h3 class="card-title">${news.title}</h3>
                    <p class="card-excerpt">${news.excerpt}</p>
                    <button class="card-link" onclick="openNewsModal(${news.id})">
                        Read More <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Initialize news sorting
    initializeNewsSorting();
}

// Populate gallery page
function populateGalleryPage() {
    if (!contentData.gallery) return;
    
    // Populate featured gallery
    const featuredGallery = document.getElementById('featured-gallery');
    if (featuredGallery) {
        const featuredPhotos = contentData.gallery.slice(0, 4);
        featuredGallery.innerHTML = featuredPhotos.map(photo => `
            <div class="gallery-item" data-category="${photo.category}">
                <img src="${photo.image}" alt="${photo.title}" class="gallery-image" onclick="openLightbox('${photo.image}', '${photo.title}', '${photo.description}', '${photo.date}', '${photo.category}')">
                <div class="gallery-info">
                    <h3 class="gallery-title">${photo.title}</h3>
                    <p class="gallery-meta">${formatDate(photo.date)} • ${photo.category}</p>
                </div>
            </div>
        `).join('');
    }
    
    // Populate main gallery
    const galleryGrid = document.getElementById('gallery-grid');
    if (galleryGrid) {
        galleryGrid.innerHTML = contentData.gallery.map(photo => `
            <div class="gallery-item" data-category="${photo.category}">
                <img src="${photo.image}" alt="${photo.title}" class="gallery-image" onclick="openLightbox('${photo.image}', '${photo.title}', '${photo.description}', '${photo.date}', '${photo.category}')">
                <div class="gallery-info">
                    <h3 class="gallery-title">${photo.title}</h3>
                    <p class="gallery-meta">${formatDate(photo.date)} • ${photo.category}</p>
                </div>
            </div>
        `).join('');
    }
}

// Populate services page
function populateServicesPage() {
    // Services page doesn't need dynamic content population
    // All content is static HTML
}

// Populate contact page
function populateContactPage() {
    if (contentData.contact) {
        // Contact information is already in HTML
        // Could be updated dynamically if needed
    }
}

// Initialize event filters
function initializeEventFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const sections = {
        'upcoming': document.getElementById('upcoming-events-section'),
        'past': document.getElementById('past-events-section'),
        'calendar': document.getElementById('event-calendar-section')
    };
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide sections
            Object.values(sections).forEach(section => {
                if (section) section.style.display = 'none';
            });
            
            if (sections[filter]) {
                sections[filter].style.display = 'block';
            }
        });
    });
}

// Initialize event calendar
function initializeEventCalendar() {
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const monthYearDisplay = document.getElementById('calendar-month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    
    let currentDate = new Date();
    
    if (prevMonthBtn && nextMonthBtn && monthYearDisplay && calendarGrid) {
        updateCalendar();
        
        prevMonthBtn.addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            updateCalendar();
        });
        
        nextMonthBtn.addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            updateCalendar();
        });
    }
    
    function updateCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        let calendarHTML = '';
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            calendarHTML += `<div class="calendar-day-header">${day}</div>`;
        });
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const hasEvent = hasEventOnDate(year, month, day);
            calendarHTML += `<div class="calendar-day ${hasEvent ? 'has-event' : ''}" data-day="${day}">${day}</div>`;
        }
        
        calendarGrid.innerHTML = calendarHTML;
    }
    
    function hasEventOnDate(year, month, day) {
        if (!contentData.events) return false;
        
        const targetDate = new Date(year, month, day);
        return contentData.events.some(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === targetDate.toDateString();
        });
    }
}

// Initialize news filters
function initializeNewsFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active filter
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter news cards
            filterNewsByCategory(category);
        });
    });
}

// Filter news by category
function filterNewsByCategory(category) {
    const newsCards = document.querySelectorAll('.news-card');
    
    newsCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.3s ease';
        } else {
            card.style.display = 'none';
        }
    });
}

// Initialize news search
function initializeNewsSearch() {
    const searchInput = document.getElementById('news-search');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput && searchBtn) {
        const performSearch = () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const newsCards = document.querySelectorAll('.news-card');
            
            if (searchTerm === '') {
                // Show all cards if search is empty
                newsCards.forEach(card => {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.3s ease';
                });
                return;
            }
            
            newsCards.forEach(card => {
                const title = card.querySelector('.card-title').textContent.toLowerCase();
                const excerpt = card.querySelector('.card-excerpt').textContent.toLowerCase();
                const category = card.querySelector('.card-category').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || excerpt.includes(searchTerm) || category.includes(searchTerm)) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.3s ease';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Show no results message if needed
            showSearchResults(searchTerm);
        };
        
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Real-time search as user types
        searchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(performSearch, 300);
        });
    }
}

// Show search results message
function showSearchResults(searchTerm) {
    const newsGrid = document.getElementById('news-grid');
    const visibleCards = Array.from(newsGrid.querySelectorAll('.news-card')).filter(card => 
        card.style.display !== 'none'
    );
    
    // Remove existing no-results message
    const existingMessage = document.getElementById('no-results-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (visibleCards.length === 0 && searchTerm !== '') {
        const noResultsMessage = document.createElement('div');
        noResultsMessage.id = 'no-results-message';
        noResultsMessage.className = 'no-results-message';
        noResultsMessage.innerHTML = `
            <div class="no-results-content">
                <i class="fas fa-search"></i>
                <h3>No articles found</h3>
                <p>No articles match your search for "<strong>${searchTerm}</strong>"</p>
                <button class="btn btn-outline" onclick="clearSearch()">Clear Search</button>
            </div>
        `;
        newsGrid.appendChild(noResultsMessage);
    }
}

// Clear search
function clearSearch() {
    const searchInput = document.getElementById('news-search');
    if (searchInput) {
        searchInput.value = '';
        filterNewsByCategory('all');
        
        // Reset active filter to "All News"
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => btn.classList.remove('active'));
        const allBtn = document.querySelector('.filter-btn[data-category="all"]');
        if (allBtn) allBtn.classList.add('active');
    }
}

// Initialize news sorting
function initializeNewsSorting() {
    const sortSelect = document.getElementById('news-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            sortNews(sortBy);
        });
    }
}

// Sort news articles
function sortNews(sortBy) {
    const newsGrid = document.getElementById('news-grid');
    const newsCards = Array.from(newsGrid.querySelectorAll('.news-card'));
    
    newsCards.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                const dateA = new Date(a.querySelector('.card-date').textContent);
                const dateB = new Date(b.querySelector('.card-date').textContent);
                return dateB - dateA;
            case 'oldest':
                const dateA2 = new Date(a.querySelector('.card-date').textContent);
                const dateB2 = new Date(b.querySelector('.card-date').textContent);
                return dateA2 - dateB2;
            case 'popular':
                // For now, just sort by title alphabetically
                const titleA = a.querySelector('.card-title').textContent;
                const titleB = b.querySelector('.card-title').textContent;
                return titleA.localeCompare(titleB);
            default:
                return 0;
        }
    });
    
    // Re-append sorted cards
    newsCards.forEach(card => {
        newsGrid.appendChild(card);
    });
}

// Open news modal
function openNewsModal(newsId) {
    const news = contentData.news.find(n => n.id === newsId);
    if (!news) return;
    
    const modal = document.getElementById('news-modal');
    const title = document.getElementById('news-modal-title');
    const meta = document.getElementById('news-modal-meta');
    const image = document.getElementById('news-modal-image');
    const content = document.getElementById('news-modal-content');
    
    if (modal && title && meta && image && content) {
        title.textContent = news.title;
        meta.innerHTML = `
            <span><i class="fas fa-calendar"></i> ${formatDate(news.date)}</span>
            <span><i class="fas fa-tag"></i> ${news.category}</span>
        `;
        image.src = news.image;
        image.alt = news.title;
        content.textContent = news.content;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close news modal
function closeNewsModal() {
    const modal = document.getElementById('news-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Initialize news modal
function initializeNewsModal() {
    const modal = document.getElementById('news-modal');
    const closeBtn = document.getElementById('news-modal-close');
    
    if (modal && closeBtn) {
        closeBtn.addEventListener('click', closeNewsModal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeNewsModal();
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (modal.classList.contains('active') && e.key === 'Escape') {
                closeNewsModal();
            }
        });
    }
}

// Initialize gallery filters
function initializeGalleryFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Filter gallery items
            galleryItems.forEach(item => {
                if (filter === 'all' || item.getAttribute('data-category') === filter) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// Initialize lightbox
function initializeLightbox() {
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    
    if (lightboxModal && lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
        
        lightboxModal.addEventListener('click', function(e) {
            if (e.target === lightboxModal) {
                closeLightbox();
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (lightboxModal.classList.contains('active')) {
                if (e.key === 'Escape') {
                    closeLightbox();
                } else if (e.key === 'ArrowLeft') {
                    // Previous image logic
                } else if (e.key === 'ArrowRight') {
                    // Next image logic
                }
            }
        });
    }
}

// Open lightbox
function openLightbox(imageSrc, title, description, date, category) {
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDescription = document.getElementById('lightbox-description');
    const lightboxDate = document.getElementById('lightbox-date');
    const lightboxCategory = document.getElementById('lightbox-category');
    
    if (lightboxModal && lightboxImage && lightboxTitle) {
        lightboxImage.src = imageSrc;
        lightboxImage.alt = title;
        lightboxTitle.textContent = title;
        
        if (lightboxDescription) lightboxDescription.textContent = description;
        if (lightboxDate) lightboxDate.textContent = formatDate(date);
        if (lightboxCategory) lightboxCategory.textContent = category;
        
        lightboxModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close lightbox
function closeLightbox() {
    const lightboxModal = document.getElementById('lightbox-modal');
    if (lightboxModal) {
        lightboxModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Initialize service tabs
function initializeServiceTabs() {
    const formTabs = document.querySelectorAll('.form-tab');
    const serviceForms = document.querySelectorAll('.service-form');
    
    formTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const formType = this.getAttribute('data-form');
            
            // Update active tab
            formTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide forms
            serviceForms.forEach(form => {
                if (form.id === `${formType}-form`) {
                    form.classList.add('active');
                } else {
                    form.classList.remove('active');
                }
            });
        });
    });
}

// Initialize FAQ
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    // Check if already initialized
    if (faqItems.length > 0 && faqItems[0].dataset.faqInitialized) {
        return;
    }
    
    faqItems.forEach((item, index) => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const toggle = item.querySelector('.faq-toggle i');
        
        // Mark as initialized
        item.dataset.faqInitialized = 'true';
        
        if (question && answer) {
            question.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Close other FAQ items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        const otherToggle = otherItem.querySelector('.faq-toggle i');
                        if (otherAnswer) {
                            otherAnswer.style.maxHeight = '0';
                            otherAnswer.style.opacity = '0';
                        }
                        if (otherToggle) {
                            otherToggle.style.transform = 'rotate(0deg)';
                        }
                    }
                });
                
                // Toggle current item
                const isActive = item.classList.contains('active');
                
                if (isActive) {
                    item.classList.remove('active');
                    answer.style.maxHeight = '0';
                    answer.style.opacity = '0';
                } else {
                    item.classList.add('active');
                    // Set max-height to scrollHeight for smooth animation
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    answer.style.opacity = '1';
                }
                
                // Animate the toggle icon
                if (toggle) {
                    if (isActive) {
                        toggle.style.transform = 'rotate(0deg)';
                    } else {
                        toggle.style.transform = 'rotate(180deg)';
                    }
                }
            });
        }
    });
    
    // Initialize all FAQ answers to be closed
    faqItems.forEach(item => {
        const answer = item.querySelector('.faq-answer');
        if (answer) {
            answer.style.maxHeight = '0';
            answer.style.opacity = '0';
            answer.style.overflow = 'hidden';
            answer.style.transition = 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
        }
    });
    
    // Add keyboard support for accessibility
    addFAQKeyboardSupport();
    
    // FAQ initialization complete - ready for user interaction
}

// Form handlers
function handleNewsletterSubmission(e) {
    e.preventDefault();
    
    const email = document.getElementById('newsletter-email').value;
    
    if (email) {
        // Simulate API call
        showNotification('Thank you for subscribing to our newsletter!', 'success');
        e.target.reset();
    }
}

function handleContactSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Simulate API call
    showNotification('Thank you for your message! We will get back to you soon.', 'success');
    e.target.reset();
}

function handleEventRegistration(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Simulate API call
    showNotification('Thank you for registering! You will receive a confirmation email shortly.', 'success');
    e.target.reset();
}

function handleLeadershipInterest(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Simulate API call
    showNotification('Thank you for your interest in leadership! We will review your application.', 'success');
    e.target.reset();
}

function handlePhotoUpload(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const files = document.getElementById('photo-files').files;
    
    if (files.length > 0) {
        // Simulate API call
        showNotification('Photos uploaded successfully! They will be reviewed before being added to the gallery.', 'success');
        e.target.reset();
    }
}

function handleServiceRequest(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Simulate API call
    showNotification('Your service request has been submitted! We will contact you soon.', 'success');
    e.target.reset();
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            stat.textContent = Math.floor(current);
        }, 16);
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Register for event function
function registerForEvent(eventId) {
    const event = contentData.events.find(e => e.id === eventId);
    if (event) {
        showNotification(`Registration for "${event.title}" has been initiated. Please fill out the registration form below.`, 'info');
        
        // Scroll to registration form
        const registrationForm = document.querySelector('.event-registration');
        if (registrationForm) {
            registrationForm.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Pre-select the event in the dropdown
        const eventSelection = document.getElementById('event-selection');
        if (eventSelection) {
            eventSelection.value = eventId;
        }
    }
}

// Initialize admin features
function initializeAdminFeatures() {
    // This will be implemented in admin.js
    console.log('Admin features will be initialized by admin.js');
}


// Initialize Event Categories
function initializeEventCategories() {
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterEventsByCategory(category);
        });
        
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Filter events by category
function filterEventsByCategory(category) {
    // This function would filter events based on the selected category
    console.log(`Filtering events by category: ${category}`);
    
    // For now, just show a message
    const eventGrid = document.getElementById('upcoming-events-grid');
    if (eventGrid) {
        eventGrid.innerHTML = `
            <div class="no-events-message">
                <i class="fas fa-filter"></i>
                <h3>Filtering by ${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                <p>Events in this category will be displayed here.</p>
            </div>
        `;
    }
}

// Debug FAQ functionality
function debugFAQ() {
    console.log('=== FAQ Debug Information ===');
    const faqItems = document.querySelectorAll('.faq-item');
    console.log(`Found ${faqItems.length} FAQ items`);
    
    faqItems.forEach((item, index) => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const toggle = item.querySelector('.faq-toggle i');
        
        console.log(`FAQ Item ${index + 1}:`);
        console.log(`  - Question element: ${question ? 'Found' : 'Missing'}`);
        console.log(`  - Answer element: ${answer ? 'Found' : 'Missing'}`);
        console.log(`  - Toggle element: ${toggle ? 'Found' : 'Missing'}`);
        console.log(`  - Is active: ${item.classList.contains('active')}`);
        
        if (answer) {
            console.log(`  - Answer max-height: ${answer.style.maxHeight || 'not set'}`);
            console.log(`  - Answer opacity: ${answer.style.opacity || 'not set'}`);
        }
    });
    console.log('=== End FAQ Debug ===');
}

// Enhanced FAQ functionality with keyboard support
function addFAQKeyboardSupport() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            // Add keyboard navigation support
            question.setAttribute('tabindex', '0');
            question.setAttribute('role', 'button');
            question.setAttribute('aria-expanded', 'false');
            
            question.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    question.click();
                }
            });
            
            // Update aria-expanded when item is toggled
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isActive = item.classList.contains('active');
                        question.setAttribute('aria-expanded', isActive.toString());
                    }
                });
            });
            
            observer.observe(item, { attributes: true });
        }
    });
}
