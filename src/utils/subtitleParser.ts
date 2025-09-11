import { SubtitleCue } from '../types';
import { parseASS } from './assParser';

export const parseWebVTT = (vttContent: string): SubtitleCue[] => {
  const cues: SubtitleCue[] = [];
  const lines = vttContent.split('\n');
  let i = 0;

  // Skip WEBVTT header
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (line.includes('-->')) {
      const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
      
      if (timeMatch) {
        const startTime = parseTimeString(timeMatch[1]);
        const endTime = parseTimeString(timeMatch[2]);
        
        i++;
        let text = '';
        
        // Collect text lines until empty line or next cue
        while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
          if (text) text += ' ';
          text += lines[i].trim();
          i++;
        }
        
        if (text) {
          cues.push({
            startTime,
            endTime,
            text: cleanText(text)
          });
        }
      }
    }
    i++;
  }

  return cues;
};

export const parseSRT = (srtContent: string): SubtitleCue[] => {
  const cues: SubtitleCue[] = [];
  const blocks = srtContent.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 3) {
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      
      if (timeMatch) {
        const startTime = parseTimeString(timeMatch[1].replace(',', '.'));
        const endTime = parseTimeString(timeMatch[2].replace(',', '.'));
        
        const text = lines.slice(2).join(' ');
        
        cues.push({
          startTime,
          endTime,
          text: cleanText(text)
        });
      }
    }
  }

  return cues;
};

export const parseSubtitles = async (url: string): Promise<SubtitleCue[]> => {
  try {
    const response = await fetch(url);
    const content = await response.text();
    
    // Check for ASS format
    if (url.toLowerCase().endsWith('.ass') || url.toLowerCase().endsWith('.ssa') || 
        content.includes('[Script Info]') || content.includes('[V4+ Styles]')) {
      return parseASS(content);
    }
    
    // Check for WebVTT format
    if (url.toLowerCase().endsWith('.vtt') || content.includes('WEBVTT')) {
      return parseWebVTT(content);
    } 
    
    // Check for SRT format
    if (url.toLowerCase().endsWith('.srt')) {
      return parseSRT(content);
    }
    
    // Try to auto-detect format
    if (content.includes('-->')) {
      if (content.includes('WEBVTT') || /\d{2}:\d{2}:\d{2}\.\d{3}/.test(content)) {
        return parseWebVTT(content);
      } else if (/\d{2}:\d{2}:\d{2},\d{3}/.test(content)) {
        return parseSRT(content);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing subtitles:', error);
    return [];
  }
};

export const getCurrentSubtitle = (cues: SubtitleCue[], currentTime: number): string => {
  const currentCue = cues.find(cue => 
    currentTime >= cue.startTime && currentTime <= cue.endTime
  );
  
  return currentCue ? currentCue.text : '';
};

const parseTimeString = (timeStr: string): number => {
  const parts = timeStr.split(':');
  const seconds = parseFloat(parts[2]);
  const minutes = parseInt(parts[1]);
  const hours = parseInt(parts[0]);
  
  return hours * 3600 + minutes * 60 + seconds;
};

const cleanText = (text: string): string => {
  // Remove WebVTT/HTML tags and clean up text
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};
