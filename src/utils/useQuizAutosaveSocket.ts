import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

export const useQuizAutosaveSocket = (
  socket: Socket,
  quizSession: any,
  userId : any,
  subTopicId : any
) => {
  useEffect(() => {
    if (!quizSession) return;

    const interval = setInterval(() => {
      const payload = {
        type: 'quiz',
        timestamp: new Date().toISOString(),
        userId,
        subTopicId,
        data: {
          currentIndex: quizSession.currentIndex,
          answers: quizSession.answers,
        },
      };

      console.log("📤 Sending quiz autosave:", payload);
      socket.emit("sessionData", payload);
    }, 5000);

    return () => clearInterval(interval);
  }, [quizSession, socket]);
};
