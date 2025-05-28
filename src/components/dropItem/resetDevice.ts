import {DeviceService} from "../../services/DeviceService";
import {callAlert} from "../Alert";


export class ResetDeviceUI{
    public text: string = "Reset Device"
    constructor(private deviceService: DeviceService) {
        this.deviceService = deviceService
    }

    public action() {
        if (this.deviceService.isConnected()) {
            this.deviceService.reset();
            callAlert("The device has been reset.");
        } else {
            callAlert("Please connect the device first.");
        }
    }
}