import { KernelMessage } from '@jupyterlab/services';
import { ErrorHandler } from '../utils/ErrorHandler';
import { DeviceService } from './DeviceService';
export type StreamCallback = (content: KernelMessage.IStreamMsg['content']) => void;
export interface ReadOutputResult {
  success: boolean;
  error?: string;
}

export class ConsoleService {
  public fullLog: string = '';
  constructor(private deviceService: DeviceService) {}

  notify(text: string){
    const textChangedEvent = new CustomEvent('consoleTextChanged', {
      detail: { text }
    });
    document.dispatchEvent(textChangedEvent);
  }
  updateFullLog(text: string){
    if (this.fullLog.length > 30000){
      this.fullLog = ''
    }
    this.fullLog += text;
    this.notify(text);
  }
  async readAndParseOutput(
    streamCallback: StreamCallback
  ): Promise<ReadOutputResult> {
    const logger = (msg: string, data?: any) => console.debug(`[ConsoleService] readAndParseOutput - ${msg}`, data || '');
    logger('Starting to read output');
    
    let buffer = '';
    let outputStarted = false;
    // let timeout = 10000;
    // const startTime = Date.now();

    try {
      const transport = this.deviceService.getTransport();
      if (!transport || !transport.device.readable) {
        const error = 'Device transport not readable';
        logger(error);
        return {
          success: false,
          error
        };
      }

      logger('Transport is readable, waiting for data');
      while (true) {
        const { text, done } = await this.deviceService.readAndDecodeFromDevice();
        
        if (done) {
          logger('Read operation done');
          break;
        }
        
        if (text) {
          buffer += text;
          this.updateFullLog(text);

          let current_buffer = text;
          const truncate = (str: string, len = 50) => str.substring(0, len) + (str.length > len ? '...' : '');
          logger('Received text', truncate(text));
          logger('Current buffer', truncate(buffer));
          
          if (!outputStarted && buffer.includes('######START REQUEST######')) {
            logger('Start marker found');
            outputStarted = true;
            buffer = buffer.split('######START REQUEST######')[1];
            current_buffer = buffer;
          }

          if (outputStarted) {
            current_buffer = current_buffer.split('>>')[0];
            logger('Streaming output');
            streamCallback({
              name: 'stdout',
              text: current_buffer
            });
          }

          if (outputStarted && buffer.includes('>>>')) {
            const output = buffer.split('>>>')[0].trim();
            logger('Output complete', truncate(output));
            return { success: true };
          }
        }

        // TODO: Need understand how to use timeout correctly
        // if (Date.now() - startTime > timeout) {
        //   logger('Timeout reached');
        //   return {
        //     success: false,
        //     error: 'Command execution timed out'
        //   };
        // }

        await new Promise(resolve => setTimeout(resolve, 20));
      }

      logger('Completed successfully');
      return { success: true };
    } catch (err) {
      logger('Error occurred');
      return { 
        success: false, 
        error: ErrorHandler.getErrorMessage(err)
      };
    }
  }

  async executeCommand(
    code: string,
    streamCallback: StreamCallback
  ): Promise<ReadOutputResult> {
    const logger = (msg: string, data?: any) => console.debug(`[ConsoleService] executeCommand - ${msg}`, data || '');
    logger('Starting command execution');
    
    try {
      logger('Sending command to device');
      const sendSuccess = await this.deviceService.sendCommand(code);
      if (!sendSuccess) {
        logger('Failed to send command');
        return {
          success: false,
          error: 'Failed to send command to device'
        };
      }

      logger('Command sent, reading output');
      const result = await this.readAndParseOutput(streamCallback);
      logger('Command execution completed', { success: result.success });
      return result;
    } catch (err) {
      logger('Error occurred');
      return {
        success: false,
        error: ErrorHandler.getErrorMessage(err)
      };
    }
  }

  async resetConsole(): Promise<void> {
    const logger = (msg: string) => console.debug(`[ConsoleService] resetConsole - ${msg}`);
    logger('Sending reset sequence');
    
    try {
      await this.deviceService.sendInterrupt();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const encoder = new TextEncoder();
      const newLine = encoder.encode('\r\n');

      const transport = this.deviceService.getTransport();
      if (transport && transport.device.writable) {
        const writer = transport.device.writable.getWriter();
        await writer.write(newLine);
        await writer.write(newLine);
        writer.releaseLock();
      }
      
      logger('Reset sequence complete');
    } catch (err) {
      logger(`Error during reset: ${ErrorHandler.getErrorMessage(err)}`);
    }
  }
}
