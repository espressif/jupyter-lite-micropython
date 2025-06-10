import { Transport } from 'esptool-js';
import {callAlert} from "../components/Alert";

export class DeviceService {
  private port: SerialPort | null = null;
  private transport: Transport | null = null;
  private isDeviceConnected: boolean = false;
  private deviceType: string = '';
  private decoder: TextDecoder = new TextDecoder();

  constructor() {}

  async requestPort(): Promise<void> {
    try {
      const port = await navigator.serial.requestPort();
      this.port = port;
      this.transport = new Transport(port);
    } catch (err) {
      console.error('Failed to get port:', err);
      throw err;
    }
  }

  async connect(): Promise<void> {
    if (!this.port) {
      await this.requestPort();
    }
    if (!this.port) {
      throw new Error('No port selected');
    }

    if (!this.transport) {
      throw new Error('No transport selected');
    }

    try {
      if (this.isDeviceConnected) {
        console.log('Already connected, skipping connection');
        return;
      }
      await this.transport.connect()
    } catch (err) {
      callAlert(
          "Unable to connect to the device. " +
          "It might already be connected somewhere else. " +
          "Please check and try again."
      );
      console.error('Failed to connect:', err);
      throw err;
    }


    this.isDeviceConnected = true;
    const event = new CustomEvent("deviceConnected", {
        detail: { msg: "Connected" }
    });
    document.dispatchEvent(event)

  }

  async disconnect(): Promise<void> {

    try {

      if (this.transport){
        await this.transport.disconnect()
      }
      else if (this.port){
        await this.port.close()
      }
      console.log('Device disconnected successfully');

    } catch (err) {
      console.error('Failed to disconnect:', err);
    } finally {

      this.isDeviceConnected = false;
      const event = new CustomEvent("deviceDisconnected", {
        detail: { msg: "Not connected" }
      });
      document.dispatchEvent(event)

    }

  }

  async reset(): Promise<void> {
    if (!this.port) {
      throw new Error('No port selected');
    }

    try {
      await this.port.setSignals({ dataTerminalReady: false });
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.port.setSignals({ dataTerminalReady: true });
    } catch (err) {
      console.error('Failed to reset device:', err);
      throw err;
    }
  }

  getTransport(): Transport | null {
    return this.transport;
  }

  isConnected(): boolean {
    return this.isDeviceConnected;
  }
  
  setDeviceType(type: string): void {
    this.deviceType = type;
    console.log(`Device type set to: ${type}`);
  }
  
  getDeviceType(): string {
    return this.deviceType;
  }

  clearPort(): void {
    if (this.port) {
      console.log('Clearing device port reference');
      this.port = null;
      this.transport = null;
    }
    this.isDeviceConnected = false;
  }

  async sendCommand(code: string): Promise<boolean> {
    if (!this.transport || !this.transport.device.writable) {
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const ctrl_d = new Uint8Array([4]);
      const ctrl_e = new Uint8Array([5]);
      const new_line = encoder.encode('\r\n');
      
      const writer = this.transport.device.writable.getWriter();
      
      await writer.write(ctrl_e);
      await writer.write(new_line);
      
      const data = encoder.encode(code + "######START REQUEST######");
      await writer.write(data);
      
      await writer.write(ctrl_d);
      await writer.write(new_line);
      
      writer.releaseLock();
      return true;
    } catch (error) {
      console.error('Error sending command to device:', error);
      return false;
    }
  }

  async sendInterrupt(): Promise<boolean> {
    if (!this.transport || !this.transport.device.writable) {
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const ctrl_c = new Uint8Array([3]);
      const new_line = encoder.encode('\r\n');
      
      const writer = this.transport.device.writable.getWriter();
      await writer.write(ctrl_c);
      await writer.write(new_line);
      writer.releaseLock();
      return true;
    } catch (error) {
      console.error('Error sending interrupt to device:', error);
      return false;
    }
  }

  private async readFromDevice(): Promise<IteratorResult<Uint8Array, any>> {
    if (!this.transport || !this.transport.device.readable) {
      console.error('Transport not readable in readFromDevice');
      return { value: undefined, done: true };
    }

    try {
      const readLoop = this.transport.rawRead();
      return await readLoop.next();
    } catch (error) {
      console.error('Error reading from device:', error);
      
      return { value: undefined, done: true };
    }
  }

  async readAndDecodeFromDevice(): Promise<{ text: string, done: boolean }> {
    const { value, done } = await this.readFromDevice();
    console.log('[readAndDecodeFromDevice] ', value);
    if (done || !value) {
      return { text: '', done: true };
    }
    
    const text = this.decoder.decode(value);
    return { text, done: false };
  }

}
