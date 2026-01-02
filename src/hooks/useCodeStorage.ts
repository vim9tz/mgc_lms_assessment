"use client";
import { useCallback } from "react";

export const useCodeStorage = (questionId: string | number) => {
  const getCode = useCallback((type: string): string => {
    return sessionStorage.getItem(`${type}Code-${questionId}`) || "";
  }, [questionId]);

  const setCode = useCallback((type: string, code: string) => {
    sessionStorage.setItem(`${type}Code-${questionId}`, code);
  }, [questionId]);

  const loadAllCodes = useCallback(() => {
    return {
      html: getCode("html"),
      css: getCode("css"),
      js: getCode("js"),
      python: getCode("python"),
    };
  }, [getCode]);

  return {
    getCode,
    setCode,
    loadAllCodes,
  };
};
