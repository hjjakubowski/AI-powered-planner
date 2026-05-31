/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

const initialMessages = [
  { role: 'assistant', content: 'Cześć, mogę pomóc ułożyć plan dnia na podstawie Twoich otwartych zadań.' },
];

const ChatContext = createContext();

const getStorageKey = (user) => {
  if (!user) return null;
  return `planner.chat.messages.${user.id ?? user.username}`;
};

export const ChatProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const storageKey = useMemo(() => getStorageKey(user), [user]);
  const [messages, setMessages] = useState(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [loadedStorageKey, setLoadedStorageKey] = useState(null);

  useEffect(() => {
    setLoadedStorageKey(null);

    if (!storageKey) {
      setMessages(initialMessages);
      return;
    }

    try {
      const savedMessages = localStorage.getItem(storageKey);
      setMessages(savedMessages ? JSON.parse(savedMessages) : initialMessages);
    } catch {
      setMessages(initialMessages);
    } finally {
      setLoadedStorageKey(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || loadedStorageKey !== storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [loadedStorageKey, messages, storageKey]);

  const appendAssistantError = (nextMessages) => {
    setMessages([...nextMessages, {
      role: 'assistant',
      content: 'Nie udało się połączyć z asystentem. Spróbuj ponownie za chwilę.',
    }]);
  };

  const sendMessage = async (content) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isTyping) return;

    const nextMessages = [...messages, { role: 'user', content: trimmedContent }];
    setMessages(nextMessages);
    setIsTyping(true);

    try {
      const response = await api.post('/ai/chat', { message: trimmedContent });
      setMessages([...nextMessages, { role: 'assistant', content: response.data.reply }]);
    } catch (error) {
      console.error('Błąd AI', error);
      appendAssistantError(nextMessages);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestPlan = async () => {
    if (isTyping) return;

    const planRequest = 'Zaproponuj konkretny plan dnia na podstawie moich zadań TODO i DOING.';
    const nextMessages = [...messages, { role: 'user', content: planRequest }];
    setMessages(nextMessages);
    setIsTyping(true);

    try {
      let response;
      try {
        response = await api.post('/ai/suggest-plan', {});
      } catch (suggestError) {
        if (suggestError.response?.status === 404) {
          response = await api.post('/ai/chat', { message: planRequest });
        } else {
          throw suggestError;
        }
      }
      setMessages([...nextMessages, { role: 'assistant', content: response.data.reply }]);
    } catch (error) {
      console.error('Błąd AI planu', error);
      appendAssistantError(nextMessages);
    } finally {
      setIsTyping(false);
    }
  };

  const clearMessages = () => {
    setMessages(initialMessages);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, isTyping, sendMessage, suggestPlan, clearMessages }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used inside ChatProvider');
  }
  return context;
};
