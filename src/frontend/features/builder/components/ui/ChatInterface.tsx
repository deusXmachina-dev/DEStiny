"use client";

import { useChat } from "@ai-sdk/react";
import type { ToolUIPart, UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { nanoid } from "nanoid";
import { useEffect, useMemo, useRef, useState } from "react";

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
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { BACKEND_URL } from "@/config/api";
import { cn } from "@/lib/utils";

import { useBuilder } from "../../hooks/BuilderContext";

interface ChatInterfaceProps {
  className?: string;
}

const isToolPart = (part: { type: string }): part is ToolUIPart =>
  part.type.startsWith("tool-");

// Sync blueprint when any tool completes
function useBlueprintSyncOnToolComplete(
  messages: UIMessage[],
  fetchBlueprint: () => void,
) {
  const processedToolsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") {
        continue;
      }

      for (const part of message.parts) {
        if (
          isToolPart(part) &&
          part.state === "output-available" &&
          part.toolCallId
        ) {
          // Use toolCallId to uniquely identify each tool call
          // Only fetch once per completed tool call
          if (!processedToolsRef.current.has(part.toolCallId)) {
            processedToolsRef.current.add(part.toolCallId);
            fetchBlueprint();
          }
        }
      }
    }
  }, [messages, fetchBlueprint]);
}

const ChatMessage = ({ message }: { message: UIMessage }) => {
  // Render parts in order, grouping consecutive text parts
  const renderParts = () => {
    const elements: React.ReactNode[] = [];
    let currentTextParts: string[] = [];

    const flushText = () => {
      if (currentTextParts.length > 0) {
        const textContent = currentTextParts.join("");
        if (textContent) {
          elements.push(
            <MessageResponse key={`${message.id}-text-${elements.length}`}>
              {textContent}
            </MessageResponse>,
          );
        }
        currentTextParts = [];
      }
    };

    message.parts.forEach((part, index) => {
      if (part.type === "text" && part.text) {
        currentTextParts.push(part.text);
      } else if (isToolPart(part)) {
        // Flush any accumulated text before rendering the tool
        flushText();

        const toolName = part.type.replace("tool-", "").replace(/_/g, " ");
        elements.push(
          <Tool key={`${message.id}-tool-${index}`} defaultOpen={false}>
            <ToolHeader
              title={toolName}
              type={part.type}
              state={part.state}
            />
            <ToolContent>
              {part.input != null && <ToolInput input={part.input} />}
              <ToolOutput
                output={part.output}
                errorText={part.errorText}
              />
            </ToolContent>
          </Tool>,
        );
      }
    });

    // Flush any remaining text at the end
    flushText();

    return elements;
  };

  return (
    <Message from={message.role} key={message.id}>
      <MessageContent>{renderParts()}</MessageContent>
    </Message>
  );
};

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const [input, setInput] = useState("");
  const chatId = useMemo(() => nanoid(), []);
  const { fetchBlueprint } = useBuilder();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${BACKEND_URL}/api/chat`,
        fetch: (url, options) =>
          // this is here to ensure the session cookie is sent to the backend
          fetch(url, { ...options, credentials: "include" }),
      }),
    [],
  );

  const { messages, sendMessage, status } = useChat({ id: chatId, transport });

  useBlueprintSyncOnToolComplete(messages, fetchBlueprint);

  const handleSubmit = (
    { text }: { text: string },
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!text.trim()) {
      return;
    }
    sendMessage({ text });
    setInput("");
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
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="w-full px-4 pb-4 pt-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
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
