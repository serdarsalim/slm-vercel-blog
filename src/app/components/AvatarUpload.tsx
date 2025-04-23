"use client";

import { useState, useRef } from "react";
import Image from "next/image";

export default function AvatarUpload({ 
  currentAvatar, 
  onAvatarChange 
}: { 
  currentAvatar?: string | null,
  onAvatarChange: (url: string) => void
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Upload file
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload avatar');
      }
      
      const result = await response.json();
      onAvatarChange(result.avatar_url);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
      // Reset to previous avatar on error
      setPreviewUrl(currentAvatar);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center mb-6">
      <div 
        className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-3 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <Image 
            src={previewUrl} 
            alt="Avatar preview"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">
            {/* Default avatar placeholder */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
          </svg>
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Click to upload avatar
      </p>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}