'use client';

import { useRef, useEffect } from 'react';
import ChatCard from './ChatCard';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface ChatContainerProps {
  messages: Message[];
}

export default function ChatContainer({ messages }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles["neon-chat-container"]}>

      <div
        ref={scrollRef}
        className="neon-scroll-area"
      >
        {/* Centered column wrapper */}
        <div className="flex justify-center w-full">
          <div className="max-w-[520px] w-full flex flex-col items-center gap-4 pb-10">
            {messages.map((msg, idx) => (
              <ChatCard
                key={msg.id}
                message={msg.text}
                isUser={msg.isUser}
                index={idx}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
