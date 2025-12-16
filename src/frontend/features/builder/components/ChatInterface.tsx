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
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { BACKEND_URL } from "@/config/api";
import { cn } from "@/lib/utils";

import { useBuilder } from "../hooks/BuilderContext";

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

const LoadingDots = () => (
  <Message from="assistant">
    <MessageContent className="py-0">
      <Shimmer duration={1.4} className="text-4xl leading-none -my-1">
        ...
      </Shimmer>
    </MessageContent>
  </Message>
);

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
            <ToolHeader title={toolName} type={part.type} state={part.state} />
            <ToolContent>
              {part.input != null && <ToolInput input={part.input} />}
              <ToolOutput output={part.output} errorText={part.errorText} />
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

// Submit button component that can access attachments context
const ChatSubmitButton = ({
  input,
  isLoading,
}: {
  input: string;
  isLoading: boolean;
}) => {
  const attachments = usePromptInputAttachments();
  const hasContent = input.trim() || attachments.files.length > 0;

  return (
    <PromptInputSubmit
      disabled={!hasContent || isLoading}
      status={isLoading ? "submitted" : "ready"}
    />
  );
};

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const [input, setInput] = useState("");
  const chatId = useMemo(() => nanoid(), []);
  const { fetchBlueprint } = useBuilder();

  const suggestions: Array<{ name: string; prompt: string }> = [
    {
      name: "Simple Manufacturing",
      prompt:
        "Create a manufacturing line with only a source, manufacturing cell, and sink connected in sequence. Do not add any additional entities or logic.",
    },
    {
      name: "Buffered Production",
      prompt:
        "Set up a production line with a source, manufacturing cell, buffer, another manufacturing cell, and sink",
    },
    {
      name: "Quality Controlled Line",
      prompt:
        "Create a manufacturing line with a source, manufacturing cell, and quality control (with OK and NOK outputs). Route NOK items to a sink below the manufacturing cell. Buffer OK items and feed them to another manufacturing cell, then route the final OK items to a sink.",
    },
  ];

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
    message: PromptInputMessage,
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const hasText = Boolean(message.text?.trim());
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage({
      text: message.text || "Sent with attachments",
      files: message.files,
    });
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
          {isLoading && <LoadingDots />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="grid shrink-0 gap-4 pt-4">
        <Suggestions className="w-full px-4">
          {suggestions.map((scenario) => (
            <Suggestion
              key={scenario.name}
              onClick={() => sendMessage({ text: scenario.prompt })}
              suggestion={scenario.prompt}
            >
              {scenario.name}
            </Suggestion>
          ))}
        </Suggestions>
        <div className="w-full px-4 pb-4">
          <PromptInput onSubmit={handleSubmit} multiple>
            <PromptInputHeader>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                placeholder="Start building your simulation..."
                onChange={(e) => setInput(e.target.value)}
                value={input}
              />
            </PromptInputBody>
            <PromptInputFooter className="flex justify-between">
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>
              <ChatSubmitButton input={input} isLoading={isLoading} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
};

export { ChatInterface };
