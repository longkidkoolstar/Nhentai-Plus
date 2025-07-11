# Nhentai Plus+  

**Script Name**: Nhentai Plus+  

[**Namespace**: github.com/longkidkoolstar](https://github.com/longkidkoolstar)  

**Version**: 9.0.0

**Description**: Enhances the functionality of the Nhentai website.  

**Author**: longkidkoolstar  

**License**: None  

---  

### Features  

- **Open in New Tab**: Added a button for covers that allows users to open manga links in a new tab.  
- **Find Similar Button**: Adds a "Find Similar" button next to the download button on manga pages to find similar hentai based on tags.  
- **Tag Locking**: Allows users to lock tags to be included in the "Find Similar" search.  
- **Random Tag Preferences**: When clicking the random button to find random hentais, users can choose specific tags they want the random hentais to include.  
- **English Filter**: Adds "English Only" filter links to various pages to easily find English content.  
- **Auto Login**: Automatically logs in users using stored credentials.  
- **Settings Page**: Adds a settings page to enable/disable features, update login credentials, and manage random tag preferences.  
- **Alternative Versions**: Adds support for finding and displaying alternative versions of the manga you are on.  
- **Bookmarking Pages**: Allows users to bookmark entire pages for later viewing.  
- **Month Filter**: Adds "Month Only" filter links to various pages to easily find content from a specific month.  
- **Manga Bookmarking**: Introduces a full bookmarking system for individual manga with multiple display options.  
- **Must Add Tags**: Allows users to define tags that will always be added to their search queries.
- **Offline Favoriting**: Allows users to favorite manga offline and sync when logged in.
- **Bookmarks as Related**: Replaces the "Related Manga" section with content from user's bookmarks.
- **Mark as Read System** *(New in v9.0!)*: Complete reading tracking system with one-click mark/unmark buttons on gallery thumbnails.
- **Read Manga Page** *(New in v9.0!)*: Dedicated page to view and manage all read manga with responsive grid layout.
- **Auto-Mark on Last Page** *(New in v9.0!)*: Automatically marks galleries as read when reaching the final page.
- **Enhanced Opacity System** *(New in v9.0!)*: Configurable fade levels for read galleries and non-English content.
- **Gallery Data Caching** *(New in v9.0!)*: Automatic caching of cover images, titles, and metadata for read manga.
- **Online Data Sync** *(New in v8.0!)*: Comprehensive cloud synchronization system for bookmarks, favorites, and settings across devices.
- **Public Sync** *(New in v8.0!)*: Use predefined JSONStorage.net API with standard security for easy data syncing.
- **Private Sync** *(New in v8.0!)*: Use your own JSONStorage.net credentials for enhanced security and private data storage.
- **UUID System** *(New in v8.0!)*: Unique 5-character identifier for each user with edit and regeneration capabilities.
- **Multi-User Support** *(New in v8.0!)*: Multiple users can safely store data in the same cloud storage without conflicts.
- **Browse Users** *(New in v8.0!)*: View and switch between available user data in private storage.
- **Advanced Storage Management**: Offers options to clear, export, or import bookmarks and settings for backup and sync.
- **Page & Tab Arrangement**: Lets users customize how bookmarks and manga are displayed, including grid/list view and tab sorting.
- **Bookmarks Page Arrangement**: Provides sorting and filtering options for bookmarks, such as by date, title, or custom order.
- **Max Manga per Bookmark Slider**: Allows users to set the maximum number of manga displayed per bookmark group.
- **Detailed Random Hentai Preferences**: Enables fine-tuning of random hentai results, including tag inclusion/exclusion and language preferences.
- **Tooltips Toggle**: Option to enable or disable tooltips for buttons and features for a cleaner interface.

---  

### Usage  

1. **Open in New Tab**: Click the new button on covers to open manga links in a new tab.  
2. **Find Similar Button**: Click the "Find Similar" button to initiate a search based on tags. Adjust the maximum number of tags to select using the slider.  
3. **Tag Locking**: Click the plus/minus icon next to a tag to lock/unlock it for searches.  
4. **Random Tag Preferences**: Configure your random tag preferences in the settings page to choose specific tags for random hentais.  
5. **English Filter**: Use the "English Only" links on various pages to filter content.  
6. **Auto Login**: Enter your email and password in the settings to enable auto-login.  
7. **Manga Bookmarking**:  
   - Bookmark any manga with a single click.  
   - Choose between different display options (cover, title, or both).  
   - Access a dedicated bookmarks page with a dynamic grid layout, search functionality, and enhanced styling.  
   - Enable/disable the bookmarking feature in the settings.  
   - Use advanced storage management to clear, export, or import bookmarks and settings.  
   - Arrange bookmarks page by sorting/filtering (date, title, custom order).  
   - Adjust the max manga per bookmark group with the slider.  
   - Customize page and tab arrangement (grid/list, tab sorting).  
8. **Month Filter**: Use the "Month" links on various pages to filter content by month.  
9. **Offline Favoriting**:  
   - Favorite manga while offline.  
   - Sync favorites when logged in.
10. **Bookmarks as Related**:
    - View your bookmarked content instead of the default related manga section.
    - Customize display settings in the settings page.
11. **Must Add Tags**:
    - Configure tags in the settings page that will always be appended to your search queries.
12. **Mark as Read System** *(New in v9.0!)*:
    - **Mark/Unmark Galleries**: Click the circular button on gallery thumbnails to mark as read or unread.
    - **Auto-Mark on Last Page**: Automatically marks galleries as read when you reach the final page.
    - **Visual Feedback**: Read galleries are visually distinguished with opacity changes and READ badges.
    - **Configurable Opacity**: Adjust fade levels for read galleries and non-English content in settings.
13. **Read Manga Page** *(New in v9.0!)*:
    - **Dedicated Page**: Access all your read manga from the navigation menu.
    - **Responsive Grid**: Mobile-optimized layout that adapts to all screen sizes.
    - **Management Tools**: Clear all read manga, remove individual items, and sort options.
    - **Gallery Information**: View cached cover images, titles, and metadata.
    - **Remove from List**: Easy removal of individual galleries from your read list.
14. **Online Data Sync** *(New in v8.0!)*:
    - **Public Sync**: Enable public sync for standard security cloud storage using predefined JSONStorage.net API.
    - **Private Sync**: Configure your own JSONStorage.net URL and API key for enhanced security.
    - **UUID Management**: View, edit, or regenerate your unique 5-character user identifier.
    - **Multi-User Support**: Multiple users can safely store data without overwriting each other.
    - **Browse Users**: View all available user data in private storage and switch between different user profiles.
    - **Auto-Save**: Private storage credentials are automatically saved and persist across sessions.
    - **Cross-Device Sync**: Access your bookmarks, favorites, and settings from any device.
    - **Version Tracking**: Each sync includes userscript version information for compatibility.

---  

### Future Updates  

- **Request New Features in the Feedback Section!**  

---  

### Changelog  

**Note**: If the script isn't executing (e.g., for older devices), try using stable: [Ver. 7.5](https://greasyfork.org/en/scripts/498553-nhentai-plus?version=1562827)

#### Version 9.0.0 *(Latest)*

- **🆕 MAJOR**: **Mark as Read System** - Complete reading tracking system with visual feedback and one-click mark/unmark buttons.
- **📖 NEW**: **Read Manga Page** - Dedicated page to view and manage all read manga with responsive grid layout.
- **🔘 NEW**: **Mark as Read Buttons** - One-click buttons on gallery thumbnails to mark/unmark as read.
- **⚡ NEW**: **Auto-Mark on Last Page** - Automatically marks galleries as read when reaching the final page.
- **🎨 NEW**: **Enhanced Opacity System** - Configurable fade levels for read and non-English galleries.
- **📱 NEW**: **Mobile-Responsive Design** - Optimized grid layout for all device sizes on read manga page.
- **🗂️ NEW**: **Read Manga Management** - Clear all, remove individual items, and sorting options.
- **💾 NEW**: **Gallery Data Caching** - Automatic caching of cover images, titles, and metadata.
- **🔄 NEW**: **Smart Cover Fetching** - Auto-fetches cover images from first page for auto-marked galleries.
- **🎯 NEW**: **Visual Read Indicators** - Clear visual feedback with READ badges and opacity changes.
- **⚙️ NEW**: **Configurable Settings** - Separate controls for mark-as-read system and read manga page.
- **🔧 NEW**: **Enhanced Integration** - Seamless integration with existing bookmark and sync systems.
- **📊 NEW**: **Read Statistics** - Track and display total count of read manga.
- **🎨 IMPROVEMENT**: Enhanced UI/UX with modern styling, smooth animations and transitions.
- **📱 IMPROVEMENT**: Cross-device compatibility works seamlessly across desktop and mobile.
- **⚡ PERFORMANCE**: Optimized rendering with efficient gallery processing and display.

#### Version 8.0.0

- **🆕 MAJOR**: Introduced **Online Data Sync** - Complete cloud synchronization system for bookmarks, favorites, and settings.
- **🔒 NEW**: **Public Sync** - Use predefined JSONStorage.net API with standard security level.
- **🔐 NEW**: **Private Sync** - Use your own JSONStorage.net credentials for enhanced security.
- **🆔 NEW**: **UUID System** - Unique 5-character identifier for each user with edit/regenerate capabilities.
- **👥 NEW**: **Multi-User Support** - Multiple users can safely store data in same cloud storage.
- **🔍 NEW**: **Browse Users** - View and switch between available user data in private storage.
- **💾 NEW**: **Auto-Save Credentials** - Private storage credentials saved automatically and persist.
- **📱 NEW**: **Cross-Device Sync** - Access your data from any device with internet connection.
- **📊 NEW**: **Version Tracking** - Each sync includes userscript version for compatibility.
- **🔧 FIX**: UUID editing now properly updates Tampermonkey storage for immediate effect.
- **🎨 FIX**: Private sync credentials properly hidden when sync is disabled.
- **⚡ IMPROVEMENT**: Instant UUID updates - changes take effect immediately without page refresh.

#### Version 7.0

- Introduced **Offline Favoriting** to allow users to favorite manga offline and sync when logged in.
- Improved performance and fixed minor bugs.

#### Version 6.0  

- Introduced Manga Bookmarking with multiple display options.  
- Added settings to customize bookmark display (cover, title, or both).  
- Implemented dynamic bookmarks grid with search functionality.  
- Enhanced bookmarks page with improved layout and styling.  
- Added caching mechanism for manga information retrieval.  
- Included option to enable/disable the manga bookmarking button.  
- Added Month Filter to filter content by month.  

#### Version 5.0  

- Added **Open in New Tab** feature with a new button for covers.    

#### Version 4.0  

- Added **Random Tag Preferences** to allow users to select specific tags for random hentais.  

#### Version 3.0  

- Added features for **Alternative Versions** and **Bookmarking Pages**.  

#### Version 2.0  

- Improved **Tag Locking** and added **English Filter** links.  

#### Version 1.0  

- Initial release with **Find Similar Button**, **Tag Locking**, **Auto Login**, and **Settings Page**.  


### Advanced Customization & Tips

- **Tooltips Toggle**: Enable or disable tooltips for a cleaner interface.
- **Advanced Storage Management**: Use the settings page to clear, export, or import your bookmarks and preferences for backup or sync.
- **Page & Tab Arrangement**: Customize how bookmarks and manga are displayed, including grid/list view and tab sorting.
- **Bookmarks Page Arrangement**: Sort and filter bookmarks by date, title, or custom order for easier access.
- **Max Manga per Bookmark Slider**: Adjust how many manga appear in each bookmark group.
- **Detailed Random Hentai Preferences**: Fine-tune random results with tag and language options.
- **Mark as Read System Setup** *(New in v9.0!)*:
  - **Enable/Disable**: Toggle the mark as read system and read manga page independently in settings.
  - **Auto-Mark Settings**: Configure automatic marking when reaching the last page of a gallery.
  - **Opacity Controls**: Adjust fade levels for read galleries (0.1 = very faded, 1.0 = normal).
  - **Visual Feedback**: Customize how read galleries appear with configurable opacity settings.
  - **Mobile Optimization**: Read manga page automatically adapts to mobile devices with responsive grid.
  - **Data Management**: Use "Clear All" to reset your read list or remove individual items as needed.
- **Online Data Sync Setup**:
  - **Public Sync**: Simply enable the checkbox for instant cloud sync with standard security.
  - **Private Sync**: Enter your own JSONStorage.net URL and API key for maximum security and control.
  - **UUID Management**: Keep your UUID safe - it's your key to accessing your cloud data.
  - **Multi-Device Usage**: Use the same UUID across devices to access the same data everywhere.
  - **Data Recovery**: If you accidentally regenerate your UUID, use "Browse Users" to find and switch back to your original data.
  - **Backup Strategy**: Consider using both public and private sync for redundancy, or export your data regularly.