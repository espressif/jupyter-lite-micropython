import {EspControlPanelButton} from "./Toolbar";
import '/src/style/welcome.css'

export class Welcome {
    private static readonly STORAGE_KEY = 'welcome-hide-preference';
    public text: string = "Welcome";
    private welcomeElement: HTMLDivElement | null = null;
    
    constructor() {}

    /**
     * Checks if the welcome message should be shown based on localStorage
     */
    private shouldShowWelcome(): boolean {
        const hidePreference = localStorage.getItem(Welcome.STORAGE_KEY);
        return hidePreference !== 'true';
    }

    /**
     * Creates and displays the welcome message if it hasn't been dismissed
     */
    public showWelcome() {
        if (!this.shouldShowWelcome()) {
            return;
        }

        if (!this.welcomeElement) {
            this.createWelcomeElement();
        }

        if (this.welcomeElement) {
            document.body.appendChild(this.welcomeElement);
            this.welcomeElement.style.display = 'block';
        }
    }

    /**
     * Creates the welcome UI with message and checkbox
     */
    private createWelcomeElement() {
        // Create overlay element
        const overlay = document.createElement('div');
        overlay.className = 'jp-welcome-overlay';
        overlay.style.display = 'none';
        
        overlay.innerHTML = `
            <div class="jp-welcome-dialog">
                <header class="jp-welcome-header">
                    <h2 class="jp-welcome-title">Welcome to JupyterLite Embedded Kernel</h2>
                    <button class="jp-welcome-close-button jp-icon-hover" id="welcome-dialog-close" title="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                            <path class="jp-icon3" fill="#616161" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </header>
                <div class="jp-welcome-content">
                    <p>Thank you for using JupyterLite Embedded Kernel! Here's how to get started:</p>
                    <ul>
                        <li>Use the <span class="jp-welcome-inline-button">${EspControlPanelButton}</span> in the toolbar to interact with your device</li>
                        <li>Connect to your device using the Connect Device option</li>
                        <li>Flash firmware to your device with the Flash Device tool</li>
                        <li>Create new notebooks to write and execute code</li>
                        <li>Use the device's capabilities directly from your notebooks</li>
                        <li>Found a bug or have a suggestion? Please <a href="https://github.com/espressif/jupyter-lite-micropython/issues" class="jp-welcome-github-link" target="_blank" >open an issue on GitHub</a></li>
                    </ul>
                    <div class="jp-welcome-checkbox-container">
                        <label class="jp-welcome-checkbox-label">
                            <input type="checkbox" id="welcome-hide-checkbox" class="jp-welcome-checkbox">
                            <span>Don't show this message again</span>
                        </label>
                    </div>
                    <div class="jp-welcome-button-container">
                        <button class="jp-Button jp-mod-accept jp-mod-styled" id="welcome-got-it-button">Got it!</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.welcomeElement = overlay;
        
        const closeButton = overlay.querySelector('#welcome-dialog-close');
        const gotItButton = overlay.querySelector('#welcome-got-it-button');
        const checkbox = overlay.querySelector('#welcome-hide-checkbox') as HTMLInputElement;
        
        if (closeButton) {
            closeButton.addEventListener('click', () => this.handleClose(checkbox));
        }
        
        if (gotItButton) {
            gotItButton.addEventListener('click', () => this.handleClose(checkbox));
        }
        
        // Close when clicking outside the welcome dialog
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.handleClose(checkbox);
            }
        });
        
    }
    
    /**
     * Handles the closing of the welcome dialog
     */
    private handleClose(checkbox: HTMLInputElement | null) {
        if (checkbox && checkbox.checked) {
            localStorage.setItem(Welcome.STORAGE_KEY, 'true');
        }
        
        this.hideWelcome();
    }
    
    /**
     * Hides the welcome dialog
     */
    private hideWelcome() {
        if (this.welcomeElement) {
            this.welcomeElement.style.display = 'none';
            if (this.welcomeElement.parentNode) {
                this.welcomeElement.parentNode.removeChild(this.welcomeElement);
            }
        }
    }

}
