import { Actor, ActorState } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen.js';

interface SearchState {
  lastSearch?: string;
  timestamp?: string;
}

export class ProductSearchActor extends Actor<Env> {
  constructor(state: ActorState, env: Env) {
    super(state, env);
  }

  async initialize(): Promise<void> {
    const existing = await this.state.storage.get<SearchState>('state');
    if (!existing) {
      await this.state.storage.put('state', { lastSearch: '', timestamp: new Date().toISOString() });
    }
  }

  async searchProducts(query: string): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      this.env.logger.info(`Search: ${query}`);
      return { success: true, results: [] };
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: err };
    }
  }

  async getHistory(): Promise<{ success: boolean; items?: any[]; error?: string }> {
    try {
      return { success: true, items: [] };
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: err };
    }
  }
}

export default ProductSearchActor;
