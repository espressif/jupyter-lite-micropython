import { ConsoleService } from "../../services/ConsoleService";
import "/src/style/fullLog.css";

export class FullLogPanel {
    public text: string = "Full Log";
    private panel: HTMLDivElement | undefined;
    private content: HTMLDivElement | undefined;
    private header: HTMLDivElement | undefined;
    private isOpen: boolean = false;
    private isDragging: boolean = false;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private logContent: string = "";

    constructor(private consoleService: ConsoleService) {
        this.createPanelElements();
        
        this.addDragHandlers();

        if (this.panel) {
            this.panel.style.display = "none";
        }

        document.addEventListener('consoleTextChanged', (e) => {
            const customEvent = e as CustomEvent;
            this.refreshLog();
            console.log('Custom event received. Text was changed:', customEvent.detail.text);
        });
        
    }

    private createPanelElements(): void {
        this.panel = document.createElement("div");
        this.panel.className = "full-log-panel";
        
        this.panel.innerHTML = `
            <div class="full-log-header">
                <span class="full-log-title">Console Log</span>
                <button class="full-log-close-btn">×</button>
            </div>
            <div class="full-log-content"></div>
        `;
        
        this.header = this.panel.querySelector(".full-log-header") as HTMLDivElement;
        this.content = this.panel.querySelector(".full-log-content") as HTMLDivElement;
        
        const closeBtn = this.panel.querySelector(".full-log-close-btn");
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        document.body.appendChild(this.panel);
    }

    private addDragHandlers(): void {
        if (!this.header || !this.panel) return;
        
        this.header.addEventListener("mousedown", (e: MouseEvent) => {
            if (!this.panel) return;
            this.isDragging = true;
            this.offsetX = e.clientX - this.panel.getBoundingClientRect().left;
            this.offsetY = e.clientY - this.panel.getBoundingClientRect().top;
        });

        document.addEventListener("mousemove", (e: MouseEvent) => {
            if (!this.isDragging || !this.panel) return;
            
            const x = e.clientX - this.offsetX;
            const y = e.clientY - this.offsetY;
            
            // Keep panel within viewport bounds
            const maxX = window.innerWidth - this.panel.offsetWidth;
            const maxY = window.innerHeight - this.panel.offsetHeight;
            
            this.panel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
            this.panel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
        });

        document.addEventListener("mouseup", () => {
            this.isDragging = false;
        });
    }

    public action(): void {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    private open(): void {
        this.updateLogContent();
        
        if (this.panel) {
            this.panel.style.display = "flex";
        }
        this.isOpen = true;
    }

    private close(): void {
        if (this.panel) {
            this.panel.style.display = "none";
        }
        this.isOpen = false;
    }

    private updateLogContent(): void {
        this.logContent = this.consoleService.fullLog;
        
        if (this.content) {
            this.content.textContent = this.logContent || "No log data available.";
            this.content.scrollTop = this.content.scrollHeight;
        }
    }

    public refreshLog(): void {
        if (this.isOpen) {
            this.updateLogContent();
        }
    }
}