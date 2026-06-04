// Provide JSX intrinsic element typings for React DOM elements used in the app.
// This augments the global `JSX.IntrinsicElements` so common HTML tags
// (e.g. <button>, <div>, <span>, <input>, <a>, <form>, <label>) are recognized.
// Import only types from React — this file must remain a type-only module.
import type {
  DetailedHTMLProps,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  AnchorHTMLAttributes,
  FormHTMLAttributes,
  LabelHTMLAttributes,
  HTMLAttributes,
} from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      button: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      div: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      span: DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      input: DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
      a: DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
      form: DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
      label: DetailedHTMLProps<LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;
      // fallback for other element names
      [elemName: string]: any;
    }
  }
}

export {};
