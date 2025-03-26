import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FileIcon, ImageIcon, FileTextIcon, FileCodeIcon, FileArchiveIcon, FileVideoIcon, FileAudioIcon } from "lucide-react";
import React, { JSX } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileTypeIcon(filename: string, className = ''): JSX.Element {
  const extension = filename.split('.').pop()?.toLowerCase();

  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension || '')) {
    return React.createElement(ImageIcon, { className });
  }

  // Text files
  if (['txt', 'md', 'rtf', 'csv', 'json', 'xml', 'log'].includes(extension || '')) {
    return React.createElement(FileTextIcon, { className });
  }

  // Code files
  if (['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'php', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'swift'].includes(extension || '')) {
    return React.createElement(FileCodeIcon, { className });
  }

  // Archive files
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(extension || '')) {
    return React.createElement(FileArchiveIcon, { className });
  }

  // Video files
  if (['mp4', 'webm', 'mov', 'avi', 'wmv', 'flv', 'mkv'].includes(extension || '')) {
    return React.createElement(FileVideoIcon, { className });
  }

  // Audio files
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(extension || '')) {
    return React.createElement(FileAudioIcon, { className });
  }

  // Default file icon
  return React.createElement(FileIcon, { className });
}
