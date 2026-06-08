export interface SpaceEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO String
  type: 'conjunction' | 'meteor_shower' | 'eclipse' | 'close_approach' | 'other';
  imageUrl: string;
  likesCount: number;
  createdAt: any; // Firestore timestamp
}
