# Android Testing Guide for PicFrame

This guide provides steps to test the Android-specific features and optimizations in the PicFrame app.

## Prerequisites

- Android device or emulator running Android 6.0 or higher
- Chrome browser on Android
- Internet connection for initial loading

## Test Steps

### 1. Responsive Design

- Open the app on your Android device using Chrome: http://[server-ip]:5000
- Verify the app adjusts properly to your screen size
- Check that buttons are large enough for touch input
- Verify that text is readable and images display correctly
- Try both portrait and landscape orientations

### 2. Touch Interactions

- **Swipe Navigation**: Test swiping left and right to navigate between images
- **Visual Feedback**: Confirm that swiping shows a visual indicator
- **Button Interactions**: Tap control buttons and verify feedback (slight scale change)
- **Image Selection**: In Manage Images screen, try selecting/deselecting images

### 3. Image Loading

- Check that images load quickly
- Observe the pre-loading behavior when swiping through images
- Test with different network conditions if possible (fast/slow connections)

### 4. PWA Installation

- Visit the site in Chrome
- You should see an "Install PicFrame" prompt at the bottom
- Try installing as a PWA
- Verify app launches properly from the home screen
- Test offline functionality by enabling airplane mode and reopening the app

### 5. Performance

- Check for smooth animations and transitions
- Monitor for any UI lag or responsiveness issues
- Test memory usage by leaving the app open for extended periods

## Reporting Issues

Document any issues with the following information:
- Android version
- Device model
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots if applicable

## Testing Checklist

- [ ] Responsive design works in portrait mode
- [ ] Responsive design works in landscape mode
- [ ] Touch swipe gestures work correctly
- [ ] Visual feedback is provided on swipe
- [ ] All buttons are properly sized for touch input
- [ ] Images load correctly and efficiently
- [ ] PWA install prompt appears
- [ ] App can be installed as a PWA
- [ ] Offline functionality works
- [ ] Performance is smooth overall