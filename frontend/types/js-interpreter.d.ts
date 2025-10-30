declare module 'js-interpreter' {
  export default class Interpreter {
    constructor(code: string, initFunc?: (interpreter: any, globalObject: any) => void);
    step(): boolean;
    run(): void;
    setProperty(obj: any, name: string, value: any): void;
    nativeToPseudo(value: any): any;
    pseudoToNative(value: any): any;
    getProperty(obj: any, name: string): any;
  }
}
