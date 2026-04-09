export interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  bio: string;
  profilePhotoUrl: string;
  storageUsedBytes: number;
  registrationId: number;
  createdAt: string;
  updatedAt: string;
}
