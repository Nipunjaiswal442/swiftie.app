import React, { useRef, useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../services/userService';
import { compressImage } from '../utils/compressImage';

interface Props {
  currentPhotoUrl?: string;
  onPhotoUpdate: (url: string) => void;
}

export const PhotoUploader: React.FC<Props> = ({ currentPhotoUrl, onPhotoUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { firebaseUser } = useAuth();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const storageRef = ref(storage, `users/${firebaseUser.uid}/profile.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, compressed);

      uploadTask.on('state_changed', (snapshot) => {
        setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      });

      await uploadTask;
      const url = await getDownloadURL(storageRef);
      await updateMe({ profilePhotoUrl: url });
      onPhotoUpdate(url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
    setProgress(0);
  };

  return (
    <div className="photo-uploader">
      <div className="profile-photo-container" onClick={() => fileInputRef.current?.click()}>
        {currentPhotoUrl ? (
          <img src={currentPhotoUrl} alt="Profile" className="profile-photo" />
        ) : (
          <div className="profile-photo-placeholder">+</div>
        )}
        {uploading && (
          <div className="upload-overlay">
            <span>{progress}%</span>
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleUpload}
      />
    </div>
  );
};
