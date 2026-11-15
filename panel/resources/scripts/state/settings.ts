import { action, Action } from 'easy-peasy';

export interface SiteSettings {
  name: string;
  title?: string | null;
  description?: string | null;
  favicon?: string | null;
  logo?: string | null;
  themeColor?: string | null;
  email?: string | null;
  discord?: string | null;
  footer?: string | null;
  locale: string;
  recaptcha: {
    enabled: boolean;
    siteKey: string;
  };
  blueprint: {
    disable_attribution: boolean;
  };
}

export interface SettingsStore {
  data?: SiteSettings;
  setSettings: Action<SettingsStore, SiteSettings>;
}

const settings: SettingsStore = {
  data: undefined,

  setSettings: action((state, payload) => {
    state.data = payload;
  }),
};

export default settings;
