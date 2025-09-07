export type AppMode = 'generator' | 'editor' | 'remover';
export type Theme = 'light' | 'dark';

export interface EditedImageResponse {
  imageUrl: string | null;
  text: string | null;
}