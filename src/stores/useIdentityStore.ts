import { create } from 'zustand';
import { v4 as uuidv4 } from 'crypto';

function generateId(): string {
  return crypto.randomUUID();
}

function getOrCreateId(): string {
  const stored = localStorage.getItem('echo_anonymous_id');
  if (stored) return stored;
  const id = generateId();
  localStorage.setItem('echo_anonymous_id', id);
  return id;
}

interface IdentityStore {
  anonymousId: string;
  resetIdentity: () => void;
}

export const useIdentityStore = create<IdentityStore>((set) => ({
  anonymousId: getOrCreateId(),
  resetIdentity: () => {
    const newId = generateId();
    localStorage.setItem('echo_anonymous_id', newId);
    set({ anonymousId: newId });
  },
}));
