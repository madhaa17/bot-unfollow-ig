# 🤖 Instagram Unfollow Automation Bot

A smart Instagram automation tool that helps you unfollow non-mutual accounts (accounts that don't follow you back) while preserving mutual connections.

## ✨ Features

- 🎯 **Smart Unfollow**: Only unfollows accounts that don't follow you back
- 🔄 **Session Persistence**: Saves login sessions to avoid repeated logins
- 📊 **Complete Analysis**: Extracts full followers and following lists
- 🛡️ **Safe Limits**: Respects rate limits with configurable processing limits
- 🔍 **Progress Tracking**: Saves already processed accounts to resume later
- 📱 **Modern UI**: Clean Electron-based desktop interface
- ⚡ **Fast Performance**: Direct profile approach bypasses modal scrolling issues
- 🌍 **Multi-language**: Supports English and Indonesian interface
- 🔵 **Verified Account Protection**: Automatically skips verified accounts (blue checkmark)
- 🧹 **Clean Logging**: Filters out harmless errors for cleaner output
- 🔄 **Dynamic Scrolling**: Adapts to Instagram's lazy loading without fixed limits
- 📈 **Performance Optimization**: Cached data extraction and efficient processing
- 🛠️ **Robust Error Handling**: Retry mechanisms and graceful error recovery

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Instagram account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/bot-unfollow-ig.git
   cd bot-unfollow-ig
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

### Usage

1. Launch the application
2. Enter your Instagram credentials
3. Set the number of accounts to unfollow
4. Click "Start Bot"
5. Monitor progress in real-time

## 🛡️ Safety Features

- **Mutual Protection**: Never unfollows accounts that follow you back
- **Verified Account Protection**: Automatically skips verified accounts (blue checkmark)
- **Rate Limiting**: Built-in delays to avoid Instagram detection
- **Session Management**: Secure session storage
- **Error Handling**: Robust error recovery with retry mechanisms
- **Resume Capability**: Can continue from where it left off
- **Smart Detection**: Advanced algorithms to detect account verification status

## 📋 How It Works

1. **Authentication**: Logs into Instagram using your credentials
2. **Data Collection**: Extracts complete followers and following lists with dynamic scrolling
3. **Analysis**: Compares lists to identify non-mutual accounts
4. **Verified Account Detection**: Automatically detects and skips verified accounts
5. **Smart Unfollow**: Visits each non-mutual account's profile directly
6. **Confirmation**: Handles unfollow confirmations automatically
7. **Progress Saving**: Tracks processed accounts for future runs

## 🔧 Advanced Features

### 🔵 Verified Account Protection

- **Automatic Detection**: Uses multiple detection methods to identify verified accounts
- **Blue Checkmark Recognition**: Detects Instagram's official verification badges
- **Text Analysis**: Scans for verification-related text and emojis
- **Safe Skipping**: Never attempts to unfollow verified accounts
- **Detailed Reporting**: Shows which verified accounts were skipped

### 🧹 Clean Logging System

- **Smart Filtering**: Automatically filters out harmless errors
- **Facebook Error Suppression**: Hides common Facebook/Instagram internal errors
- **Focus on Important**: Only shows errors that actually matter
- **Clean Output**: Much cleaner and more readable logs
- **Debug Mode**: Can be enabled for detailed debugging when needed

### 🔄 Dynamic Scrolling Technology

- **No Fixed Limits**: Adapts to Instagram's lazy loading system
- **End Detection**: Automatically detects when no more content is available
- **Efficient Processing**: Optimized scroll amounts and timing
- **Large List Support**: Handles accounts with 4000+ followers/following
- **Progress Tracking**: Real-time progress updates during extraction

### 📈 Performance Optimization

- **Cached Data**: Reuses previously extracted data when available
- **Efficient Algorithms**: Optimized data processing and comparison
- **Memory Management**: Smart memory usage for large datasets
- **Speed Improvements**: Faster processing with reduced wait times
- **Resource Optimization**: Minimal system resource usage

## ⚙️ Configuration

The bot automatically configures itself, but you can modify:

- Processing limits
- Delay timings
- Session storage location
- User agent strings

## 📊 Statistics

After each run, you'll get detailed statistics:

- **Total followers collected**: Complete count of your followers
- **Total following collected**: Complete count of accounts you follow
- **Non-mutual accounts found**: Accounts that don't follow you back
- **Accounts processed**: Number of accounts checked during the run
- **Accounts successfully unfollowed**: Number of accounts actually unfollowed
- **Verified accounts skipped**: Number of verified accounts automatically skipped
- **Completion rate**: Percentage of data successfully extracted
- **Processing time**: Total time taken for the operation
- **Extraction efficiency**: Users extracted per scroll attempt

## 🔧 Technical Details

- **Framework**: Electron + Node.js
- **Automation**: Puppeteer for browser control
- **UI**: HTML/CSS/JavaScript
- **Storage**: JSON files for session data
- **Platform**: Cross-platform (Windows, macOS, Linux)

## 📝 Development

### Project Structure

```
folder structure:
├── app.js           # Main bot logic
├── main.js          # Electron main process
├── index.html       # UI interface
├── render.js        # Frontend logic
├── preload.js       # Electron bridge
├── package.json     # Dependencies
└── sessions/        # User session data (ignored)
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## ⚠️ Disclaimer

This tool is for educational purposes only. Users are responsible for:

- Following Instagram's Terms of Service
- Using the tool responsibly and ethically
- Understanding the risks of automation
- Respecting rate limits and guidelines

**Note**: Instagram actively discourages automation. Use at your own risk.

## 🔒 Privacy & Security

- **No Data Collection**: This tool does not collect or transmit your data
- **Local Storage**: All session data is stored locally on your device
- **Open Source**: Full source code is available for inspection
- **No Tracking**: No analytics or tracking mechanisms

## 📋 Requirements

- Instagram account
- Stable internet connection
- Modern browser engine (Chromium-based)

## 🐛 Known Issues

- Instagram's UI changes may affect functionality
- Rate limiting may slow down large operations
- Some private accounts may not be accessible

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Error: `net::ERR_ABORTED`

- **Status**: ✅ **FIXED** - This error has been resolved with improved error handling
- **Solution**: The bot now includes retry mechanisms and better navigation handling
- **What to do**: If you still see this error, the bot will automatically retry

#### Error: `net::ERR_NAME_NOT_RESOLVED`

- **Status**: ✅ **FILTERED** - This error is now filtered out as it's harmless
- **Solution**: These errors are automatically suppressed in the logs
- **What to do**: No action needed, the bot continues working normally

#### Error: `DTSG response is not valid`

- **Status**: ✅ **FILTERED** - This is a normal Facebook internal error
- **Solution**: These errors are automatically filtered out
- **What to do**: No action needed, the bot continues working normally

#### Verified Accounts Not Being Skipped

- **Status**: ✅ **FIXED** - Verified account detection has been improved
- **Solution**: The bot now uses multiple detection methods
- **What to do**: Verified accounts should now be automatically skipped

#### Large Lists (4000+ users) Not Working

- **Status**: ✅ **FIXED** - Dynamic scrolling now handles large lists
- **Solution**: The bot now adapts to Instagram's lazy loading system
- **What to do**: Large lists should now work without issues

### Performance Issues

#### Slow Processing

- **Solution**: The bot now includes performance optimizations
- **Features**: Cached data, efficient algorithms, reduced wait times
- **Result**: Much faster processing, especially for large lists

#### Memory Usage

- **Solution**: Smart memory management implemented
- **Features**: Efficient data processing, optimized resource usage
- **Result**: Lower memory footprint, better stability

## 📝 Changelog

### Version 2.0.0 - Major Update

#### ✨ New Features

- **🔵 Verified Account Protection**: Automatically skips verified accounts (blue checkmark)
- **🧹 Clean Logging System**: Filters out harmless errors for cleaner output
- **🔄 Dynamic Scrolling**: Adapts to Instagram's lazy loading without fixed limits
- **📈 Performance Optimization**: Cached data extraction and efficient processing
- **🛠️ Robust Error Handling**: Retry mechanisms and graceful error recovery

#### 🐛 Bug Fixes

- **Fixed**: `net::ERR_ABORTED` error with improved navigation handling
- **Fixed**: Verified accounts not being skipped
- **Fixed**: Large lists (4000+ users) not working properly
- **Fixed**: Console error spam with smart filtering
- **Fixed**: Memory usage issues with large datasets

#### ⚡ Performance Improvements

- **Faster**: Reduced wait times and optimized algorithms
- **Efficient**: Cached data extraction for repeated runs
- **Stable**: Better error handling and retry mechanisms
- **Clean**: Filtered error logs for better user experience

#### 🔧 Technical Improvements

- **Dynamic Scrolling**: No more fixed scroll limits
- **Smart Detection**: Multiple methods for verified account detection
- **Error Filtering**: Comprehensive filtering of harmless errors
- **Memory Management**: Optimized resource usage
- **Session Management**: Improved session handling and cleanup

## 📞 Support

- Open an issue for bug reports
- Check existing issues before creating new ones
- Provide detailed information for better assistance

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Puppeteer team for browser automation tools
- Electron team for cross-platform desktop framework
- Instagram for providing the platform (please follow their ToS!)

---

**⚠️ Legal Notice**: This tool is provided as-is for educational purposes. The authors are not responsible for any consequences of its use. Always comply with Instagram's Terms of Service and applicable laws.

**🔥 Star this repository if you find it useful!**
