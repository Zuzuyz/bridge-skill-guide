import { Link } from "@tanstack/react-router";
import { Bot, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { askSkillBuddy } from "@/services/mock-api";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
const prompts = ["Why is my readiness score 72%?", "What should I learn next?", "What internships match my skills?"];

export function SkillBuddyChat({ embedded = false }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "welcome", role: "assistant", content: "Hi Shubham — I’m SkillBuddy. I can explain your readiness, skill gaps, roadmap, and best-fit opportunities." }]);
  const [status, setStatus] = useState<"ready" | "submitted">("ready");
  const send = async (text: string) => { if (!text.trim() || status === "submitted") return; setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: text }]); setStatus("submitted"); const answer = await askSkillBuddy(text); setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: answer }]); setStatus("ready"); };
  return <div className={embedded ? "flex h-full min-h-[620px] flex-col overflow-hidden rounded-xl border bg-card soft-shadow" : "flex h-full flex-col"}><div className="flex items-center gap-3 border-b p-4"><span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot className="size-5"/></span><div><h2 className="font-display font-bold">SkillBuddy</h2><p className="text-xs text-muted-foreground">Career intelligence assistant</p></div></div><Conversation className="min-h-0"><ConversationContent className="gap-5 p-5">{messages.map((message) => <Message key={message.id} from={message.role}><MessageContent className={message.role === "user" ? "bg-secondary text-secondary-foreground" : ""}><MessageResponse>{message.content}</MessageResponse></MessageContent></Message>)}{status === "submitted" && <Message from="assistant"><MessageContent><Shimmer>Connecting your skills to industry data...</Shimmer></MessageContent></Message>}<ConversationScrollButton/></ConversationContent></Conversation><div className="border-t p-4"><div className="mb-3 flex flex-wrap gap-2">{prompts.map((prompt) => <Button key={prompt} variant="outline" size="sm" className="h-auto whitespace-normal rounded-full py-1.5 text-xs" onClick={() => send(prompt)}>{prompt}</Button>)}</div><PromptInput onSubmit={({ text }) => send(text)}><PromptInputTextarea placeholder="Ask about your career..." className="min-h-20"/><PromptInputFooter className="justify-end"><PromptInputSubmit status={status}/></PromptInputFooter></PromptInput></div></div>;
}

export function SkillBuddyFloating() {
  const [open, setOpen] = useState(false);
  return <div className="fixed bottom-5 right-5 z-50"><div className={open ? "mb-3 h-[min(680px,calc(100vh-7rem))] w-[min(410px,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-card lift-shadow" : "hidden"}><div className="absolute right-3 top-3 z-10"><Button size="icon-sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Close SkillBuddy"><X/></Button></div><SkillBuddyChat/></div><div className="flex items-center justify-end gap-3"><Link to="/ai-assistant" className="hidden rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm md:block">Ask SkillBuddy about your roadmap</Link><Button className="size-14 rounded-full shadow-lg" onClick={() => setOpen((value) => !value)} aria-label="Open SkillBuddy"><MessageCircle className="size-6"/></Button></div></div>;
}