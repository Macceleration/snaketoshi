import { describe, it, expect } from 'vitest';
import { extractYouTubeId, createEmbedUrl, isYouTubeUrl } from './youtube';

describe('youtube', () => {
  describe('extractYouTubeId', () => {
    it('should extract ID from standard watch URL', () => {
      expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('http://youtube.com/watch?v=T3_bjBgB8h4')).toBe('T3_bjBgB8h4');
    });
    
    it('should extract ID from short URL', () => {
      expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('http://youtu.be/T3_bjBgB8h4')).toBe('T3_bjBgB8h4');
    });
    
    it('should extract ID from embed URL', () => {
      expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('http://youtube.com/embed/T3_bjBgB8h4')).toBe('T3_bjBgB8h4');
    });
    
    it('should handle URLs with additional query parameters', () => {
      expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest&index=1')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ?t=42')).toBe('dQw4w9WgXcQ');
    });
    
    it('should handle URLs without protocol', () => {
      expect(extractYouTubeId('youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });
    
    it('should return null for invalid URLs', () => {
      expect(extractYouTubeId('')).toBeNull();
      expect(extractYouTubeId('https://example.com')).toBeNull();
      expect(extractYouTubeId('not a url')).toBeNull();
    });
    
    it('should return null for malformed YouTube URLs', () => {
      expect(extractYouTubeId('https://youtube.com/notawatch')).toBeNull();
      expect(extractYouTubeId('https://youtube.com/watch?v=')).toBeNull();
    });
    
    it('should handle various video ID formats', () => {
      // Standard 11-char alphanumeric with dash and underscore
      expect(extractYouTubeId('https://youtube.com/watch?v=abc-DEF_123')).toBe('abc-DEF_123');
      expect(extractYouTubeId('https://youtube.com/watch?v=0123456789A')).toBe('0123456789A');
    });
  });
  
  describe('createEmbedUrl', () => {
    it('should create basic embed URL', () => {
      expect(createEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });
    
    it('should add autoplay parameter when requested', () => {
      expect(createEmbedUrl('dQw4w9WgXcQ', true)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1');
    });
    
    it('should not add autoplay parameter when false', () => {
      expect(createEmbedUrl('dQw4w9WgXcQ', false)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });
  });
  
  describe('isYouTubeUrl', () => {
    it('should return true for valid YouTube URLs', () => {
      expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(isYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
    });
    
    it('should return false for invalid URLs', () => {
      expect(isYouTubeUrl('')).toBe(false);
      expect(isYouTubeUrl('https://example.com')).toBe(false);
      expect(isYouTubeUrl('not a url')).toBe(false);
    });
  });
});
