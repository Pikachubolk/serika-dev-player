import { SubtitleCue } from '../types';

export interface ASSStyle {
  name: string;
  fontName: string;
  fontSize: number;
  primaryColor: string;
  secondaryColor: string;
  outlineColor: string;
  backColor: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeOut: boolean;
  scaleX: number;
  scaleY: number;
  spacing: number;
  angle: number;
  borderStyle: number;
  outline: number;
  shadow: number;
  alignment: number;
  marginL: number;
  marginR: number;
  marginV: number;
  encoding: number;
}

export interface ASSEvent extends SubtitleCue {
  layer: number;
  style: string;
  name: string;
  marginL: number;
  marginR: number;
  marginV: number;
  effect: string;
  rawText: string;
}

export interface ASSSubtitle {
  title: string;
  styles: Map<string, ASSStyle>;
  events: ASSEvent[];
}

export const parseASS = (assContent: string): SubtitleCue[] => {
  const lines = assContent.split('\n');
  const sections: Record<string, string[]> = {};
  let currentSection = '';
  
  // Parse sections
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
      currentSection = trimmedLine.slice(1, -1).toLowerCase();
      sections[currentSection] = [];
    } else if (currentSection && trimmedLine) {
      sections[currentSection].push(trimmedLine);
    }
  }
  
  const styles = parseStyles(sections['v4+ styles'] || sections['v4 styles'] || []);
  const events = parseEvents(sections['events'] || [], styles);
  
  return events.map(event => ({
    startTime: event.startTime,
    endTime: event.endTime,
    text: event.text
  }));
};

const parseStyles = (styleLines: string[]): Map<string, ASSStyle> => {
  const styles = new Map<string, ASSStyle>();
  let formatLine = '';
  
  for (const line of styleLines) {
    if (line.startsWith('Format:')) {
      formatLine = line.substring(7).trim();
    } else if (line.startsWith('Style:')) {
      const style = parseStyleLine(line, formatLine);
      if (style) {
        styles.set(style.name, style);
      }
    }
  }
  
  return styles;
};

const parseStyleLine = (styleLine: string, formatLine: string): ASSStyle | null => {
  const values = styleLine.substring(6).split(',');
  const fields = formatLine.split(',').map(f => f.trim());
  
  if (values.length !== fields.length) {
    return null;
  }
  
  const style: Partial<ASSStyle> = {};
  
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i].toLowerCase();
    const value = values[i].trim();
    
    switch (field) {
      case 'name':
        style.name = value;
        break;
      case 'fontname':
        style.fontName = value;
        break;
      case 'fontsize':
        style.fontSize = parseInt(value) || 20;
        break;
      case 'primarycolour':
      case 'primarycolor':
        style.primaryColor = convertASSColor(value);
        break;
      case 'secondarycolour':
      case 'secondarycolor':
        style.secondaryColor = convertASSColor(value);
        break;
      case 'outlinecolour':
      case 'outlinecolor':
        style.outlineColor = convertASSColor(value);
        break;
      case 'backcolour':
      case 'backcolor':
        style.backColor = convertASSColor(value);
        break;
      case 'bold':
        style.bold = value === '1' || value === '-1';
        break;
      case 'italic':
        style.italic = value === '1' || value === '-1';
        break;
      case 'underline':
        style.underline = value === '1';
        break;
      case 'strikeout':
        style.strikeOut = value === '1';
        break;
      case 'scalex':
        style.scaleX = parseFloat(value) || 100;
        break;
      case 'scaley':
        style.scaleY = parseFloat(value) || 100;
        break;
      case 'spacing':
        style.spacing = parseFloat(value) || 0;
        break;
      case 'angle':
        style.angle = parseFloat(value) || 0;
        break;
      case 'borderstyle':
        style.borderStyle = parseInt(value) || 1;
        break;
      case 'outline':
        style.outline = parseFloat(value) || 0;
        break;
      case 'shadow':
        style.shadow = parseFloat(value) || 0;
        break;
      case 'alignment':
        style.alignment = parseInt(value) || 2;
        break;
      case 'marginl':
        style.marginL = parseInt(value) || 0;
        break;
      case 'marginr':
        style.marginR = parseInt(value) || 0;
        break;
      case 'marginv':
        style.marginV = parseInt(value) || 0;
        break;
      case 'encoding':
        style.encoding = parseInt(value) || 1;
        break;
    }
  }
  
  return style as ASSStyle;
};

const parseEvents = (eventLines: string[], styles: Map<string, ASSStyle>): ASSEvent[] => {
  const events: ASSEvent[] = [];
  let formatLine = '';
  
  for (const line of eventLines) {
    if (line.startsWith('Format:')) {
      formatLine = line.substring(7).trim();
    } else if (line.startsWith('Dialogue:')) {
      const event = parseEventLine(line, formatLine, styles);
      if (event) {
        events.push(event);
      }
    }
  }
  
  return events.sort((a, b) => a.startTime - b.startTime);
};

const parseEventLine = (eventLine: string, formatLine: string, styles: Map<string, ASSStyle>): ASSEvent | null => {
  const values = eventLine.substring(9).split(',');
  const fields = formatLine.split(',').map(f => f.trim());
  
  if (values.length < fields.length) {
    return null;
  }
  
  const event: Partial<ASSEvent> = {};
  
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i].toLowerCase();
    let value = i < values.length - 1 ? values[i].trim() : values.slice(i).join(',').trim();
    
    switch (field) {
      case 'layer':
        event.layer = parseInt(value) || 0;
        break;
      case 'start':
        event.startTime = parseASSTime(value);
        break;
      case 'end':
        event.endTime = parseASSTime(value);
        break;
      case 'style':
        event.style = value;
        break;
      case 'name':
        event.name = value;
        break;
      case 'marginl':
        event.marginL = parseInt(value) || 0;
        break;
      case 'marginr':
        event.marginR = parseInt(value) || 0;
        break;
      case 'marginv':
        event.marginV = parseInt(value) || 0;
        break;
      case 'effect':
        event.effect = value;
        break;
      case 'text':
        event.rawText = value;
        event.text = processASSText(value);
        break;
    }
  }
  
  if (event.startTime !== undefined && event.endTime !== undefined && event.text) {
    return event as ASSEvent;
  }
  
  return null;
};

const parseASSTime = (timeStr: string): number => {
  // Format: H:MM:SS.CC (centiseconds)
  const match = timeStr.match(/(\d+):(\d{2}):(\d{2})\.(\d{2})/);
  if (!match) return 0;
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseInt(match[3]);
  const centiseconds = parseInt(match[4]);
  
  return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
};

const convertASSColor = (colorStr: string): string => {
  // ASS colors can be in format &Hbbggrr& or decimal
  if (colorStr.startsWith('&H') && colorStr.endsWith('&')) {
    const hex = colorStr.slice(2, -1);
    if (hex.length === 6) {
      // Convert BGR to RGB
      const b = hex.substring(0, 2);
      const g = hex.substring(2, 4);
      const r = hex.substring(4, 6);
      return `#${r}${g}${b}`;
    }
  }
  
  // Try parsing as decimal
  const decimal = parseInt(colorStr);
  if (!isNaN(decimal)) {
    const hex = decimal.toString(16).padStart(6, '0');
    const b = hex.substring(0, 2);
    const g = hex.substring(2, 4);
    const r = hex.substring(4, 6);
    return `#${r}${g}${b}`;
  }
  
  return '#ffffff';
};

const processASSText = (text: string): string => {
  // Remove ASS override tags and process basic formatting
  return text
    .replace(/\{[^}]*\}/g, '') // Remove override tags
    .replace(/\\N/g, '\n') // Soft line break
    .replace(/\\n/g, '\n') // Hard line break
    .replace(/\\h/g, ' ') // Hard space
    .trim();
};

export const getASSStyleForCue = (event: ASSEvent, styles: Map<string, ASSStyle>): React.CSSProperties => {
  const style = styles.get(event.style) || styles.get('Default') || styles.values().next().value;
  
  if (!style) {
    return {};
  }
  
  return {
    fontFamily: style.fontName || 'Arial',
    fontSize: `${style.fontSize}px`,
    color: style.primaryColor || '#ffffff',
    fontWeight: style.bold ? 'bold' : 'normal',
    fontStyle: style.italic ? 'italic' : 'normal',
    textDecoration: [
      style.underline ? 'underline' : '',
      style.strikeOut ? 'line-through' : ''
    ].filter(Boolean).join(' ') || 'none',
    textShadow: style.outline > 0 ? `0 0 ${style.outline}px ${style.outlineColor}` : undefined,
    transform: `scale(${style.scaleX / 100}, ${style.scaleY / 100}) rotate(${style.angle}deg)`,
    letterSpacing: `${style.spacing}px`,
    textAlign: getAlignmentCSS(style.alignment)
  };
};

const getAlignmentCSS = (alignment: number): 'left' | 'center' | 'right' => {
  // ASS alignment: 1=left, 2=center, 3=right (bottom row)
  // 5=left, 6=center, 7=right (middle row)
  // 9=left, 10=center, 11=right (top row)
  switch (alignment % 4) {
    case 1: return 'left';
    case 2: return 'center';
    case 3: return 'right';
    default: return 'center';
  }
};
