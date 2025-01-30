export interface Conversation {
  id: string;
  role: string;
  text: string;
  timestamp: string;
  isFinal: boolean;
  status?: "speaking" | "processing" | "complete";
}
