import { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import ReactMarkdown from 'react-markdown';


const ChatWidget = () => {
  const { messages, isTyping, sendMessage, suggestPlan, clearMessages } = useChat();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isChatOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isChatOpen, messages, isTyping]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.trim()) return;

    const message = draft;
    setDraft('');
    await sendMessage(message);
  };

  return (
    <div className="chat-widget">
      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="chat-fab"
          aria-label="Otwórz czat AI"
        >
          AI
        </button>
      )}

      {isChatOpen && (
        <section className="chat-panel" aria-label="Czat z asystentem AI">
          <header className="chat-header">
            <div>
              <strong>Asystent planowania</strong>
              <span>Plan dnia, priorytety, kolejność pracy</span>
            </div>
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              aria-label="Zamknij czat AI"
            >
              ×
            </button>
          </header>

          <div className="chat-actions">
            <button type="button" onClick={suggestPlan} disabled={isTyping}>
              Zaproponuj plan
            </button>
            <button type="button" onClick={clearMessages} disabled={isTyping}>
              Wyczyść
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
                {message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="chat-message assistant">
                <p className="typing-dots"><span /> <span /> <span /></p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="chat-form">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Napisz do asystenta..."
              disabled={isTyping}
            />
            <button type="submit" disabled={isTyping || !draft.trim()}>
              Wyślij
            </button>
          </form>
        </section>
      )}
    </div>
  );
};

export default ChatWidget;
