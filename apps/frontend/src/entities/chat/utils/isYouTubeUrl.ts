export const extractYouTubeID = (url: string): string | null => {
  // Patterns: https://youtu.be/ID , https://www.youtube.com/watch?v=ID , youtu.be/ID
  const regex = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}; 