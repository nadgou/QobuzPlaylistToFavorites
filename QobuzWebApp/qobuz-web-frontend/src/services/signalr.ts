import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import type { ImportProgressUpdate } from '../types';

export class SignalRService {
  private connection: HubConnection | null = null;

  async connect(): Promise<string | null> {
    // Disconnect any existing connection first
    if (this.connection) {
      await this.disconnect();
    }

    try {
      // Try simple connection without extra headers first
      this.connection = new HubConnectionBuilder()
        .withUrl('http://localhost:5152/hub/progress')
        .build();
          
      console.log('Attempting SignalR connection...');
      await this.connection.start();
      console.log('SignalR connected successfully with ID:', this.connection.connectionId);
      return this.connection?.connectionId || null;
    } catch (error) {
      console.error('SignalR connection failed:', error);
      return null;
    }
  }

  onProgressUpdate(callback: (update: ImportProgressUpdate) => void): void {
    if (this.connection) {
      this.connection.on('ProgressUpdate', callback);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  getConnectionId(): string | null {
    return this.connection?.connectionId || null;
  }
}