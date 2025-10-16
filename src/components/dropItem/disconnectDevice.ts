export class DisconnectDeviceUI {
  public text: string = "Disconnect Device";

  constructor() {}

  public action() {
    window.location.reload();
  }
}
