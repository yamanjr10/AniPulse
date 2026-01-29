# 💖 AniPulse - Anime Tracker & Stats Dashboard

![AniPulse](https://img.shields.io/badge/Version-1.0.3-blueviolet?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Platform](https://img.shields.io/badge/Platform-Web-orange?style=flat-square)

> **The Ultimate Anime Tracking Experience** 🚀
> 
> AniPulse is a modern, feature-rich anime tracker that helps you manage your watchlist, track progress, analyze statistics, and celebrate your anime journey. Built with vanilla JavaScript and a sleek UI.

🌐 **[Live Demo](https://yamanjr10.github.io/AniPulse/)**

---

## ✨ Key Features

### 📊 Dashboard
- **Activity Heatmap** - Visualize your anime-watching patterns
- **Real-time Stats** - Total episodes, hours watched, current streak tracking
- **Greeting Banner** - Dynamic greetings based on time of day with daily quotes
- **Top Rated Anime** - Quick view of your highest-rated titles
- **Recent Activity Feed** - Track all your updates and changes

### 📝 My Anime
- **Complete Watchlist** - Add, edit, and manage your entire collection
- **Status Tracking** - Mark anime as Watching, Completed, Plan to Watch, or Dropped
- **Filter & Search** - Filter by status, genre, score, and more
- **Detailed Info** - Store ratings, progress, genres, cover images, and notes
- **Table View** - Clean, sortable interface for your collection

### 📺 Watchlist Manager
- **Paginated Display** - 30 anime per page for smooth browsing
- **Multi-status Filter** - View specific statuses or all at once
- **Progress Tracking** - Monitor episodes watched vs. total
- **Quick Actions** - Edit and delete directly from the list

### 📈 Statistics
- **Monthly Progress Charts** - Track completed anime by month
- **Genre Distribution** - Analyze your favorite genres
- **Completion Rate** - Yearly and monthly completion statistics
- **Score Distribution** - Visual breakdown of your ratings
- **Watch Time Analytics** - Hours watched by month and genre
- **Type Distribution** - Series vs. Movies analysis
- **Comprehensive Insights** - Detailed breakdowns of your viewing habits

### 🏆 Achievement System
- **Milestone Unlocks** - Earn badges as you progress
- **Achievement Categories**:
  - Marathon Watcher (completion milestones)
  - Binge Master (episodes watched)
  - Genre Explorer (diverse viewing)
  - Streak Keeper (consistency rewards)
  - Score Collector (rating achievements)
  - Time Traveler (watching across decades)

### 🆕 Upcoming Anime
- **Trending Shows** - Stay updated with what's hot
- **Seasonal Releases** - Discover anime by season
- **Update Notifications** - Get alerts for new episodes of your watched anime
- **One-Click Tracking** - Add upcoming anime to your watchlist instantly

### ⚙️ Advanced Features
- **Dark/Light Theme** - Toggle between themes (system-aware)
- **User Profile** - Customize username and avatar
- **Auto-Backup System** - Automatic data backup every minute
- **Import/Export** - Backup and restore your entire collection as JSON
- **Local Storage** - All data stored securely in your browser
- **Real-time Search** - Search anime from Jikan API (anime database)
- **Member Since Tracking** - Track your profile creation date
- **12-Slide Recap System** - Comprehensive monthly and yearly recaps with detailed analytics

### 🎨 UI/UX
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Smooth Animations** - Polished transitions and hover effects
- **Dark Theme** - Easy on the eyes for late-night watching
- **Accessibility** - Clean, intuitive interface
- **Toast Notifications** - Real-time feedback for all actions
- **Modal System** - Clean dialogs for add/edit operations

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No installation required - runs entirely in the browser

### Installation

1. **Clone or Download**
   ```bash
   git clone https://github.com/yamanjr10/AniPulse.git
   cd AniPulse
   ```

2. **Open in Browser**
   - Simply open `index.html` in your web browser
   - Or visit the live demo: https://yamanjr10.github.io/AniPulse/

3. **Start Tracking**
   - Add your first anime using the "Add Anime" button
   - Search from our integrated anime database
   - Customize your profile in settings

---

## 📖 How to Use

### Adding Anime
1. Click the **"+ Add Anime"** button on the dashboard
2. Search for an anime by title using the Jikan API
3. Select your anime from search results
4. Fill in details:
   - Status (Watching, Completed, Plan to Watch, Dropped)
   - Episodes watched
   - Your personal rating (0-10)
   - Genres
   - Notes
5. Click **Submit** to add to your collection

### Tracking Progress
- Use the **My Anime** page to view your collection
- Edit any anime to update progress and status
- Track episodes watched in real-time
- Monitor your completion percentage

### Viewing Statistics
- Navigate to **Statistics** to see detailed charts
- View monthly progress, genre trends, and yearly completions
- Analyze your watching patterns
- Compare performance across months and years

### Managing Your Profile
- Go to **Settings** to customize:
  - Username
  - Avatar
  - Theme preference (light/dark/system)
- Download your data (JSON)
- Restore from previous backup

### Checking Achievements
- Visit the **Achievements** page to track your progress
- Unlock badges as you hit milestones
- See detailed progress for each achievement
- Challenge yourself to earn them all!

### Upcoming & Notifications
- Check **Upcoming** to discover new anime
- Get notified when your watched anime has new episodes
- Quickly add trending shows to your watchlist
- Stay updated with seasonal releases

---

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Charts**: Chart.js with matrix chart support
- **APIs**: Jikan API (MyAnimeList database)
- **Icons**: Font Awesome 6.4.0
- **Fonts**: Inter, Poppins (Google Fonts)
- **Storage**: LocalStorage (browser-based)
- **Responsive**: CSS Media Queries

---

## 📊 Data Structure

### Anime Object
```javascript
{
  id: "unique_id",
  title: "Anime Title",
  type: "TV/Movie",
  episodes: 12,
  progress: 6,
  rating: 8.5,
  score: 9,
  status: "Watching",
  genres: ["Action", "Adventure"],
  cover: "image_url",
  startDate: "2024-01-01",
  finishDate: "2024-03-15",
  notes: "Great series!"
}
```

### Local Storage Keys
- `animeData` - Your complete anime collection
- `activityLog` - Activity history
- `userProfile` - Username and avatar
- `theme` - Current theme preference
- `animeBackup` - Automatic backup
- `streak` - Current watching streak

---

## 💾 Backup & Data Management

### Auto-Backup
- Automatic backup runs every minute
- Data stored securely in localStorage
- No cloud required - complete privacy

### Manual Backup
1. Go to **Settings**
2. Click **"Export Data"**
3. JSON file downloads automatically

### Restore Data
1. Go to **Settings**
2. Click **"Import Data"**
3. Select your backup JSON file
4. Your data is restored instantly

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
├── main.js             # Core application logic
├── extras.js           # Additional features & utilities
├── style.css           # Main styling
├── responsive.css      # Mobile responsive styles
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
- Live Demo: [AniPulse](https://yamanjr10.github.io/AniPulse/)

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

**[🌐 Visit Live Demo](https://yamanjr10.github.io/AniPulse/)**

</div>
