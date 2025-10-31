import { useState } from "react";
import { WhatsAppButton } from "./WhatsAppButton";
import { ChatbotFAQ } from "./ChatbotFAQ";

export function SupportIntegration() {
  const [showChatbot, setShowChatbot] = useState(false);

  return (
    <>
      <WhatsAppButton />
      {showChatbot && <ChatbotFAQ />}
    </>
  );
}

