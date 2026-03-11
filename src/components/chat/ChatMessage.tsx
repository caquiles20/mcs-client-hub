import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import robotAvatar from '@/assets/robot-avatar.png';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isAssistant = role === 'assistant';
  
  return (
    <div className={cn(
      "flex gap-3 p-4",
      isAssistant ? "bg-mcs-navy/30" : "bg-transparent"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isAssistant 
          ? "bg-white border border-mcs-blue/20" 
          : "bg-mcs-blue/30"
      )}>
        {isAssistant ? (
          <img src={robotAvatar} alt="Bot" className="w-full h-full object-contain p-0.5" />
        ) : (
          <User className="w-4 h-4 text-mcs-cyan" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs font-medium mb-1",
          isAssistant ? "text-mcs-teal" : "text-mcs-cyan"
        )}>
          {isAssistant ? "Asistente MCS" : "Tú"}
        </p>
        
        <div className={cn(
          "text-sm text-foreground prose prose-sm prose-invert max-w-none",
          "[&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:text-foreground",
          "[&_a]:text-mcs-cyan [&_a]:underline",
          "[&_code]:bg-mcs-navy/50 [&_code]:px-1 [&_code]:rounded",
          "[&_pre]:bg-mcs-navy/50 [&_pre]:p-3 [&_pre]:rounded-lg"
        )}>
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : isStreaming ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-mcs-teal rounded-full animate-pulse" />
              <span className="w-2 h-2 bg-mcs-teal rounded-full animate-pulse delay-75" />
              <span className="w-2 h-2 bg-mcs-teal rounded-full animate-pulse delay-150" />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
