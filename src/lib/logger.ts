type LogMethod = (...args: any[]) => void;

interface Logger {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

const isDev = import.meta.env.DEV === true;

export const logger: Logger = {
  debug: (...args) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  },
  info: (...args) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  },
  warn: (...args) => {
     
    console.warn(...args);
  },
  error: (...args) => {
     
    console.error(...args);
  },
};


