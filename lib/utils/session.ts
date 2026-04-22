import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'chat_session_id';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return uuidv4();

  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function generateSessionId(): string {
  return uuidv4();
}
