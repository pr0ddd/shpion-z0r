import { create } from 'zustand';

interface PreviewState {
  previews: Record<string,string>; // trackSid -> dataUrl
  setPreview: (sid:string, dataUrl:string)=> void;
}

export const usePreviewStore = create<PreviewState>((set)=>({
  previews:{},
  setPreview:(sid,dataUrl)=> set((s)=>({ previews:{ ...s.previews, [sid]: dataUrl } }))
})); 