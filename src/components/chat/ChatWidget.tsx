import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Minimize2, MessageCircle } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useToast } from '@/hooks/use-toast';
import robotAvatar from '@/assets/robot-avatar.png';

const robotAvatarWithCache = `${robotAvatar}?v=5`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWidgetProps {
  userDomain: string;
  clientName: string;
  availableServices?: any[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcs-chatbot`;
const NOC_WHATSAPP_URL = 'https://wa.me/528123528009';

export default function ChatWidget({ userDomain, clientName, availableServices }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>(messages);
  const { toast } = useToast();

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const streamChat = useCallback(async (userMessage: string) => {
    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messagesRef.current, userMsg],
          userDomain,
          clientName,
          availableServices,
        }),
      });

      if (!response.ok) {
        toast({
          title: "Error",
          description: "No se pudo conectar con el asistente.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Error de conexión.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [userDomain, clientName, availableServices, toast]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-transparent hover:scale-105 transition-all duration-300 z-[9999] p-0 overflow-visible group shadow-none border-none ring-0 outline-none"
        size="icon"
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] border-2 border-white overflow-hidden flex items-center justify-center p-0.5 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition-all">
            <img
              src={robotAvatarWithCache}
              alt="AI Assistant"
              className="w-full h-full object-contain animate-bounce-subtle"
              style={{ mixBlendMode: 'normal' }}
            />
          </div>
          <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse z-10" />

          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes wave {
              0%, 100% { transform: rotate(0deg); }
              20%, 60% { transform: rotate(-15deg); }
              40%, 80% { transform: rotate(10deg); }
            }
            @keyframes bounce-subtle {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
            .animate-bounce-subtle {
              animation: bounce-subtle 3s ease-in-out infinite;
            }
            .group:hover .animate-bounce-subtle {
              animation: wave 1s ease-in-out infinite;
              transform-origin: bottom center;
            }
          `}} />
        </div>
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 bg-card/95 backdrop-blur-md border-mcs-blue/30 shadow-2xl z-[9999] flex flex-col transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[550px]'}`}>
      <div className="flex items-center justify-between p-4 border-b border-mcs-blue/30 bg-gradient-secondary/30 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full border border-mcs-blue/30 overflow-hidden bg-white/10 flex items-center justify-center p-1">
            <img src={robotAvatarWithCache} alt="Bot" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Asistente MCS</h3>
            <p className="text-xs text-mcs-cyan font-medium uppercase tracking-tighter">En línea</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <a
            href={NOC_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-green-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
            title="Contactar agente NOC por WhatsApp"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          </a>
          <Button
            onClick={() => setIsMinimized(!isMinimized)}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="min-h-full">
              {messages.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-secondary/20 flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-mcs-teal shadow-glow" />
                  </div>
                  <h4 className="text-foreground font-bold mb-2 text-lg">¡Bienvenido!</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Soy tu asistente técnico de MCS. Puedo ayudarte con dudas de partners, proyectos y tickets del NOC.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <ChatMessage
                    key={index}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={isLoading && index === messages.length - 1 && msg.role === 'assistant'}
                  />
                ))
              )}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <ChatMessage role="assistant" content="" isStreaming />
              )}
            </div>
          </ScrollArea>

          <ChatInput
            onSend={streamChat}
            isLoading={isLoading}
            placeholder="¿En qué puedo apoyarte hoy?"
          />
        </>
      )}
    </Card>
  );
}
