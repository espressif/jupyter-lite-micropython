import '/src/style/progress.css'

export class ProgressOverlay {
  private element: HTMLElement;
  private progressBar: HTMLElement;
  private statusEl: HTMLElement;
  private titleEl: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'progress-overlay';
    this.element.innerHTML = `
      <div class="progress-container">
        <div class="progress-title">Flashing Firmware...</div>
        <div class="progress-bar-container">
          <div class="progress-bar"></div>
        </div>
        <div class="progress-status">Initializing...</div>
      </div>
    `;

    this.progressBar = this.element.querySelector('.progress-bar') as HTMLElement;
    this.statusEl = this.element.querySelector('.progress-status') as HTMLElement;
    this.titleEl = this.element.querySelector('.progress-title') as HTMLElement;
  }

  show(firmwareId?: string): void {
    document.body.appendChild(this.element);
    
    if (firmwareId) {
      this.setTitle(`Flashing ${firmwareId} Firmware...`);
    }
    
    requestAnimationFrame(() => {
      this.element.classList.add('visible');
    });
    
    const flashStartEvent = new CustomEvent('flashStart', {
      detail: { firmware: firmwareId || 'selected' }
    });
    document.dispatchEvent(flashStartEvent);
  }

  async hide(): Promise<void> {
    this.element.classList.remove('visible');
    await new Promise(resolve => setTimeout(resolve, 300));
    this.element.remove();
  }

  updateProgress(written: number, total: number): void {
    const progress = (written / total) * 100;
    this.progressBar.style.width = `${progress}%`;
    this.statusEl.textContent = `Flashing: ${Math.round(progress)}% (${written} / ${total} bytes)`;
  }

  setStatus(status: string): void {
    this.statusEl.textContent = status;
  }
  
  setTitle(title: string): void {
    if (title.includes('Flashing') && title.includes('Firmware')) {
      const match = title.match(/Flashing (.+?) Firmware\.\.\./i);
      if (match && match[1]) {
        const firmwareName = match[1];
        this.titleEl.innerHTML = `Flashing <span class="firmware-name">${firmwareName}</span> Firmware...`;
      } else {
        this.titleEl.textContent = title;
      }
    } else {
      this.titleEl.textContent = title;
    }
  }
}
