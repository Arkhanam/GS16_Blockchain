export type ToastActionElement = JSX.Element;
export interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
}
