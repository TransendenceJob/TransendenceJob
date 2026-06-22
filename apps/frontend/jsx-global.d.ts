// Global (non-module) JSX augmentation so editor/tsserver always sees DOM elements.
// This file intentionally has no imports so it's treated as a global script.
declare namespace JSX {
  interface IntrinsicElements {
    // common HTML elements used in the app
    div: any;
    span: any;
    p: any;
    a: any;
    button: any;
    input: any;
    label: any;
    form: any;
    img: any;
    svg: any;
    path: any;
    // fallback for other element names
    [elemName: string]: any;
  }
}

export {};
