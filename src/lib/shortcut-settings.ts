const STORAGE_KEY = 'reading_shortcut_settings_v1';

export type ShortcutSettings = {
  enabled: boolean;
  shortcutName: string;
};

const DEFAULT_SETTINGS: ShortcutSettings = {
  enabled: false,
  shortcutName: '',
};

export function loadShortcutSettings(): ShortcutSettings {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveShortcutSettings(settings: ShortcutSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function triggerShortcut(settings: ShortcutSettings): void {
  if (!settings.enabled || !settings.shortcutName.trim()) return;
  const encoded = encodeURIComponent(settings.shortcutName.trim());
  const url = `shortcuts://run-shortcut?name=${encoded}`;
  window.location.href = url;
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}
