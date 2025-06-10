import { ESPLoader } from 'esptool-js';
import * as CryptoJS from 'crypto-js';
import { ProgressOverlay } from '../components/ProgressOverlay';
import { ErrorHandler } from '../utils/ErrorHandler';
import { DeviceService } from './DeviceService';
import { ConsoleService } from './ConsoleService';
import { FirmwareService } from './FirmwareService';

export class FlashService {

  constructor(
    private deviceService: DeviceService,
    private consoleService: ConsoleService,
    private firmwareService: FirmwareService
  ) {}

  async flashDevice(): Promise<void> {
    const progressOverlay = new ProgressOverlay();
    try {
      await this.deviceService.disconnect()
      if (!this.deviceService.getTransport()){
        this.deviceService.clearPort();
        await this.deviceService.requestPort();
      }

      const transport = this.deviceService.getTransport();
      if (!transport) {
        throw new Error('Failed to get device transport');
      }

      const currentFirmware = this.firmwareService.getSelectedFirmwareId();
      progressOverlay.show(currentFirmware);
      const loaderOptions = {
        transport: transport,
        baudrate: 921600,
        romBaudrate: 115600
      };
      const esploader = new ESPLoader(loaderOptions);
      progressOverlay.setStatus('Connecting to device...');
      const deviceInfo = await esploader.main();
      console.log("[flashDevice] current device is", deviceInfo);

      if (deviceInfo) {
        const match = deviceInfo.match(/ESP32[-\w]*/i);
        if (match) {
          const chipType = match[0].toUpperCase();
          console.log(`🔍 Auto-detected device: ${chipType}`);
          this.deviceService.setDeviceType(chipType);
          const deviceConnectedEvent = new CustomEvent('deviceConnected', {
            detail: { deviceType: chipType }
          });
          document.dispatchEvent(deviceConnectedEvent);
        }
      }

      progressOverlay.setStatus('Downloading firmware...');
      let firmwareString = await this.firmwareService.downloadFirmware();

      const flashOptions = {
        fileArray: [{
          data: firmwareString,
          address: this.firmwareService.getFlashAddress()
        }],
        flashSize: "keep",
        eraseAll: false,
        compress: true,
        flashMode: "dio",
        flashFreq: "40m",
        reportProgress: (fileIndex: number, written: number, total: number) => {
          progressOverlay.updateProgress(written, total);
          console.log('Flash progress:', {fileIndex, written, total});
        },
        calculateMD5Hash: (image: string) => CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)).toString()
      };

      await esploader.writeFlash(flashOptions);
      progressOverlay.setStatus('Flash complete!');

      const flashCompleteEvent = new CustomEvent('flashComplete', {
        detail: { success: true }
      });
      document.dispatchEvent(flashCompleteEvent);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Hard resetting via RTS pin...');
      try {
        await esploader.after();

      } catch (afterError) {
        console.warn('Error during esploader.after():', afterError);
      }

      try {
        progressOverlay.setStatus('Resetting device...');
        await this.deviceService.reset();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        progressOverlay.setStatus('Initializing console...');
        await this.consoleService.resetConsole();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (resetError) {
        console.warn('Error during device reset:', resetError);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      await this.deviceService.disconnect();
      try {
        progressOverlay.setStatus('Cleaning up connections...');
      } catch (disconnectError) {
        console.warn('Error during device disconnect:', disconnectError);
      }

      console.warn('Reconnect...');
      await this.deviceService.connect();
      await this.deviceService.reset();
      console.warn('Device reset...');
      console.log("This device type is: ", this.deviceService.getDeviceType())
      const deviceType = this.deviceService.getDeviceType();
      if (deviceType) {
        const deviceConnectedEvent = new CustomEvent('deviceConnected', {
          detail: { deviceType }
        });
        document.dispatchEvent(deviceConnectedEvent);
      }
    } catch (err) {
      const errorMessage = ErrorHandler.getErrorMessage(err);
      progressOverlay.setStatus(`Flash failed: ${errorMessage}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      await progressOverlay.hide();
      
    }
  }
}
