let messageListeners = new Map();

export function subscribeToConversation(conversationId, callback) {
  if (!messageListeners.has(conversationId)) {
    messageListeners.set(conversationId, new Set());
  }
  messageListeners.get(conversationId).add(callback);

  return () => {
    const listeners = messageListeners.get(conversationId);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        messageListeners.delete(conversationId);
      }
    }
  };
}

export function broadcastNewMessage(conversationId, message) {
  const listeners = messageListeners.get(conversationId);
  if (listeners) {
    listeners.forEach((callback) => {
      try {
        callback(message);
      } catch (err) {
        console.error("Error broadcasting message:", err);
      }
    });
  }
}
