import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNativeApp = (): boolean => {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
};

export const getNativePlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

export const isIOSApp = (): boolean => {
  return isNativeApp() && getNativePlatform() === 'ios';
};

/**
 * Native Haptic Feedback on interactive learning events (quizzes, card flips, streak wins)
 */
export async function triggerHapticFeedback(style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  if (!isNativeApp()) return;
  try {
    if (style === 'success') {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (style === 'warning') {
      await Haptics.notification({ type: NotificationType.Warning });
    } else if (style === 'error') {
      await Haptics.notification({ type: NotificationType.Error });
    } else if (style === 'heavy') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (style === 'medium') {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  } catch (err) {
    console.debug('[Haptics]', err);
  }
}

/**
 * Configure native iOS / Android system status bar matching SunnyLearn palette
 */
export async function configureNativeSystemUI(isDark: boolean = false) {
  if (!isNativeApp()) return;
  try {
    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light
    });
    if (getNativePlatform() === 'android') {
      await StatusBar.setBackgroundColor({
        color: isDark ? '#0c0a09' : '#990000'
      });
    }
  } catch (err) {
    console.debug('[StatusBar]', err);
  }
}

/**
 * Hide native splash screen once React has loaded and rendered the view
 */
export async function hideNativeSplashScreen() {
  if (!isNativeApp()) return;
  try {
    await SplashScreen.hide();
  } catch (err) {
    console.debug('[SplashScreen]', err);
  }
}
