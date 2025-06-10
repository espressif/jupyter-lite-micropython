import { BaseKernel } from '@jupyterlite/kernel';
import { KernelMessage } from '@jupyterlab/services';
import { ServiceContainer } from './services/ServiceContainer';
import {callAlert} from "./components/Alert";

export class EmbeddedKernel extends BaseKernel {

  constructor(options: any, private serviceContainer: ServiceContainer) {
    super(options);
  }

  async kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']> {
    const content: KernelMessage.IInfoReply = {
      implementation: 'embedded',
      implementation_version: '0.1.0',
      language_info: {
        codemirror_mode: {
          name: 'python',
          version: 3,
        },
        file_extension: '.py',
        mimetype: 'text/x-python',
        name: 'python',
        nbconvert_exporter: 'python',
        pygments_lexer: 'ipython3',
        version: '3.8',
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'Embedded Kernel with Serial Support',
      help_links: [],
    };

    return content;
  }

  async interrupt(): Promise<void> {
    await this.serviceContainer.deviceService.sendInterrupt();
  }

  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content'],
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {

    const deviceService = this.serviceContainer.deviceService;

    if (!deviceService) {
      const message = "[Kernel] executeRequest - DeviceService is undefined";
      console.error(message);
      callAlert(message);

      return {
        status: 'error',
        execution_count: this.executionCount,
        ename: 'ValueError',
        evalue: 'Missing MicroPython firmware URL',
        traceback: ['DeviceService is not available. Please provide MicroPython firmware URL.']
      };
    }

    if (!deviceService.isConnected()) {
      const message = "[Kernel] executeRequest - DeviceService is not connected.";
      console.warn(message);
      callAlert(message);

      return {
        status: 'error',
        execution_count: this.executionCount,
        ename: 'ValueError',
        evalue: 'Device is not connected',
        traceback: ['Device is not connected. Please ensure the device is connected and try again.']
      };
    }

    console.log("[Kernel] executeRequest - Processing code");
    const { code } = content;

    try {
      console.log("[Kernel] executeRequest - Checking transport");
      const transport = this.serviceContainer.deviceService.getTransport();
      console.log(transport)
      if (!transport) {
        console.log("[Kernel] executeRequest - No transport available");
        return {
          status: 'error',
          execution_count: this.executionCount,
          ename: 'TransportError',
          evalue: 'No transport available',
          traceback: ['Please connect a device first']
        };
      }
      
      console.log("[Kernel] executeRequest - Executing command via ConsoleService");
      // Execute the command and handle the output
      const result = await this.serviceContainer.consoleService.executeCommand(code, (content) => {
        console.log("[Kernel] executeRequest - Streaming output:", content.text.substring(0, 50) + (content.text.length > 50 ? '...' : ''));
        this.stream(content);
      });

      if (!result.success) {
        console.log("[Kernel] executeRequest - Command execution failed:", result.error);
        return {
          status: 'error',
          execution_count: this.executionCount,
          ename: 'ExecutionError',
          evalue: result.error || 'Unknown error',
          traceback: [result.error || 'Unknown error']
        };
      }

      console.log("[Kernel] executeRequest - Command executed successfully");
      return {
        status: 'ok',
        execution_count: this.executionCount,
        user_expressions: {},
      };

    } catch (error: any) {
      console.error("[Kernel] executeRequest - Execution error:", error);
      return {
        status: 'error',
        execution_count: this.executionCount,
        ename: 'ExecuteError',
        evalue: error instanceof Error ? error.message : 'Unknown error',
        traceback: error instanceof Error ? [error.stack || ''] : ['Unknown error occurred'],
      };
    }
  }

  async completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content'],
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  async inspectRequest(
    content: KernelMessage.IInspectRequestMsg['content'],
  ): Promise<KernelMessage.IInspectReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  async isCompleteRequest(
    content: KernelMessage.IIsCompleteRequestMsg['content'],
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  async commInfoRequest(
    content: KernelMessage.ICommInfoRequestMsg['content'],
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  inputReply(content: KernelMessage.IInputReplyMsg['content']): void {}

  async commOpen(msg: KernelMessage.ICommOpenMsg): Promise<void> {}

  async commMsg(msg: KernelMessage.ICommMsgMsg): Promise<void> {}

  async commClose(msg: KernelMessage.ICommCloseMsg): Promise<void> {}
}
