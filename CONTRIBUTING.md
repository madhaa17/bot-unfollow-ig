# Contributing to Instagram Unfollow Bot

Thank you for your interest in contributing to this project! 🎉

## 🤝 How to Contribute

### Reporting Bugs

1. **Check existing issues** first to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Provide detailed information**:
   - Operating system and version
   - Node.js version
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Screenshots if applicable

### Suggesting Features

1. **Open an issue** with the "feature request" label
2. **Describe the feature** in detail
3. **Explain the use case** and benefits
4. **Consider implementation complexity**

### Code Contributions

#### Before You Start

1. **Fork the repository**
2. **Clone your fork** locally
3. **Create a new branch** for your feature/fix
4. **Install dependencies**: `npm install`

#### Development Process

1. **Make your changes**

   - Follow existing code style
   - Add comments for complex logic
   - Test your changes thoroughly

2. **Test thoroughly**

   - Test on different operating systems if possible
   - Verify Instagram compatibility
   - Check edge cases

3. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add new feature" # or "fix: resolve issue"
   ```

4. **Push to your fork**

   ```bash
   git push origin your-feature-branch
   ```

5. **Create a Pull Request**
   - Use a descriptive title
   - Explain what changes you made
   - Reference related issues
   - Include screenshots if applicable

## 🧠 Code Guidelines

### Code Style

- Use **consistent indentation** (2 spaces)
- Use **meaningful variable names**
- Add **comments** for complex logic
- Follow **existing patterns** in the codebase

### File Structure

- `app.js` - Main bot logic
- `main.js` - Electron main process
- `render.js` - Frontend logic
- `preload.js` - Electron bridge
- `index.html` - UI interface

### Best Practices

- **Error handling**: Always wrap risky operations in try-catch
- **Logging**: Use the existing log function for consistent output
- **Rate limiting**: Respect Instagram's rate limits
- **User safety**: Never compromise user data or security

## 🔒 Security Considerations

- **Never log** user credentials
- **Secure session storage**
- **Validate user inputs**
- **Handle errors gracefully**
- **Respect user privacy**

## 🧪 Testing

Before submitting:

1. **Test basic functionality**

   - Login process
   - Data extraction
   - Unfollow process
   - Error handling

2. **Test edge cases**

   - Network failures
   - Instagram UI changes
   - Invalid credentials
   - Rate limiting

3. **Cross-platform testing** (if possible)
   - Windows
   - macOS
   - Linux

## 📝 Commit Messages

Use clear, descriptive commit messages:

- `feat: add new feature`
- `fix: resolve login issue`
- `docs: update README`
- `style: fix code formatting`
- `refactor: improve error handling`
- `test: add unit tests`

## 🚀 Release Process

1. **Version bump** in package.json
2. **Update CHANGELOG.md**
3. **Create release notes**
4. **Tag the release**

## ❓ Questions?

- **Open an issue** for questions
- **Check existing issues** first
- **Be specific** about your question

## 🙏 Recognition

All contributors will be:

- **Listed in contributors** section
- **Credited in release notes**
- **Appreciated by the community** ❤️

## 📋 Issues & Pull Requests

### Good Issues Include:

- Clear description
- Steps to reproduce (for bugs)
- Expected behavior
- System information
- Screenshots when helpful

### Good Pull Requests Include:

- Descriptive title
- Clear explanation of changes
- Reference to related issues
- Updated documentation if needed
- Tests for new features

## 🛡️ Code of Conduct

- **Be respectful** to all contributors
- **Help newcomers** learn and contribute
- **Focus on constructive feedback**
- **Keep discussions professional**
- **Respect different perspectives**

## 🔧 Development Environment

### Required Tools

- Node.js (v14+)
- npm or yarn
- Git
- Code editor (VS Code recommended)

### Recommended Extensions (VS Code)

- Prettier - Code formatter
- ESLint - JavaScript linter
- GitLens - Git integration

---

**Thank you for contributing to making Instagram automation better! 🚀**
