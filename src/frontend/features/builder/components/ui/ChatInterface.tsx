"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { nanoid } from "nanoid";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { BACKEND_URL } from "@/config/api";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const [input, setInput] = useState<string>("");
  const chatId = useMemo(() => nanoid(), []);

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: `${BACKEND_URL}/api/chat?protocol=text`,
        prepareSendMessagesRequest: ({ id, messages, trigger }) => ({
          body: {
            id,
            messages: messages.map((msg) => {
              const textParts = msg.parts.filter(
                (part): part is { type: "text"; text: string } =>
                  part.type === "text",
              );
              const content = textParts.map((part) => part.text).join("");
              return {
                role: msg.role,
                content,
              };
            }),
            trigger: trigger === "submit-message" ? "submit" : "regenerate",
          },
        }),
      }),
    [],
  );

  const {
    messages,
    sendMessage,
    status,
    error: _error,
  } = useChat({
    id: chatId,
    transport,
    onError: (error) => {
      toast.error("Chat error", { description: error.message });
    },
  });

  const handleSubmit = (
    message: { text: string; files: unknown[] },
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!message.text.trim()) {
      return;
    }

    sendMessage({ text: message.text });
    setInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div
      className={cn(
        "relative flex size-full flex-col divide-y overflow-hidden",
        className,
      )}
    >
      <Conversation>
        <ConversationContent>
          {messages.map((message) => {
            const textParts = message.parts.filter(
              (part): part is { type: "text"; text: string } =>
                part.type === "text",
            );
            const content = textParts.map((part) => part.text).join("");

            return (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  <MessageResponse>{content}</MessageResponse>
                </MessageContent>
              </Message>
            );
          })}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="w-full px-4 pb-4 pt-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea onChange={handleInputChange} value={input} />
          </PromptInputBody>
          <PromptInputFooter className="flex justify-end">
            <PromptInputSubmit
              disabled={!input.trim() || isLoading}
              status={isLoading ? "submitted" : "ready"}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};

export { ChatInterface };
