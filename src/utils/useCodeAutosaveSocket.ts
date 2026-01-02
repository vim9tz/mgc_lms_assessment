import { useEffect } from "react";
import { Socket } from "socket.io-client";

export const useCodeAutosaveSocket = (
  socket: Socket,
  selectedFile: string,
  fileContent: string,
  userId: string,
  subTopicId: string
) => {
  useEffect(() => {
    if (!selectedFile || !fileContent) return;

    const interval = setInterval(() => {
      const payload = {
        type: 'code',
        timestamp: new Date().toISOString(),
        userId,
        subTopicId,
        data: {
          selectedFile,
          fileContent,
        },
      };

      console.log("📤 Sending code autosave:", payload);
      socket.emit("sessionData", payload);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedFile, fileContent, socket, userId, subTopicId]);
};
