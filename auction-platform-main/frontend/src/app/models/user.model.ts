/**
 * Interface representing a user in the auction system
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** Full name of the user */
  name: string;
  /** Email address of the user */
  email: string;
  /** Optional URL to user's profile picture */
  profilePicture?: string;
  /** Role of the user in the system */
  role: 'USER' | 'SELLER';
}
