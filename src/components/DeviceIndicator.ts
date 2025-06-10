import { DeviceService } from "../services/DeviceService";

export class DeviceIndicator {
  private element: HTMLElement;
  private isConnected: boolean = false;
  
  constructor(private deviceService: DeviceService) {
    this.element = document.createElement('div');
    this.element.className = 'connected-device-indicator';
    this.updateConnectionStatus();
    
    document.addEventListener('deviceConnected', () => this.updateConnectionStatus());
    document.addEventListener('deviceDisconnected', () => this.updateConnectionStatus());
  }

  private updateConnectionStatus(): void {
    this.isConnected = this.deviceService.isConnected();
    
    if (this.isConnected) {
      this.element.innerHTML = `
        <div class="device-status connected" title="Device Connected">
          <div class="status-dot"></div>
          <span>Device Connected ${this.deviceService.getDeviceType()}</span>
        </div>
      `;
    } else {
      this.element.innerHTML = `
        <div class="device-status disconnected" title="No Device Connected">
          <div class="status-dot"></div>
          <span>No Device</span>
        </div>
      `;
    }
  }
  
  public getElement(): HTMLElement {
    return this.element;
  }
}