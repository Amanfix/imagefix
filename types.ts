export type AppMode = 'generator' | 'editor' | 'remover';

export interface EditedImageResponse {
  imageUrl: string | null;
  text: string | null;
}
