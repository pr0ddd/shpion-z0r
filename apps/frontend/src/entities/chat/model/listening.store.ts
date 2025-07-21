import { create } from 'zustand';

interface ListeningStore {
  map: Record<string, boolean>;
  set: (serverId: string, listening: boolean) => void;
  isListening: (serverId:string)=>boolean;
}

export const useListeningStore = create<ListeningStore>((set,get)=>({
  map:{},
  set:(id,l)=>set(s=>({map:{ ...s.map, [id]: l }})),
  isListening:(id)=>!!get().map[id]
})); 