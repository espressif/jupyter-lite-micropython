import {ServiceContainer} from "../services/ServiceContainer";
import {ConnectDeviceUI} from "./dropItem/connectDevice";
import {FlashDeviceUI} from "./dropItem/flashDevice";
import {ResetDeviceUI} from "./dropItem/resetDevice";
import {DeviceIndicator} from "./DeviceIndicator";

import "/src/style/toolbar.css";
import {FullLogPanel} from "./dropItem/fullLog";

export const EspControlPanelButton = `
    <button class="jp-ToolbarButton jp-Toolbar-item esp-button" title="ESP Options">
      <div class="esp-logo-container">
        <img src="https://www.cdnlogo.com/logos/e/41/espressif-systems.svg" alt="ESP" class="esp-logo">
      </div>
      <span class="jp-ToolbarButtonComponent-label esp-button-label">ESP Control Panel</span>
      <span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 18 18" data-icon="ui-components:caret-down-empty" style="vertical-align: middle;">
          <path fill="#616161" d="M5.2 5.9 9 9.7l3.8-3.8L14 7.1l-4.9 5-4.9-5z" class="jp-icon3" shape-rendering="geometricPrecision"></path>
        </svg>
      </span>
    </button>
`

export function addButtonToToolbarElement(toolbar: Element, serviceContainer: ServiceContainer): void {
  const deviceStatusIndicator = new DeviceIndicator(serviceContainer.deviceService);
  const statusElement = deviceStatusIndicator.getElement();
  statusElement.className += " lm-Widget jp-Toolbar-item device-status-container";
  toolbar.insertBefore(statusElement, toolbar.firstChild);
  
  const items = [
    new ConnectDeviceUI(serviceContainer.deviceService),
    new FlashDeviceUI(serviceContainer.deviceService, serviceContainer.firmwareService, serviceContainer.flashService),
    new ResetDeviceUI(serviceContainer.deviceService),
    new FullLogPanel(serviceContainer.consoleService),
  ];
  
  const div = document.createElement('div');
  div.className = "lm-Widget jp-CommandToolbarButton jp-Toolbar-item dropdown-container";
  
  const menuItemsHTML = items.map(item => {
    return `
      <div class="esp-menu-item" role="menuitem" tabindex="-1">
        ${item.text}
      </div>
    `;
  }).join('');
  
  div.innerHTML = `
    ${EspControlPanelButton}
    <div class="esp-dropdown-menu">
      ${menuItemsHTML}
    </div>
  `;
  
  const button = div.querySelector('.esp-button');
  const dropdownContent = div.querySelector('.esp-dropdown-menu');
  const menuItems = div.querySelectorAll('.esp-menu-item');

  if (button && dropdownContent) {
    statusElement.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownContent.classList.toggle('visible');
    });
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownContent.classList.toggle('visible');
    });
  }
  
  document.addEventListener('click', (e) => {
    if (!div.contains(e.target as Node) && dropdownContent) {
      dropdownContent.classList.remove('visible');
    }
  });
  
  menuItems.forEach((menuItem, index) => {
    if (menuItem && items[index]) {
      menuItem.addEventListener('click', (e) => {
        e.preventDefault();
        items[index].action();
        if (dropdownContent) {
          dropdownContent.classList.remove('visible');
        }
      });
    }
  });
  
  toolbar.insertBefore(div, toolbar.firstChild);
}

