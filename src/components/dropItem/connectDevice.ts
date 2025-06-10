import {DeviceService} from "../../services/DeviceService";
import {callAlert} from "../Alert";

export class ConnectDeviceUI{
    public text: string = "Connect Device"
    constructor(private deviceService: DeviceService) {
        this.deviceService = deviceService
    }

    public action(){
        if(this.deviceService.isConnected()){
            callAlert(
                "Device is already connected. " +
                "To connect to a different device, please open a new notebook or reload the page."
            );
        }
        this.deviceService.connect()
    }

}