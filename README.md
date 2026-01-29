# 💖 AniPulse - Anime Tracker & Stats Dashboard

![AniPulse](https://img.shields.io/badge/Version-1.0.3-blueviolet?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Platform](https://img.shields.io/badge/Platform-Web-orange?style=flat-square)

> **The Ultimate Anime Tracking Experience** 🚀
> 
> AniPulse is a modern, feature-rich anime tracker that helps you manage your watchlist, track progress, analyze detailed statistics, and celebrate your anime journey. Built with vanilla JavaScript and a sleek UI, this application provides a complete anime management solution with advanced analytics and personalization.

🌐 **[Live Demo](https://ani-pulse.netlify.app/)**

---

## ✨ Complete Feature Set

### 📊 Dashboard - Your Anime Universe at a Glance
- **Activity Heatmap** - Visualize your anime-watching patterns in an interactive matrix
- **Real-time Statistics** - Total episodes watched, hours streamed, current watching streak
- **Dynamic Greeting Banner** - Time-aware greetings (Morning/Afternoon/Evening/Night) with daily inspirational quotes
- **Top Rated Anime Section** - Quick view of your 5 highest-rated titles with ratings displayed
- **Recent Activity Feed** - Chronological tracking of all your recent updates and changes
- **Member Join Date** - Display of when you started your anime journey
- **Quick Action Buttons** - Easy access to key features (Add Anime, Export, Stats, etc.)
- **Profile Widget** - Mini profile card showing your username, avatar, and total anime count

### 📝 My Anime - Complete Collection Management
- **Add New Anime** - Full form with title search from Jikan API database
- **Comprehensive Tracking** - Store and manage:
  - Title and Type (TV, Movie, OVA, ONA, Special)
  - Episode count and personal progress
  - Personal rating (0-10 scale)
  - Watching status (Watching, Completed, Plan to Watch, Dropped)
  - Multiple genres per anime
  - Cover image/poster
  - Start and finish dates
  - Personal notes and observations
- **Status-based Organization** - Instantly sort by watching status
- **Edit & Delete** - Modify or remove anime with one click
- **Detailed Info Storage** - Store ratings, progress, genres, cover images, and notes
- **Genre Management** - Add multiple genres to categorize your collection
- **Table View** - Clean, organized interface for your entire collection

### 📺 Watchlist Manager - Smart Pagination & Filtering
- **Paginated Display** - 30 anime per page for smooth browsing and performance
- **Status Filters** - View by:
  - All anime
  - Currently Watching
  - Completed
  - Plan to Watch
  - Dropped
- **Episode Progress Tracking** - Monitor episodes watched vs. total episodes
- **Completion Percentage** - Visual indicator of how close you are to finishing
- **Quick Edit & Delete** - Actions directly from the list view
- **Search Integration** - Find specific anime within your watchlist
- **Responsive Table Layout** - Works seamlessly on all device sizes

### 📈 Advanced Statistics & Analytics
- **Monthly Progress Charts** - Line charts tracking completed anime by month
- **Genre Distribution** - Pie chart showing your favorite genres
- **Completion Rate Analytics** - Yearly and monthly completion percentages
- **Score Distribution Chart** - Histogram of your anime ratings
- **Watch Time Analytics** - Hours watched by month and genre
- **Type Distribution** - Series vs. Movies pie chart
- **Status Distribution** - Breakdown of anime by current status
- **Episodes Over Time** - Track episode completion trends
- **Genre Preference Trends** - See how your favorite genres change over years
- **Comprehensive Statistics Tables** - Detailed breakdowns with all viewing data
- **Detailed Insights** - Analyze patterns in your watching habits
- **Performance Comparisons** - Compare months and years side-by-side

### 🏆 Achievement System - Milestone Tracking & Badges
- **Dynamic Badge System** - Visual achievement badges that unlock as you progress
- **Multiple Achievement Categories**:
  - **Marathon Watcher** - Unlock badges for completing 10, 50, 100, 250, 500+ anime
  - **Binge Master** - Earn badges for watching 500, 2000, 5000, 10000+ episodes
  - **Genre Explorer** - Badges for exploring 5, 10, 15, 20+ different genres
  - **Streak Keeper** - Earn consistency badges for tracking anime on 7, 30, 90, 365+ consecutive days
  - **Score Collector** - Achieve rating-based badges for giving ratings across the scale
  - **Time Traveler** - Badges for watching anime from different decades
- **Progress Display** - See your current progress toward each achievement
- **Achievement Counter** - Track total badges earned
- **Detailed Achievement Info** - Learn requirements for each badge
- **Visual Indicators** - Locked and unlocked status clearly shown

### 🆕 Upcoming Anime & Notifications
- **Trending Shows Section** - Stay updated with currently trending anime
- **Seasonal Releases** - Discover anime by season (Spring, Summer, Fall, Winter)
- **Update Notifications** - Get alerts when:
  - New episodes air for anime you're watching
  - Trending anime are updated
  - Seasonal releases appear
- **Notification Panel** - Popup notifications with clear details
- **One-Click Tracking** - Add upcoming anime to your watchlist instantly
- **Notification Counter** - Badge showing number of unread notifications
- **Clear Notifications** - Manage your notification history
- **Auto-Sync** - Automatically checks for new episodes of your watched anime

### ⚙️ Settings & User Management - Personalization Hub
- **User Profile Customization**:
  - Custom username (saves instantly)
  - Custom avatar upload from device
  - Avatar generator with default options
  - Reset to default avatar
  - Profile preview with live updates
- **Dark/Light Theme Toggle**:
  - Light theme for day browsing
  - Dark theme for comfortable night viewing
  - System theme detection and sync
  - Persistent theme preference
- **Auto-Backup System**:
  - Automatic backup every minute (runs in background)
  - Backup reminders if not exported recently
  - Backup stored in localStorage
- **Data Management**:
  - **Export Data** - Download entire collection as JSON file
  - **Import Data** - Restore from previously exported JSON backup
  - File upload with validation
  - Instant data restoration
- **Account Information**:
  - Member since date tracking
  - Total anime count display
  - Quick stats preview

### 🔍 Search & Database Integration
- **Real-time Anime Search** - Search using Jikan API (MyAnimeList database)
- **Search Suggestions** - Auto-complete with anime titles as you type
- **Debounced Search** - Optimized search with 400ms debounce
- **Search Results Display** - Shows matching anime with:
  - Cover images
  - Episodes count
  - Anime type
  - Direct selection for adding to collection
- **Dashboard-wide Search** - Quick search feature in top navigation bar
- **Database Filter** - Search by title, genre, or status

### 🎨 User Interface & Experience
- **Responsive Design** - Perfect on desktop (1920px), tablet (768px), and mobile (320px)
- **Smooth Animations** - Polished transitions and hover effects throughout
- **Dark Theme** - Easy on the eyes for late-night watching sessions
- **Light Theme** - Clean, bright interface for day use
- **System Theme Detection** - Automatic theme based on OS settings
- **Accessibility Features** - 
  - Clear visual hierarchy
  - High contrast text
  - Keyboard navigation support
  - Logical tab order
- **Toast Notifications** - Real-time feedback for all user actions
  - Success messages (green)
  - Error messages (red)
  - Info messages (blue)
  - Auto-dismiss timers
- **Modal System** - Clean dialogs for:
  - Adding/editing anime
  - Importing data
  - Confirmation actions
- **Loading States** - Visual feedback during data operations
- **Loading Screen** - Animated splash screen with progress bar
- **Intuitive Navigation** - Sidebar menu with clear sections
- **Top Navigation Bar** - Quick access to key features
- **Profile Menu** - Easy profile and settings access

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled (Chrome, Firefox, Safari, Edge)
- No installation required - runs entirely in the browser
- No backend server needed - all data stored locally
- No account creation needed - start tracking immediately

### Installation & Setup

1. **Clone or Download**
   ```bash
   git clone https://github.com/yamanjr10/AniPulse.git
   cd AniPulse
   ```

2. **Open in Browser**
   - Simply open `index.html` in your web browser
   - Or visit the live demo: https://ani-pulse.netlify.app/
   - No build process or npm install required

3. **Initial Setup**
   - Choose your theme preference (Light/Dark/System)
   - Customize your username and avatar in Settings
   - Start adding anime to your collection

---

## 📖 Complete Usage Guide

### Dashboard Overview
Your landing page featuring:
1. **Activity Heatmap** - Click on tiles to see your watching patterns
2. **Key Statistics** - Displays top metrics and streaks
3. **Recent Activity** - Scroll to see your latest updates
4. **Top Rated Anime** - Your favorite titles at a glance
5. **Navigation Sidebar** - Access all major features

### Adding & Managing Anime

#### Adding New Anime
1. Click **"+ Add Anime"** button (green button on dashboard)
2. **Search Phase**:
   - Type anime title in the search box
   - Results appear automatically (debounced 400ms)
   - Results show cover, title, type, and episodes
3. **Select and Configure**:
   - Click on your desired anime from results
   - Fill in the form:
     - **Title** - Auto-filled from search (editable)
     - **Type** - TV, Movie, OVA, ONA, Special
     - **Episodes** - Total episodes in series
     - **Duration** - Minutes per episode/movie
     - **Status** - Watching, Completed, Plan to Watch, Dropped
     - **Progress** - Episodes watched
     - **Rating** - Your personal score (0-10)
     - **Score** - Anime's MAL score (0-10)
     - **Genres** - Multiple genres as comma-separated list
     - **Cover** - Image URL or upload
     - **Start/End Dates** - When you watched it
     - **Notes** - Personal observations
4. Click **Submit** to add to collection
5. Confirmation toast notification appears

#### Editing Existing Anime
1. Go to **My Anime** page
2. Locate your anime in the list
3. Click the **Edit** button (pencil icon)
4. Modal opens with current data pre-filled
5. Modify any fields as needed
6. Click **Update** to save changes
7. Success notification confirms update

#### Deleting Anime
1. Open anime for editing (see above)
2. Click **Delete Anime** button (red)
3. Confirm deletion in popup
4. Anime removed from collection

### Tracking Your Progress

#### My Anime Collection
1. **View All** - See your entire collection in table format
2. **Filter by Status**:
   - Use the Status Filter dropdown
   - Choose: Watching, Completed, Plan to Watch, Dropped, or All
3. **Sort Options**:
   - By Title (A-Z)
   - By Date Added
   - By Episodes
   - By Rating
4. **Search Within Collection**:
   - Type in the search box at top
   - Filters results instantly
5. **Update Progress**:
   - Click Edit on any anime
   - Adjust episodes watched
   - Change status if needed
   - Save changes

#### Watchlist Manager
1. Go to **Watch List** section
2. **Browse Anime**:
   - View 30 anime per page
   - Page numbers at bottom allow navigation
3. **Filter Display**:
   - Click status buttons (Watching, Completed, etc.)
   - View only specific statuses
4. **See Progress**:
   - Progress bar shows episodes watched/total
   - Completion percentage displayed
5. **Quick Actions**:
   - Edit or Delete directly from list
   - Instant updates reflected

### Analyzing Statistics

#### Available Charts & Data
1. **Go to My Stats** section
2. **Available Visualizations**:
   - **Monthly Progress** - Line chart of completed anime by month
   - **Genre Breakdown** - Pie chart of your favorite genres
   - **Type Distribution** - Series vs. Movies pie chart
   - **Score Distribution** - Histogram of your ratings
   - **Status Distribution** - Breakdown by current status
   - **Watch Time by Month** - Hours watched trends
   - **Episodes Over Time** - Episode completion trends
   - **Genre Trends** - How genres preference changed over time
3. **Statistics Tables**:
   - Detailed tables with all raw data
   - Monthly summaries
   - Genre comparisons
   - Yearly breakdowns

#### Interpreting Your Data
- **High completion rate** indicates active watching
- **Genre distribution** shows your preferences
- **Score distribution** reveals rating patterns
- **Time trends** show seasonal watching habits
- **Watch time** calculates based on episodes × duration

### Achievements System

#### Unlocking Badges
1. Go to **Achievements** section
2. **View All Badge Categories**:
   - **Marathon Watcher** - Complete anime milestones
   - **Binge Master** - Episodes watched thresholds
   - **Genre Explorer** - Explore diverse genres
   - **Streak Keeper** - Consecutive watching days
   - **Score Collector** - Varied rating achievements
   - **Time Traveler** - Watch from different decades
3. **Check Progress**:
   - Each badge shows current/required count
   - Visual indicator (locked/unlocked)
4. **Achievement Counter** - See total unlocked badges
5. **Next Badges** - Identify what to work toward

#### Tracking Progress
- Add more anime to unlock Marathon Watcher badges
- Watch more episodes for Binge Master badges
- Add anime from different genres for Explorer badges
- Use the app consistently for Streak Keeper badges

### Upcoming Anime & Notifications

#### Discovering Upcoming Anime
1. Go to **Upcoming** section
2. **Browse Categories**:
   - **Trending Now** - Current popular anime
   - **Seasonal Releases** - New shows by season
   - **Upcoming Releases** - Coming soon titles
3. **Add to Watchlist**:
   - Click "Add to Watchlist" button
   - Anime added to your collection
   - Status set to "Plan to Watch"

#### Managing Notifications
1. **Notification Icon** - Bell in top navigation
2. **View Notifications**:
   - Badge shows unread count
   - Click bell to see notification panel
3. **Types of Notifications**:
   - New episodes for watched anime
   - Trending anime updates
   - Seasonal release announcements
4. **Clear Notifications**:
   - Click "Clear" button in notification panel
   - Removes all notifications

### Customizing Your Profile

#### Personal Information
1. Go to **Settings** page
2. **Username**:
   - Edit text field with current name
   - Click outside to auto-save
   - Updates everywhere instantly
3. **Avatar**:
   - **Upload Custom** - Click "Choose Avatar" button
   - **Use Generated** - Pre-filled with UI Avatar service
   - **Reset Default** - Click "Reset Avatar" button
   - Changes apply immediately

#### Theme Preferences
1. In top navigation, click **Theme Toggle** (sun icon)
2. **Cycle Through**:
   - Light theme (bright)
   - Dark theme (dark background)
   - System theme (follows OS)
3. **Persistence** - Choice saves automatically
4. **Affects All Pages** - Theme applies site-wide

#### Data Management
1. **Export Data (Backup)**:
   - Click **"Export Data"** button
   - JSON file downloads automatically
   - Contains entire collection + metadata
   - Save to secure location
   - Great for permanent backup
2. **Import Data (Restore)**:
   - Click **"Import Data"** button
   - Select previously exported JSON file
   - Entire collection restores instantly
   - Overwrites current data (use with caution)
   - Perfect for switching devices

#### Auto-Backup
- System automatically backs up every minute
- Stored in browser's localStorage
- Protects against accidental loss
- Reminder notification if not exported recently

---

## 🛠️ Technologies & Architecture

### Frontend Stack
- **HTML5** - Semantic markup structure
- **CSS3** - Modern styling with CSS variables
  - Flexbox layout system
  - CSS Grid for complex layouts
  - Custom properties for theming
  - Media queries for responsiveness
  - Smooth transitions and animations
- **Vanilla JavaScript (ES6+)** - No frameworks, pure JavaScript
  - ES6 features (arrow functions, destructuring, spread operator)
  - Async/await for API calls
  - DOM manipulation and event handling
  - Local storage management

### Data Visualization
- **Chart.js** - Advanced charting library
  - Line charts (monthly progress)
  - Pie charts (genre/type distribution)
  - Bar charts (genre trends)
  - Matrix charts (activity heatmap)
  - Histogram (score distribution)
- **Chart.js Matrix Plugin** - Heatmap visualization
- **Custom Canvas Drawing** - Additional visualization support

### APIs & External Services
- **Jikan API** - MyAnimeList database
  - Anime search and information
  - Cover images
  - Episode counts
  - Anime metadata
- **UI Avatars API** - Generate profile avatars dynamically
- **Google Fonts** - Typography (Inter, Poppins)
- **Font Awesome 6.4.0** - Icon library

### Icon & Font Libraries
- **Font Awesome** - 1800+ icons via CDN
- **Google Fonts** - Professional typography
  - Inter: Clean, modern font (400-800 weights)
  - Poppins: Friendly, geometric font (300-700 weights)

### Data Storage
- **Browser LocalStorage** - Persistent client-side storage
  - `animeData` - Complete anime collection
  - `activityLog` - User activity history
  - `userProfile` - Username and avatar
  - `theme` - Current theme preference
  - `animeBackup` - Automatic backup
  - `streak` - Watching streak counter
  - `memberSince` - Account creation date
- **No Backend Required** - All data stored locally
- **100% Privacy** - No server-side data storage
- **Automatic Backups** - Every minute to localStorage

### Performance Optimizations
- **Debounced Search** - 400ms delay to reduce API calls
- **Lazy Loading** - Images load on demand
- **Optimized DOM** - Minimal reflows and repaints
- **Efficient Pagination** - 30 items per page
- **Chart Instance Destruction** - Prevents memory leaks
- **Auto-Reload Detection** - HTML checksum comparison
- **Compressed Assets** - Minified CSS and JS

### Browser Compatibility
- **Modern Browsers Only**:
  - Chrome/Chromium (Latest)
  - Firefox (Latest)
  - Safari (Latest 3+ versions)
  - Edge (Latest)
  - Mobile Browsers (Android Chrome, Safari iOS)
- **Requirements**:
  - JavaScript enabled
  - LocalStorage support
  - CSS Grid/Flexbox support
  - Fetch API support
  - ES6 compatibility

### Responsive Architecture
- **Mobile First Approach** - Optimized for small screens
- **Breakpoints**:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
  - Large Desktop: > 1920px
- **Touch-Friendly UI** - Large buttons and tap targets on mobile
- **Adaptive Navigation** - Sidebar collapses on mobile
- **Flexible Layouts** - Grid and flex layouts adapt
- **Responsive Images** - Images scale appropriately

---

## 📊 Data Management

### Anime Object Structure
```javascript
{
  // Identification
  id: "unique_id_timestamp",
  
  // Basic Information
  title: "Anime Title",
  type: "TV",  // TV, Movie, OVA, ONA, Special
  cover: "image_url",
  
  // Episode Information
  episodes: 12,
  progress: 6,
  duration: 20,  // minutes
  
  // Ratings & Status
  rating: 8.5,  // User's personal rating (0-10)
  score: 7.8,   // MAL Score (0-10)
  status: "Watching",  // Watching, Completed, Plan to Watch, Dropped
  userStatus: "Watching",  // Mapped internal status
  
  // Content Details
  genres: ["Action", "Adventure", "School"],
  
  // Tracking Dates
  startDate: "2024-01-01",
  finishDate: null,  // When completed
  dateAdded: "2024-01-01",  // When added to collection
  
  // User Notes
  notes: "Great series with amazing characters!"
}
```

### LocalStorage Keys
```javascript
{
  animeData: [],          // Array of anime objects
  activityLog: [],        // Array of activity records
  userProfile: {          // User customization
    name: "AnimeFan92",
    avatar: "image_url"
  },
  theme: "dark",          // 'light', 'dark', or 'system'
  animeBackup: [],        // Backup copy of collection
  streak: 0,              // Current watching streak days
  memberSince: "2024-01-01",  // Account creation date
  lastBackup: "timestamp" // Last export date
}
```

### Activity Log Structure
```javascript
{
  id: "unique_id",
  action: "added",        // added, updated, deleted, completed
  animeTitle: "Title",
  timestamp: 1704067200000,
  details: "Additional information about the action"
}
```

### Achievement Data Structure
```javascript
{
  id: "marathon-watcher-10",
  category: "Marathon Watcher",
  title: "Anime Adventurer",
  description: "Complete 10 anime",
  requirement: 10,
  badge: "🏅",
  unlocked: false,
  progress: 3
}
```

### Data Flow Architecture
```
User Input → Form Validation → LocalStorage → DOM Update → UI Render
   ↑                                  ↓
   └──────── Real-time Updates ←──────┘

External APIs:
  ├─ Jikan API: Anime search and metadata
  └─ UI Avatars API: Dynamic avatar generation

Statistics Calculation:
  animeData → Process → Generate Charts → Display Visuals
  
Notifications:
  Watched Anime → Check New Episodes → Generate Notification → Display
```

---

## 💾 Backup & Data Management System

### Automatic Backup
- **Frequency**: Every minute (automatic background process)
- **Location**: Browser's localStorage
- **Content**: Complete anime collection + metadata
- **Recovery**: One-click restoration if data is lost
- **Backup Key**: `animeBackup` in localStorage
- **No Cloud Needed**: All stored locally for privacy

### Manual Backup (Export)
1. Navigate to **Settings** page
2. Click **"Export Data"** button
3. Action flows:
   - Converts entire collection to JSON
   - Generates filename: `anime_backup_[date].json`
   - Downloads to your computer automatically
   - Success notification appears
4. **File Contents**:
   - All anime entries
   - Complete metadata
   - User profile info
   - Settings preferences
   - Activity log
5. **Best Practices**:
   - Export after adding significant anime
   - Keep backups in cloud storage (Google Drive, Dropbox)
   - Export before major browser updates
   - Archive multiple backups over time

### Data Restoration (Import)
1. Navigate to **Settings** page
2. Click **"Import Data"** button
3. **Import Modal Opens**:
   - File upload field appears
   - Select previously exported JSON file
   - Click "Import Data" button
4. **Restoration Process**:
   - Validates JSON file format
   - Parses anime collection
   - Overwrites current data (be careful!)
   - Updates all UI elements
   - Success notification
5. **After Import**:
   - New data immediately visible
   - All statistics recalculated
   - Charts update with restored data
   - Achievements recalculated

### Data Privacy
- **100% Local Storage** - No data sent to servers
- **No Accounts** - Start using immediately
- **No Tracking** - Complete privacy
- **Browser-Based** - Data stays on your device
- **No Ads** - Clean, distraction-free interface

### Backup Recovery Scenarios
- **Browser Crash** - Restore from auto-backup
- **Device Change** - Export and import on new device
- **Accidental Deletion** - Restore from manual backup
- **Data Corruption** - Previous backup copies available

### Storage Limits
- **LocalStorage Limit**: Typically 5-10MB per domain
- **Typical Usage**: 50-100 anime ≈ 500KB
- **Maximum Anime**: ~10,000+ entries possible
- **Not Limiting** - Unlikely to reach limits with normal use

---

## 🎨 Customization

### Themes
- **Dark Theme** - Default, easy on eyes for night watching
- **Light Theme** - Clean, bright interface
- **System Theme** - Follows your system preference

### Profile Personalization
- Set custom username
- Upload custom avatar
- Track join date
- View personal statistics

---

## 📱 Browser Compatibility

| Browser | Support | Version |
|---------|---------|---------|
| Chrome | ✅ Full | Latest |
| Firefox | ✅ Full | Latest |
| Safari | ✅ Full | Latest 3+ |
| Edge | ✅ Full | Latest |
| Mobile Browsers | ✅ Full | Latest |

---

## 🎯 Roadmap

- [ ] Multiple device sync
- [ ] Social sharing features
- [ ] Advanced recommendation engine
- [ ] Custom genre creation
- [ ] Watching time predictions
- [ ] Community features
- [ ] Watchlist sharing
- [ ] Advanced filtering options

---

## 🐛 Known Issues

None currently reported. Please report any bugs on GitHub!

---

## 📝 Project Structure

```
AniPulse/
├── index.html          # Main HTML structure
├── Js/                 # JavaScript source files
│   ├── main.js         # Core application logic
│   └── extras.js       # Additional features & utilities
├── Css/                # Styling files
│   ├── style.css       # Main styling
│   └── responsive.css  # Mobile responsive styles
├── autopush.ps1        # Git automation script
└── README.md           # This file
```

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Yaman Jr**
- GitHub: [@yamanjr10](https://github.com/yamanjr10)
- Live Demo: [AniPulse](https://ani-pulse.netlify.app/)

---

## 🙏 Acknowledgments

- **Jikan API** - For the comprehensive anime database
- **Chart.js** - For beautiful data visualizations
- **Font Awesome** - For amazing icons
- **MyAnimeList** - For anime information

---

## 💬 Support

Have questions or suggestions? Feel free to:
- Open an issue on GitHub
- Check the FAQ section
- Review the documentation

---

## � Show Your Support

If you find AniPulse helpful, please consider:
- ⭐ Starring the repository
- 📢 Sharing with other anime enthusiasts
- 🐛 Reporting bugs and suggesting features
- 💻 Contributing to the project

---

## 🎊 Quick Stats

- **Total Anime Supported**: Thousands (via Jikan API)
- **Storage**: All local - 100% private
- **File Size**: ~500KB (optimized)
- **Load Time**: <1 second
- **Mobile Support**: Fully responsive

---

**Happy Tracking! 🎬✨**

*Made with ❤️ for anime enthusiasts everywhere*

---

<div align="center">

**[🌐 Visit Live Demo](https://ani-pulse.netlify.app/)**

</div>
