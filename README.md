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
- **Rate Limiting**: Built-in delays to avoid Instagram detection
- **Session Management**: Secure session storage
- **Error Handling**: Robust error recovery
- **Resume Capability**: Can continue from where it left off

## 📋 How It Works

1. **Authentication**: Logs into Instagram using your credentials
2. **Data Collection**: Extracts complete followers and following lists
3. **Analysis**: Compares lists to identify non-mutual accounts
4. **Smart Unfollow**: Visits each non-mutual account's profile directly
5. **Confirmation**: Handles unfollow confirmations automatically
6. **Progress Saving**: Tracks processed accounts for future runs

## ⚙️ Configuration

The bot automatically configures itself, but you can modify:

- Processing limits
- Delay timings
- Session storage location
- User agent strings

## 📊 Statistics

After each run, you'll get detailed statistics:

- Total followers collected
- Total following collected
- Non-mutual accounts found
- Accounts processed
- Accounts successfully unfollowed

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
