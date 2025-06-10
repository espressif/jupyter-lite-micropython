import { DeviceService } from './DeviceService';
import { ConsoleService } from './ConsoleService';
import { FirmwareService } from './FirmwareService';
import { FlashService } from './FlashService';

export class ServiceContainer {

  private _deviceService: DeviceService;
  private _consoleService: ConsoleService;
  private _firmwareService: FirmwareService;
  private _flashService: FlashService;

  constructor() {
    this._deviceService = new DeviceService();
    this._consoleService = new ConsoleService(this._deviceService);
    this._firmwareService = new FirmwareService(this._deviceService);
    
    this._flashService = new FlashService(
      this._deviceService,
      this._consoleService,
      this._firmwareService
    );
  }

  public get deviceService(): DeviceService {
    return this._deviceService;
  }

  public get consoleService(): ConsoleService {
    return this._consoleService;
  }

  public get firmwareService(): FirmwareService {
    return this._firmwareService;
  }

  public get flashService(): FlashService {
    return this._flashService;
  }
}
