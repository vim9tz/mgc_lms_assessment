import { WebContainer } from "@webcontainer/api";

let instance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export const getWebContainerInstance = async (): Promise<WebContainer> => {
  if (instance) return instance;

  if (!bootPromise) {
    bootPromise = WebContainer.boot().then((wc) => {
      instance = wc;
      return wc;
    });
  }

  return bootPromise;
};
