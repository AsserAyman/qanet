import NetInfo from '@react-native-community/netinfo';

type NetworkCallback = () => void;
type NetworkChangeCallback = (isOnline: boolean) => void;

class NetworkManager {
  private isConnected = false;
  private isInitialized = false;

  // Simple callback storage instead of EventEmitter
  private onlineCallbacks: Set<NetworkCallback> = new Set();
  private offlineCallbacks: Set<NetworkCallback> = new Set();
  private networkChangeCallbacks: Set<NetworkChangeCallback> = new Set();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get initial network state
      const netInfoState = await NetInfo.fetch();
      this.isConnected = netInfoState.isConnected ?? false;

      // Listen for network changes
      NetInfo.addEventListener(state => {
        const wasConnected = this.isConnected;
        this.isConnected = state.isConnected ?? false;

        // Trigger online callbacks
        if (!wasConnected && this.isConnected) {
          this.onlineCallbacks.forEach(callback => {
            try {
              callback();
            } catch (error) {
              console.error('Error in online callback:', error);
            }
          });
        }

        // Trigger offline callbacks
        if (wasConnected && !this.isConnected) {
          this.offlineCallbacks.forEach(callback => {
            try {
              callback();
            } catch (error) {
              console.error('Error in offline callback:', error);
            }
          });
        }

        // Trigger network change callbacks
        this.networkChangeCallbacks.forEach(callback => {
          try {
            callback(this.isConnected);
          } catch (error) {
            console.error('Error in network change callback:', error);
          }
        });
      });

      this.isInitialized = true;
      console.log('NetworkManager initialized, online:', this.isConnected);
    } catch (error) {
      console.error('Failed to initialize NetworkManager:', error);
      throw error;
    }
  }

  isOnline(): boolean {
    return this.isConnected;
  }

  isOffline(): boolean {
    return !this.isConnected;
  }

  onOnline(callback: NetworkCallback): () => void {
    this.onlineCallbacks.add(callback);
    // Return unsubscribe function
    return () => {
      this.onlineCallbacks.delete(callback);
    };
  }

  onOffline(callback: NetworkCallback): () => void {
    this.offlineCallbacks.add(callback);
    // Return unsubscribe function
    return () => {
      this.offlineCallbacks.delete(callback);
    };
  }

  onNetworkChange(callback: NetworkChangeCallback): () => void {
    this.networkChangeCallbacks.add(callback);
    // Return unsubscribe function
    return () => {
      this.networkChangeCallbacks.delete(callback);
    };
  }
}

export const networkManager = new NetworkManager();