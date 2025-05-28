import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';
import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';
import { EmbeddedKernel } from './kernel';
import { ServiceContainer } from './services/ServiceContainer';
import {addButtonToToolbarElement} from "./components/Toolbar";
import {Welcome} from "./components/Welcome";

const kernelPlugin: JupyterLiteServerPlugin<void> = {
  id: 'jupyterlite-embedded-kernel:kernel',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    const activeKernels = new Map<string, EmbeddedKernel>();

    app.router.post('/api/kernels/(.*)/interrupt', async (req, kernelId: string) => {
      const kernel = activeKernels.get(kernelId);
      if (kernel) {
        try {
          await kernel.interrupt();
          return new Response(null, { status: 204 });
        } catch (error) {
          console.error('Failed to interrupt kernel:', error);
          return new Response('Failed to interrupt kernel', { status: 500 });
        }
      }
      return new Response('Kernel not found', { status: 404 });
    });

    kernelspecs.register({
      spec: {
        name: 'embedded',
        display_name: 'Embedded Kernel',
        language: 'python',
        argv: [],
        resources: {
          'logo-32x32': 'https://www.cdnlogo.com/logos/e/41/espressif-systems.svg',
          'logo-64x64': 'https://www.cdnlogo.com/logos/e/41/espressif-systems.svg',
        },
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {

        const welcome = new Welcome()
        welcome.showWelcome();
        const el = document.activeElement?.closest('.jp-NotebookPanel');
        const toolbar = el?.querySelector('.jp-NotebookPanel-toolbar');

        const serviceContainer = new ServiceContainer();
        if (toolbar){
          addButtonToToolbarElement(toolbar, serviceContainer);
        }
        const kernel = new EmbeddedKernel(options, serviceContainer);
        await kernel.ready;

        activeKernels.set(kernel.id, kernel);
        return kernel;
      }
    });
  }
};

export default [kernelPlugin];
