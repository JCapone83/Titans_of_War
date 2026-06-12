import React from 'react';
import { CAMPAIGN_STORAGE_KEY } from '../game/campaignStorage.js';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Titans of War campaign render failed.', error, info);
  }

  reload = () => {
    window.location.reload();
  };

  clearSaveAndReload = () => {
    try {
      window.localStorage?.removeItem(CAMPAIGN_STORAGE_KEY);
    } catch (error) {
      console.error('Could not clear the Titans of War auto-save.', error);
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="error-boundary" role="alert">
        <section className="error-boundary-panel">
          <h1>Campaign display interrupted</h1>
          <p>
            A scenario or saved state could not be rendered. Reload first; if
            the problem returns, clear the browser auto-save and start a fresh
            campaign.
          </p>
          <div className="error-boundary-actions">
            <button type="button" className="tactical-button primary" onClick={this.reload}>
              Reload campaign
            </button>
            <button type="button" className="tactical-button" onClick={this.clearSaveAndReload}>
              Clear auto-save and restart
            </button>
          </div>
        </section>
      </main>
    );
  }
}
