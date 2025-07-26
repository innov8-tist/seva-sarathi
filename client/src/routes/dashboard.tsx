import { useState } from "react";
import { User, Menu, X, Rocket, Plus, Send, Settings, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("form-filler");
  const [chatMessage, setChatMessage] = useState("");
  const [eligibilityDialog, setEligibilityDialog] = useState<{open: boolean, scheme: string, eligible: boolean} | null>(null);
  const [fontSize, setFontSize] = useState("normal");
  const [selectedShareButtons, setSelectedShareButtons] = useState<string[]>([]);

  const sidebarItems = [
    { id: "form-filler" as Section, label: "Form Filler", icon: "📝" },
    { id: "my-documents" as Section, label: "My Documents", icon: "📄" },
    { id: "my-ai" as Section, label: "My AI", icon: "🤖" },
    { id: "schemes" as Section, label: "Schemes & Eligibility", icon: "🎯" },
    { id: "share-docs" as Section, label: "Share Docs", icon: "📤" },
  ];

  const mockDocuments = [
    "Document 1", "Document 2", "Document 3", "Document 4",
    "Document 5", "Document 6", "Document 7"
  ];

  const mockSchemes = [
    "Senior Citizen Healthcare Scheme",
    "Pension Benefit Program",
    "Digital Literacy Initiative"
  ];

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
          {mockDocuments.map((doc, index) => (
            <div key={index} className="relative hover-scale">
              <div className="bg-secondary border border-border rounded-lg p-6 h-40 flex items-center justify-center transition-all duration-200 hover:shadow-lg">
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
                // onClick logic...
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-center mt-3 text-muted-foreground text-sm font-medium">{doc}</p>
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
        {/* Vertically centered prompt & examples */}
        <div className="flex-1 flex flex-col justify-center items-center">
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
        
        {/* Chat input bar docked at the bottom */}
        <div className="flex w-full gap-4 items-center">
          <Textarea
            placeholder="Ask me about your documents..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            className="flex-1 h-[56px] text-comfortable resize-none border-border text-lg p-4"
          />
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

case "schemes":
  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="mb-8">
        <h2 className="text-large-ui text-foreground">Schemes & Eligibility</h2>
      </div>
      <Card className="flex-1 p-8 bg-card border border-border rounded-lg overflow-auto">
        <div className="space-y-6">
          {mockSchemes.map((scheme, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-6 bg-secondary rounded-lg border border-border hover:shadow-lg transition-all duration-200 hover-scale"
            >
              <span className="text-lg font-medium text-foreground">{scheme}</span>
              <Button 
                variant="outline" 
                onClick={() => {
                  // Simulate eligibility check
                  const eligible = Math.random() > 0.5;
                  setEligibilityDialog({open: true, scheme, eligible});
                }}
                className="text-comfortable px-8 py-3 border-primary text-primary hover:bg-primary hover:text-primary-foreground hover-scale text-lg"
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
                if (button === "📅 Calendar") return; // Calendar is not toggleable
                setSelectedShareButtons(prev => 
                  prev.includes(button) 
                    ? prev.filter(b => b !== button)
                    : [...prev, button]
                );
              }}
              className={`px-8 py-4 text-lg hover-scale transition-all duration-200 ${
                selectedShareButtons.includes(button)
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

        {/* Chat input row at the bottom */}
        <div className="flex w-full gap-4 items-center">
          <Textarea
            placeholder="Tell me what you want to do with your documents..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            className="flex-1 h-[56px] text-comfortable resize-none border-border text-lg p-4"
          />
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
               className={`w-full justify-start text-comfortable py-4 hover-scale transition-all duration-200 ${
                 activeSection === item.id 
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
                👤 My Account
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