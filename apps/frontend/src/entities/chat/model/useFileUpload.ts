import axios from 'axios';
import { useSessionStore } from '@entities/session';

export type UploadedFileInfo = { url: string; type: 'IMAGE' | 'FILE' };

export const useFileUpload = () => {
  const token = useSessionStore.getState().token;

  const upload = async (file: File, onProgress?: (loaded: number, total: number) => void): Promise<UploadedFileInfo> => {
    const ext = file.name.split('.').pop() || 'bin';
    const contentType = file.type || 'application/octet-stream';

    const { data } = await axios.post<any>('/api/upload/presigned', {
      contentType,
      ext,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { url, key } = data as any;
    await new Promise<void>((resolve, reject)=>{
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.upload.onprogress = (e)=>{ if(onProgress && e.lengthComputable) onProgress(e.loaded, e.total); };
      xhr.onload = () => { if(xhr.status>=200 && xhr.status<300) resolve(); else reject(new Error('Upload failed')); };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(file);
    });

    return { url: key, type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE' };
  };

  return { upload };
}; 