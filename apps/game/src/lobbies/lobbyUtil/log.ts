const DEBUG_OUTPUT = true;
export const log = DEBUG_OUTPUT
  ? (msg: string) => {
      console.log('DEBUG: ', msg);
    }
  : (msg: string) => {};

export type logType = (msg: string) => void;
