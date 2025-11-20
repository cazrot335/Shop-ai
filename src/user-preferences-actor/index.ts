import { Actor, ActorState } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen.js';

interface PreferenceState {
  preferences?: Record<string, any>;
  updatedAt?: string;
}

export class UserPreferencesActor extends Actor<Env> {
  constructor(state: ActorState, env: Env) {
    super(state, env);
  }

  async initialize(): Promise<void> {
    const existing = await this.state.storage.get<PreferenceState>('state');
    if (!existing) {
      await this.state.storage.put('state', { preferences: {}, updatedAt: new Date().toISOString() });
    }
  }

  async updatePreferences(prefs: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      await this.state.storage.put('state', { preferences: prefs, updatedAt: new Date().toISOString() });
      this.env.logger.info('Preferences updated');
      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: err };
    }
  }

  async getPreferences(): Promise<{ success: boolean; preferences?: Record<string, any>; error?: string }> {
    try {
      const state = await this.state.storage.get<PreferenceState>('state');
      return { success: true, preferences: state?.preferences };
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: err };
    }
  }
}

export default UserPreferencesActor;
