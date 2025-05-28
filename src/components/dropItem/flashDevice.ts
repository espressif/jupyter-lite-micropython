import {DeviceService} from "../../services/DeviceService";
import {FirmwareService} from "../../services/FirmwareService";
import {FlashService} from "../../services/FlashService";
import '/src/style/flash.css'


export class FlashDeviceUI {
    public text: string = "Flash Device";
    private dialogElement: HTMLDivElement | null = null;
    
    constructor(
        private deviceService: DeviceService,
        private firmwareService: FirmwareService,
        private flashService: FlashService
    ) {}

    public action() {
        if (!this.dialogElement) {
            this.createDialogPanel();
        }
        this.showDialogPanel();
    }
    
    public createDialogPanel() {
        // Create overlay element
        const overlay = document.createElement('div');
        overlay.className = 'flash-overlay';
        overlay.style.display = 'none';
        
        // Get firmware options
        const firmwareOptions = this.firmwareService.getFirmwareOptions();
        const firmwareKeys = Object.keys(firmwareOptions);
        
        // Create options HTML
        let optionsHTML = '';
        firmwareKeys.forEach(key => {
            const selected = key === 'auto' ? 'selected' : '';
            optionsHTML += `<option value="${key}" ${selected}>${firmwareOptions[key].name || key}</option>`;
        });
        
        // Set innerHTML for the dialog content
        overlay.innerHTML = `
            <div class="flash-dialog">
                <div class="flash-dialog-header">
                    <h2 class="flash-dialog-title">Flash Device</h2>
                    <button class="flash-dialog-close" id="flash-dialog-close">&times;</button>
                </div>
                <p class="flash-dialog-description">Flash your device with the latest firmware</p>
                <div class="flash-options-container">
                    <div class="flash-panel" id="default-firmware-panel">
                        <h3 class="flash-panel-title">Default Firmware</h3>
                        <p class="flash-panel-description">Use the recommended firmware for your device</p>
                        <div class="firmware-select-container">
                            <label class="firmware-select-label">Select firmware:</label>
                            <select class="firmware-select" id="firmware-select">
                                ${optionsHTML}
                            </select>
                            <div class="firmware-description" id="firmware-description"></div>
                        </div>
                        <button class="flash-button" id="flash-default-button">Flash Selected Firmware</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        this.dialogElement = overlay;
        
        // Add event listeners
        const closeButton = overlay.querySelector('#flash-dialog-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hideDialogPanel());
        }
        
        const flashButton = overlay.querySelector('#flash-default-button');
        if (flashButton) {
            flashButton.addEventListener('click', () => {
                const select = overlay.querySelector('#firmware-select') as HTMLSelectElement;
                if (select) {
                    const selectedFirmwareId = select.value;
                    this.flashDefaultFirmware(selectedFirmwareId);
                    this.hideDialogPanel();
                }
            });
        }
        
        const firmwareSelect = overlay.querySelector('#firmware-select') as HTMLSelectElement;
        const firmwareDescription = overlay.querySelector('#firmware-description');
        
        if (firmwareSelect && firmwareDescription) {
            const updateFirmwareDescription = () => {
                const selectedKey = firmwareSelect.value;
                const selectedOption = firmwareOptions[selectedKey];
                
                if (selectedKey === 'auto') {
                    firmwareDescription.textContent = 'Automatically detects your device type and selects the appropriate firmware';
                } else if (selectedOption) {
                    firmwareDescription.textContent = `Firmware for ${selectedOption.name || selectedKey}`;
                } else {
                    firmwareDescription.textContent = `Firmware for ${selectedKey}`;
                }
            };
            
            updateFirmwareDescription();
            
            firmwareSelect.addEventListener('change', updateFirmwareDescription);
        }
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideDialogPanel();
            }
        });
    }
    
    public showDialogPanel() {
        if (this.dialogElement) {
            this.dialogElement.style.display = 'block';
            console.log('Device type:', this.deviceService.getDeviceType());
            console.log('Firmware options:', this.firmwareService.getFirmwareOptions());
        }
    }
    
    private hideDialogPanel() {
        if (this.dialogElement) {
            this.dialogElement.style.display = 'none';
        }
    }
    
    private flashDefaultFirmware(firmwareId: string) {
        this.firmwareService.setSelectedFirmwareId(firmwareId);
        this.flashService.flashDevice();
    }
}