import { useEffect, useState, useRef } from "react";
import { User, Menu, X, Rocket, Plus, Send, Type, Brain, Database, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/useUser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

type Section = "form-filler" | "my-documents" | "my-ai" | "schemes" | "share-docs";
type ChatMessage = {
  sender: 'user' | 'ai';
  content: string;
};
type DocumentData = {
  filename:string,
  download_url:string
}

type GovntSchmes = {
  title: string,
  desc: string
}

const SERVER_URL = `http://localhost:8000`
const PY_SERVER_URL = `http://localhost:8001`


export function Dashboard() {

  let { data } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("form-filler");
  const [chatMessage, setChatMessage] = useState("");
  const [eligibilityDialog, setEligibilityDialog] = useState<{ open: boolean, scheme: string, eligible: boolean } | null>(null);
  const [fontSize, setFontSize] = useState("normal");
  const [selectedShareButtons, setSelectedShareButtons] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isRagMode, setIsRagMode] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [schemes,setSchemes] = useState<GovntSchmes[]>([])

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const sidebarItems = [
    { id: "form-filler" as Section, label: "Form Filler", icon: "📝" },
    { id: "my-documents" as Section, label: "My Documents", icon: "📄" },
    { id: "my-ai" as Section, label: "My AI", icon: "🤖" },
    { id: "schemes" as Section, label: "Schemes & Eligibility", icon: "🎯" },
    { id: "share-docs" as Section, label: "Share Docs", icon: "📤" },
  ];


  useEffect(()=>{
    setChatMessages([])

    if(activeSection == "my-documents"){
      fetchMyDocuments()
    }else if(activeSection == "schemes"){
      fetchSchemes()
    }
  },[activeSection])

  const fetchMyDocuments = async () =>{
    try{
      let response = await fetch(`${PY_SERVER_URL}/list-files`)
      let data = await response.json()

      setDocuments(data)
    }catch(err){
      console.error(`Error occured `,err)
    }
  }

  const fetchSchemes = async () =>{
    try{
      let response = await fetch(`${PY_SERVER_URL}/government-schemes`)
      let data = await response.json()
      setSchemes(data?.result)
    }catch(err){
      console.error(`Error occured `,err)
    }
  }

  const handleDocumentDownload = async (fileName: string) => {
    try {
      const response = await fetch(`${PY_SERVER_URL}/download/${fileName}`);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error occurred", err);
    }
  };

  const sendAiQuerytoNodeServer = async () => {
    if (!chatMessage.trim() || isStreaming) return;

    const currentMessage = chatMessage;
    setChatMessages(prev => [...prev, { sender: 'user', content: currentMessage }]);
    setChatMessage("");

    try {
      if (isRagMode) {
        const response = await fetch(`${PY_SERVER_URL}/myai`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: currentMessage
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setChatMessages(prev => [...prev, {
          sender: 'ai',
          content: data.result || "No response received"
        }]);
      } else {
        setIsStreaming(true);
        const endpoint = '/api/ai/stream';
        const response = await fetch(`${SERVER_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: currentMessage
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No reader available');
        }

        const decoder = new TextDecoder();
        let accumulatedText = "";

        setChatMessages(prev => [...prev, { sender: 'ai', content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          setChatMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              sender: 'ai',
              content: accumulatedText
            };
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error('Error streaming AI response:', error);
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        content: "Error: Failed to get response from AI"
      }]);
    } finally {
      setIsStreaming(false);
    }
  }

  const performShareDoc = async () => {
    if (!chatMessage.trim() || isStreaming) return;

    const currentMessage = chatMessage;
    setChatMessages(prev => [...prev, { sender: 'user', content: currentMessage }]);
    setChatMessage("");
    const server_uri = "http://34.235.132.37:8000"
    try {
      console.log(data?.id)
      const response = await fetch(`${server_uri}/mycollections/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin':"*"
        },
        body: JSON.stringify({
          query: chatMessage,
          user_id: data?.id
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resp = await response.json();
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        content: resp.result || "No response received"
      }]);
    } catch (err) {

    }

  }

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToServer = async () => {
    if (!audioBlob) return;

    const currentMessage = "🎤 [Audio Message]";
    setChatMessages(prev => [...prev, { sender: 'user', content: currentMessage }]);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch(`${SERVER_URL}/api/ai/audio-transcribe`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const transcribedText = result.text || "Could not transcribe audio";
      
      setChatMessage(transcribedText);      
      setAudioBlob(null);
    } catch (error) {
      console.error('Error sending audio:', error);
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        content: "Error: Failed to process audio message"
      }]);
      setAudioBlob(null);
    }
  };

  const renderContent = () => {
    switch (activeSection) {

      case "form-filler":
        return (
          <div className="h-full flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-large-ui text-foreground">Form Filler</h2>
              <Button className="bg-primary hover:bg-primary-dark text-primary-foreground flex items-center gap-2 px-6 py-3 text-comfortable hover-scale">
                <Rocket className="w-5 h-5" />
                Launch
              </Button>
            </div>

            <Card className="flex-1 p-8 bg-card border border-border rounded-lg flex flex-col min-h-[500px]">
              {/* Vertically centered content */}
              <div className="flex-1 flex flex-col justify-center items-center">
                <h3 className="text-3xl font-semibold text-foreground mb-4">
                  What service do you need help with?
                </h3>
                <p className="text-muted-foreground text-xl text-center">
                  Just type your request below and let us handle the complicated forms!
                </p>
              </div>

              {/* Chat input (textarea + send button) docked at the bottom */}
              <div className="flex w-full gap-4 items-center">
                <Textarea
                  placeholder="Type here... e.g., 'help me get a passport' or 'help me book a ticket from Delhi to Mumbai'"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 h-[56px] text-comfortable resize-none border-border text-lg p-4"
                />

                {/* Microphone button */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`h-[56px] px-4 border-2 transition-all duration-200 hover-scale ${
                    isRecording 
                      ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                {/* Send audio button (only show when audio is recorded) */}
                {audioBlob && (
                  <Button
                    size="lg"
                    onClick={sendAudioToServer}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 h-[56px] flex items-center justify-center hover-scale"
                    title="Send Audio"
                  >
                    🎤
                  </Button>
                )}

                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary-dark text-primary-foreground px-8 h-[56px] flex items-center justify-center hover-scale"
                >
                  <Send className="w-6 h-6" />
                </Button>
              </div>
            </Card>



          </div>
        );

      case "my-documents":
        return (
          <div className="h-full flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-large-ui text-foreground">My Documents</h2>
              <Button className="bg-primary hover:bg-primary-dark text-primary-foreground flex items-center gap-2 px-6 py-3 text-comfortable hover-scale">
                <Plus className="w-5 h-5" />
                New
              </Button>
            </div>
            <Card className="flex-1 p-8 bg-card border border-border rounded-lg overflow-auto">
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 auto-rows-fr pb-12">
                {documents.map((doc, index) => (
                  <div key={index} className="relative hover-scale">
                    <div 
                    onClick={()=>handleDocumentDownload(doc.filename)}
                    className="bg-secondary border border-border rounded-lg p-6 h-40 flex items-center justify-center transition-all duration-200 hover:shadow-lg">
                      <span className="text-2xl text-muted-foreground">📄</span>
                    </div>
                    <button
                      className="
                  absolute -top-3 -right-3
                  bg-destructive text-destructive-foreground
                  rounded-full w-8 aspect-square p-0
                  flex items-center justify-center
                  border-2 border-white shadow-md
                  transition-all duration-200 hover:scale-110 hover:bg-destructive/90
                  z-10
                "
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-center mt-3 text-muted-foreground text-sm font-medium">{doc.filename}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );


      case "my-ai":
        return (
          <div className="h-full flex flex-col animate-fade-in">
            <div className="mb-8">
              <h2 className="text-large-ui text-foreground">My AI</h2>
            </div>

            <Card className="flex-1 p-8 bg-card border border-border rounded-lg flex flex-col min-h-[500px]">
              <div className="flex-1 mb-6 p-4 bg-secondary rounded-lg border border-border overflow-y-auto">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-4 p-3 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-primary-foreground ml-auto max-w-3/4' : 'bg-muted text-foreground mr-auto max-w-3/4'}`}
                  >
                    <div className="whitespace-pre-wrap text-lg">
                      {msg.content}
                      {msg.sender === 'ai' && index === chatMessages.length - 1 && isStreaming && (
                        <span className="animate-pulse">▋</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Show prompt when no messages */}
                {chatMessages.length === 0 && (
                  <div className="flex-1 flex flex-col justify-center items-center h-full">
                    <h3 className="text-3xl font-semibold text-foreground mb-4">
                      Have a question about your documents?
                    </h3>
                    <p className="text-muted-foreground text-xl text-center mb-4">
                      Type your question, such as:
                    </p>
                    <ul className="text-muted-foreground text-lg space-y-3 text-left max-w-lg mx-auto">
                      <li>• "What is my policy number?"</li>
                      <li>• "Show my last appointment date."</li>
                      <li>• "When does my insurance expire?"</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Chat input bar docked at the bottom */}
              <div className="flex w-full gap-4 items-center">
                <Textarea
                  placeholder="Ask me about your documents..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendAiQuerytoNodeServer();
                    }
                  }}
                  className="flex-1 h-[56px] text-comfortable resize-none border-border text-lg p-4"
                />

                {/* Microphone button */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`h-[56px] px-4 border-2 transition-all duration-200 hover-scale ${
                    isRecording 
                      ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                {/* Send audio button (only show when audio is recorded) */}
                {audioBlob && (
                  <Button
                    size="lg"
                    onClick={sendAudioToServer}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 h-[56px] flex items-center justify-center hover-scale"
                    title="Send Audio"
                  >
                    🎤
                  </Button>
                )}

                {/* Toggle button for RAG mode */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsRagMode(!isRagMode)}
                  className={`h-[56px] px-4 border-2 transition-all duration-200 hover-scale ${isRagMode
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  title={isRagMode ? "Switch to Normal AI" : "Switch to RAG AI"}
                >
                  {isRagMode ? (
                    <Database className="w-5 h-5" />
                  ) : (
                    <Brain className="w-5 h-5" />
                  )}
                </Button>

                <Button
                  size="lg"
                  onClick={() => sendAiQuerytoNodeServer()}
                  disabled={isStreaming || !chatMessage.trim()}
                  className="bg-primary hover:bg-primary-dark text-primary-foreground px-8 h-[56px] flex items-center justify-center hover-scale disabled:opacity-50"
                >
                  <Send className="w-6 h-6" />
                </Button>
              </div>

              {/* Mode indicator */}
              <div className="mt-2 text-center">
                <span className={`text-sm px-3 py-1 rounded-full ${isRagMode
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                  }`}>
                  {isRagMode ? "🔍 RAG Mode (Document-aware)" : "🤖 Normal AI Mode"}
                </span>
              </div>
            </Card>
          </div>
        );
      case "schemes":
        return (
          <div className="h-full flex flex-col animate-fade-in">
            <div className="mb-8">
              <h2 className="text-large-ui text-foreground">Schemes & Eligibility</h2>
            </div>
            <Card className="flex-1 p-8 bg-card border border-border rounded-lg overflow-auto">
              <div className="space-y-6">
                {schemes && schemes.map((scheme, index) => (
                  <div
                    key={index}
                    className="flex flex-col justify-between p-6 bg-secondary rounded-lg border border-border hover:shadow-lg transition-all duration-200 hover-scale"
                  >
                    <span className="text-lg font-semibold text-foreground mb-2">{scheme.title}</span>
                    <span className="text-base text-muted-foreground mb-4">{scheme.desc}</span>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const eligible = Math.random() > 0.5;
                        setEligibilityDialog({ open: true, scheme:scheme.title, eligible });
                      }}
                      className="text-comfortable px-8 py-3 border-primary text-primary hover:bg-primary hover:text-primary-foreground hover-scale text-lg mt-auto"
                    >
                      Check Eligibility
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );

      case "share-docs":
        return (
          <div className="h-full flex flex-col animate-fade-in">
            {/* Header with title and Authenticate button */}
            <div className="mb-8 flex justify-between items-center">
              <h2 className="text-large-ui text-foreground">Share Docs</h2>
              <Button
                onClick={() => {
                  // window.location.href = `http://localhost:8000/generate-auth-url?user_id_from_client=962e9020-457f-4fef-9259-9f56020a3ecc`
                }}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                Authenticate
              </Button>
            </div>

            <Card className="flex-1 p-8 bg-card border border-border rounded-lg flex flex-col min-h-[500px]">
              {/* Share type toggle buttons */}
              <div className="flex gap-4 justify-center mb-8 pb-6 border-b border-border">
                {["📧 Email", "💾 Drive", "📅 Calendar"].map((button, index) => (
                  <Button
                    key={index}
                    variant={selectedShareButtons.includes(button) ? "default" : "outline"}
                    onClick={() => {
                      if (button === "📅 Calendar") return;
                      setSelectedShareButtons(prev =>
                        prev.includes(button)
                          ? prev.filter(b => b !== button)
                          : [...prev, button]
                      );
                    }}
                    className={`px-8 py-4 text-lg hover-scale transition-all duration-200 ${selectedShareButtons.includes(button)
                      ? "bg-primary text-primary-foreground"
                      : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      }`}
                  >
                    {button}
                  </Button>
                ))}
              </div>

              {/* Centered prompt */}
              <div className="flex-1 flex flex-col justify-center items-center">
                <h3 className="text-3xl font-semibold text-foreground mb-4">
                  Want to send or save a document?
                </h3>
                <ul className="text-muted-foreground space-y-3 text-left max-w-lg text-xl">
                  <li>• Email a document to a friend or family</li>
                  <li>• Store your paperwork on your drive</li>
                  <li>• Schedule a reminder with your document</li>
                </ul>
              </div>
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 p-3 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-primary-foreground ml-auto max-w-3/4' : 'bg-muted text-foreground mr-auto max-w-3/4'}`}
                >
                  <div className="whitespace-pre-wrap text-lg">
                    {msg.content}
                    {msg.sender === 'ai' && index === chatMessages.length - 1 && isStreaming && (
                      <span className="animate-pulse">▋</span>
                    )}
                  </div>
                </div>
              ))}
              {/* Chat input row at the bottom */}
              <div className="flex w-full gap-4 items-center">
                <Textarea
                  placeholder="Tell me what you want to do with your documents..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 h-[56px] text-comfortable resize-none border-border text-lg p-4"
                />

                {/* Microphone button */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`h-[56px] px-4 border-2 transition-all duration-200 hover-scale ${
                    isRecording 
                      ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                {/* Send audio button (only show when audio is recorded) */}
                {audioBlob && (
                  <Button
                    size="lg"
                    onClick={sendAudioToServer}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 h-[56px] flex items-center justify-center hover-scale"
                    title="Send Audio"
                  >
                    🎤
                  </Button>
                )}

                <Button
                onClick={async ()=>{
                  return await performShareDoc()
                }}
                  size="lg"
                  className="bg-primary hover:bg-primary-dark text-primary-foreground px-8 h-[56px] flex items-center justify-center hover-scale"
                >
                  <Send className="w-6 h-6" />
                </Button>
              </div>
            </Card>
          </div>
        );


      default:
        return <div>Select a section</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-sidebar border-r border-sidebar-border flex flex-col`}>
        <div className="p-4 border-b border-sidebar-border">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            {sidebarOpen && <span className="ml-3 text-comfortable">Dashboard</span>}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              size="lg"
              onClick={() => setActiveSection(item.id)}
              className={`w-full justify-start text-comfortable py-4 hover-scale transition-all duration-200 ${activeSection === item.id
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
                } ${!sidebarOpen ? 'justify-center' : ''}`}
            >
              <span className={`text-xl ${!sidebarOpen ? 'mx-auto' : ''}`}>{item.icon}</span>
              {sidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
            </Button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border p-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Government Services Portal</h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="flex items-center gap-2 px-4 py-3 text-comfortable border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <User className="w-6 h-6" />
                <span>Account</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-comfortable py-3">
                {data ? data.name?.toUpperCase() : "👤 My Account" }
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-comfortable py-3 cursor-pointer flex items-center gap-2"
                onClick={() => {
                  const sizes = ["normal", "large", "extra-large"];
                  const currentIndex = sizes.indexOf(fontSize);
                  const nextIndex = (currentIndex + 1) % sizes.length;
                  setFontSize(sizes[nextIndex]);
                  document.documentElement.className = document.documentElement.className.replace(/font-size-\w+/g, '') + ` font-size-${sizes[nextIndex]}`;
                }}
              >
                <Type className="w-4 h-4" />
                Font Size: {fontSize.replace('-', ' ')}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-comfortable py-3">
                🚪 Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-hidden">
          {renderContent()}
        </main>
      </div>

      {/* Eligibility Dialog */}
      <Dialog open={eligibilityDialog?.open || false} onOpenChange={() => setEligibilityDialog(null)}>
        <DialogContent className={`max-w-2xl ${eligibilityDialog?.eligible ? 'border-green-500 border-2' : 'border-red-500 border-2'} animate-scale-in`}>
          <DialogHeader className="text-center">
            <div className={`px-4 py-2 rounded-lg mb-4 ${eligibilityDialog?.eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <DialogTitle className="text-2xl font-bold">
                {eligibilityDialog?.eligible ? '✅ You are Eligible!' : '❌ Not Eligible'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-lg text-left">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">{eligibilityDialog?.scheme}</h3>

                {eligibilityDialog?.eligible ? (
                  <div className="space-y-3">
                    <p className="text-green-700">🎉 Congratulations! You meet all the requirements for this scheme.</p>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Next Steps:</h4>
                      <ul className="list-disc list-inside space-y-1 text-green-700">
                        <li>Gather required documents</li>
                        <li>Visit nearest government office</li>
                        <li>Submit application form</li>
                        <li>Track application status online</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-red-700">Unfortunately, you don't meet the current eligibility criteria.</p>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">Common Requirements:</h4>
                      <ul className="list-disc list-inside space-y-1 text-red-700">
                        <li>Age requirements (varies by scheme)</li>
                        <li>Income criteria</li>
                        <li>Residence proof</li>
                        <li>Document verification</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}