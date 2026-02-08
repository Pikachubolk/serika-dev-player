import { SubtitleCue, SubtitleSegment, SubtitleStyle } from '../types';

interface ParsedCueText {
  text: string;
  lines: SubtitleSegment[][];
}

const DEFAULT_STYLE: SubtitleStyle = {
  fontWeight: 'normal',
  fontStyle: 'normal'
};

export const parseWebVTT = (vttContent: string): SubtitleCue[] => {
  const cues: SubtitleCue[] = [];
  const normalized = vttContent.replace(/\r/g, '');
  const blocks = normalized.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim());
    const timeLineIndex = lines.findIndex(line => line.includes('-->'));
    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const textLines = lines.slice(timeLineIndex + 1).filter(Boolean);
    if (textLines.length === 0) continue;

    const timeMatch = timeLine.match(/([^\s]+)\s*-->\s*([^\s]+)/);
    if (!timeMatch) continue;

    const startTime = parseFlexibleTimeString(timeMatch[1]);
    const endTime = parseFlexibleTimeString(timeMatch[2]);
    const parsedText = parseInlineStyledText(textLines.join('\n'));

    cues.push({
      startTime,
      endTime,
      text: parsedText.text,
      lines: parsedText.lines
    });
  }

  return cues;
};

export const parseSRT = (srtContent: string): SubtitleCue[] => {
  const cues: SubtitleCue[] = [];
  const blocks = srtContent.replace(/\r/g, '').split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    const timeLine = lines.find(line => line.includes('-->'));
    if (!timeLine) continue;

    const timeMatch = timeLine.match(/([^\s]+)\s*-->\s*([^\s]+)/);
    if (!timeMatch) continue;

    const startTime = parseFlexibleTimeString(timeMatch[1]);
    const endTime = parseFlexibleTimeString(timeMatch[2]);

    const textStart = lines.indexOf(timeLine) + 1;
    const parsedText = parseInlineStyledText(lines.slice(textStart).join('\n'));

    cues.push({
      startTime,
      endTime,
      text: parsedText.text,
      lines: parsedText.lines
    });
  }

  return cues;
};

export const parseSubtitles = async (url: string): Promise<SubtitleCue[]> => {
  try {
    const response = await fetch(url);
    const content = await response.text();
    return parseSubtitlesFromString(content, url);
  } catch (error) {
    console.error('Error parsing subtitles:', error);
    return [];
  }
};

export const parseSubtitlesFromString = (content: string, sourceName = ''): SubtitleCue[] => {
  const normalized = content.trim();
  const lowerName = sourceName.toLowerCase();

  if (lowerName.endsWith('.ass') || lowerName.endsWith('.ssa') || normalized.includes('[Script Info]')) {
    return parseASSWithStyles(normalized);
  }

  if (lowerName.endsWith('.ytt') || normalized.includes('<timedtext')) {
    return parseYTT(normalized);
  }

  if (lowerName.endsWith('.srv3') || normalized.includes('<transcript')) {
    return parseSRV3(normalized);
  }

  if (lowerName.endsWith('.vtt') || normalized.includes('WEBVTT')) {
    return parseWebVTT(normalized);
  }

  if (lowerName.endsWith('.srt')) {
    return parseSRT(normalized);
  }

  if (normalized.includes('-->')) {
    return /\d{2}:\d{2}:\d{2},\d{3}/.test(normalized) ? parseSRT(normalized) : parseWebVTT(normalized);
  }

  return [];
};

export const getCurrentSubtitleCue = (cues: SubtitleCue[], currentTime: number): SubtitleCue | null => {
  return cues.find(cue => currentTime >= cue.startTime && currentTime <= cue.endTime) ?? null;
};

export const getCurrentSubtitle = (cues: SubtitleCue[], currentTime: number): string => {
  return getCurrentSubtitleCue(cues, currentTime)?.text ?? '';
};

const parseASSWithStyles = (assContent: string): SubtitleCue[] => {
  const styleMap = parseASSStyles(assContent);
  const events = parseASSEvents(assContent).sort((a, b) => a.startTime - b.startTime);

  return events.map(event => {
    const baseStyle = styleMap.get(event.style) ?? DEFAULT_STYLE;
    const parsed = parseASSDialogueText(event.text, baseStyle);

    return {
      startTime: event.startTime,
      endTime: event.endTime,
      text: parsed.text,
      lines: parsed.lines,
      alignment: event.alignment ?? 'center',
      verticalAlign: event.verticalAlign ?? 'bottom',
      noBackground: true
    };
  });
};

const parseASSStyles = (assContent: string): Map<string, SubtitleStyle> => {
  const styleLines = assContent.split('\n').map(line => line.trim());
  const styles = new Map<string, SubtitleStyle>();
  let inStyleSection = false;
  let fields: string[] = [];

  for (const line of styleLines) {
    if (line.startsWith('[')) {
      inStyleSection = /\[(v4\+? styles)\]/i.test(line);
      continue;
    }

    if (!inStyleSection) continue;
    if (line.startsWith('Format:')) {
      fields = line.replace('Format:', '').split(',').map(f => f.trim().toLowerCase());
      continue;
    }

    if (!line.startsWith('Style:') || fields.length === 0) continue;

    const values = splitWithLimit(line.replace('Style:', '').trim(), fields.length);
    const name = readField(values, fields, 'name') || `Style-${styles.size}`;
    styles.set(name, {
      fontFamily: readField(values, fields, 'fontname') || undefined,
      fontSize: toPx(readField(values, fields, 'fontsize')),
      color: assColorToCss(readField(values, fields, 'primarycolour') || readField(values, fields, 'primarycolor')),
      backgroundColor: assColorToCss(readField(values, fields, 'backcolour') || readField(values, fields, 'backcolor')),
      fontWeight: isASSFlag(readField(values, fields, 'bold')) ? 'bold' : 'normal',
      fontStyle: isASSFlag(readField(values, fields, 'italic')) ? 'italic' : 'normal',
      textDecoration: buildTextDecoration(
        isASSFlag(readField(values, fields, 'underline')),
        isASSFlag(readField(values, fields, 'strikeout'))
      ),
      transform: `rotate(${-(parseFloat(readField(values, fields, 'angle') || '0'))}deg) scale(${(parseFloat(readField(values, fields, 'scalex') || '100')) / 100}, ${(parseFloat(readField(values, fields, 'scaley') || '100')) / 100})`
    });
  }

  return styles;
};

interface ASSEventLite {
  startTime: number;
  endTime: number;
  style: string;
  text: string;
  alignment?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

const parseASSEvents = (assContent: string): ASSEventLite[] => {
  const lines = assContent.split('\n').map(line => line.trim());
  const events: ASSEventLite[] = [];
  let inEvents = false;
  let fields: string[] = [];

  for (const line of lines) {
    if (line.startsWith('[')) {
      inEvents = /^\[events\]/i.test(line);
      continue;
    }

    if (!inEvents) continue;
    if (line.startsWith('Format:')) {
      fields = line.replace('Format:', '').split(',').map(f => f.trim().toLowerCase());
      continue;
    }

    if (!line.startsWith('Dialogue:') || fields.length === 0) continue;
    const values = splitWithLimit(line.replace('Dialogue:', '').trim(), fields.length);
    const style = readField(values, fields, 'style') || 'Default';
    const text = readField(values, fields, 'text') || '';
    const align = parseAssAlignmentTag(text);
    const startTime = parseASSTime(readField(values, fields, 'start') || '0:00:00.00');
    const endTime = parseASSTime(readField(values, fields, 'end') || '0:00:00.00');

    events.push({ startTime, endTime, style, text, ...align });
  }

  return events;
};


const parseASSTime = (time: string): number => {
  const match = time.trim().match(/(\d+):(\d{2}):(\d{2})\.(\d{2})/);
  if (!match) return 0;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const centiseconds = Number(match[4]);

  return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
};

const parseAssAlignmentTag = (text: string): Pick<ASSEventLite, 'alignment' | 'verticalAlign'> => {
  const match = text.match(/\\an(\d+)/);
  if (!match) return {};
  const code = parseInt(match[1], 10);

  const horizontal = [1, 4, 7].includes(code) ? 'left' : [3, 6, 9].includes(code) ? 'right' : 'center';
  const vertical = [7, 8, 9].includes(code) ? 'top' : [4, 5, 6].includes(code) ? 'middle' : 'bottom';

  return { alignment: horizontal, verticalAlign: vertical };
};

const parseASSDialogueText = (text: string, baseStyle: SubtitleStyle): ParsedCueText => {
  const tokens = text.replace(/\\N/g, '\n').replace(/\\n/g, '\n').replace(/\\h/g, ' ').split(/(\{[^}]*\})/g);
  const lines: SubtitleSegment[][] = [[]];
  let currentStyle: SubtitleStyle = { ...baseStyle };

  for (const token of tokens) {
    if (!token) continue;
    if (token.startsWith('{') && token.endsWith('}')) {
      currentStyle = applyASSOverride(currentStyle, token);
      continue;
    }

    const plain = decodeEntities(token);
    const splitLines = plain.split('\n');
    splitLines.forEach((lineText, index) => {
      if (lineText) {
        lines[lines.length - 1].push({ text: lineText, style: { ...currentStyle } });
      }
      if (index < splitLines.length - 1) {
        lines.push([]);
      }
    });
  }

  const textOutput = lines.map(line => line.map(segment => segment.text).join('')).join('\n').trim();
  return { text: textOutput, lines: pruneLines(lines) };
};

const applyASSOverride = (style: SubtitleStyle, overrideBlock: string): SubtitleStyle => {
  const next = { ...style };
  const tags = overrideBlock.slice(1, -1);

  if (/\\b1/.test(tags)) next.fontWeight = 'bold';
  if (/\\b0/.test(tags)) next.fontWeight = 'normal';
  if (/\\i1/.test(tags)) next.fontStyle = 'italic';
  if (/\\i0/.test(tags)) next.fontStyle = 'normal';
  if (/\\u1/.test(tags)) next.textDecoration = buildTextDecoration(true, next.textDecoration?.includes('line-through') ?? false);
  if (/\\s1/.test(tags)) next.textDecoration = buildTextDecoration(next.textDecoration?.includes('underline') ?? false, true);

  if (/\\s1/.test(tags)) next.textDecoration = buildTextDecoration(next.textDecoration?.includes('underline') ?? false, true);

  const colorTag = tags.match(/\\c&H([0-9A-Fa-f]{6})&/);
  if (colorTag) next.color = assColorToCss(`&H${colorTag[1]}&`);

  const sizeTag = tags.match(/\\fs(\d+(?:\.\d+)?)/);
  if (sizeTag) next.fontSize = `${sizeTag[1]}px`;

  // Transforms
  const transforms: string[] = [];

  // Rotation
  const frz = tags.match(/\\frz(-?\d+(?:\.\d+)?)/);
  const frx = tags.match(/\\frx(-?\d+(?:\.\d+)?)/);
  const fry = tags.match(/\\fry(-?\d+(?:\.\d+)?)/);

  if (frz) transforms.push(`rotateZ(${-parseFloat(frz[1])}deg)`);
  if (frx) transforms.push(`rotateX(${parseFloat(frx[1])}deg)`);
  if (fry) transforms.push(`rotateY(${parseFloat(fry[1])}deg)`);

  // Scale
  const fscx = tags.match(/\\fscx(\d+(?:\.\d+)?)/);
  const fscy = tags.match(/\\fscy(\d+(?:\.\d+)?)/);

  if (fscx || fscy) {
    const sx = fscx ? parseFloat(fscx[1]) / 100 : 1;
    const sy = fscy ? parseFloat(fscy[1]) / 100 : 1;
    transforms.push(`scale(${sx}, ${sy})`);
  }

  if (transforms.length > 0) {
    // If we have overrides, we likely want to replace the base transform or append?
    // Appending works for composition.
    // Ensure display is inline-block so transforms work on spans
    next.display = 'inline-block';
    next.transform = transforms.join(' ');
  }

  return next;
};

const parseYTT = (yttContent: string): SubtitleCue[] => {
  const cues: SubtitleCue[] = [];
  const pRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;

  while ((match = pRegex.exec(yttContent)) !== null) {
    const attrs = parseXmlAttributes(match[1]);
    const startTime = parseMillisecondsString(attrs.t ?? '0');
    const endTime = startTime + parseMillisecondsString(attrs.d ?? '0');
    const parsedText = parseInlineStyledText(match[2]);
    cues.push({ startTime, endTime, text: parsedText.text, lines: parsedText.lines });
  }

  return cues;
};

const parseSRV3 = (srv3Content: string): SubtitleCue[] => {
  const cues: SubtitleCue[] = [];
  const pRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;

  while ((match = pRegex.exec(srv3Content)) !== null) {
    const attrs = parseXmlAttributes(match[1]);
    const startTime = parseMillisecondsString(attrs.t ?? '0');
    const endTime = startTime + parseMillisecondsString(attrs.d ?? '0');
    const spanRegex = /<s\b([^>]*)>([\s\S]*?)<\/s>/g;
    const segments: SubtitleSegment[] = [];
    let spanMatch: RegExpExecArray | null;

    while ((spanMatch = spanRegex.exec(match[2])) !== null) {
      const spanAttrs = parseXmlAttributes(spanMatch[1]);
      const parsed = parseInlineStyledText(spanMatch[2]);
      segments.push({ text: parsed.text, style: spanAttrs.c ? youtubeClassToStyle(spanAttrs.c) : undefined });
    }

    if (segments.length > 0) {
      cues.push({
        startTime,
        endTime,
        text: segments.map(segment => segment.text).join(' ').trim(),
        lines: [segments]
      });
      continue;
    }

    const parsedText = parseInlineStyledText(match[2]);
    cues.push({ startTime, endTime, text: parsedText.text, lines: parsedText.lines });
  }

  return cues;
};

const parseInlineStyledText = (rawText: string): ParsedCueText => {
  const normalized = rawText
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/\{\\[^}]*\}/g, '')
    .trim();

  const lines: SubtitleSegment[][] = [[]];
  let currentStyle: SubtitleStyle = { ...DEFAULT_STYLE };
  const styleStack: SubtitleStyle[] = [];

  const tokens = normalized.split(/(<[^>]+>)/g).filter(Boolean);

  for (const token of tokens) {
    if (!token.startsWith('<')) {
      const text = decodeEntities(token);
      const split = text.split('\n');
      split.forEach((part, index) => {
        if (part) {
          lines[lines.length - 1].push({ text: part, style: { ...currentStyle } });
        }
        if (index < split.length - 1) lines.push([]);
      });
      continue;
    }

    const isClosing = /^<\//.test(token);
    const tagMatch = token.match(/^<\/?([a-zA-Z0-9]+)([^>]*)>/);
    if (!tagMatch) continue;

    const tagName = tagMatch[1].toLowerCase();
    const attrs = parseXmlAttributes(tagMatch[2] ?? '');

    if (!isClosing) {
      styleStack.push({ ...currentStyle });
      currentStyle = applyHtmlLikeStyle(currentStyle, tagName, attrs);
    } else {
      currentStyle = styleStack.pop() ?? { ...DEFAULT_STYLE };
    }
  }

  const cleanedLines = pruneLines(lines);
  const flatText = cleanedLines.map(line => line.map(segment => segment.text).join('')).join('\n').trim();
  return { text: flatText, lines: cleanedLines };
};

const applyHtmlLikeStyle = (baseStyle: SubtitleStyle, tagName: string, attrs: Record<string, string>): SubtitleStyle => {
  const next = { ...baseStyle };
  if (tagName === 'b' || tagName === 'strong') next.fontWeight = 'bold';
  if (tagName === 'i' || tagName === 'em') next.fontStyle = 'italic';
  if (tagName === 'u') next.textDecoration = buildTextDecoration(true, next.textDecoration?.includes('line-through') ?? false);

  if (tagName === 'font' && attrs.color) {
    next.color = attrs.color;
  }

  if (tagName === 'c' && attrs.class) {
    return { ...next, ...classNameToStyle(attrs.class) };
  }

  return next;
};

const classNameToStyle = (className: string): SubtitleStyle => {
  const style: SubtitleStyle = {};
  const classes = className.split(/\s+/);
  for (const current of classes) {
    if (current.startsWith('c.')) {
      style.color = current.slice(2).replace(/_/g, ' ');
    }
    if (current.startsWith('bg_')) {
      style.backgroundColor = current.slice(3).replace(/_/g, ' ');
    }
  }
  return style;
};

const youtubeClassToStyle = (styleClass: string): SubtitleStyle => {
  if (styleClass === '7') {
    return { fontWeight: 'bold' };
  }
  if (styleClass === '8') {
    return { fontStyle: 'italic' };
  }
  return {};
};

const parseXmlAttributes = (attributesText: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)=("([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(attributesText)) !== null) {
    attrs[match[1]] = match[3] ?? match[4] ?? '';
  }
  if (/\bclass=/.test(attributesText) === false) {
    const classAttr = attributesText.match(/\.([^\s>]+)/);
    if (classAttr) attrs.class = classAttr[1];
  }
  return attrs;
};

const parseFlexibleTimeString = (timeStr: string): number => {
  const cleaned = timeStr.replace(',', '.').split(/[\s]/)[0];
  const parts = cleaned.split(':').map(Number);

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return Number(cleaned) || 0;
};

const parseMillisecondsString = (value: string): number => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  return numeric / 1000;
};

const splitWithLimit = (input: string, expectedFields: number): string[] => {
  const values = input.split(',');
  if (values.length <= expectedFields) return values.map(value => value.trim());

  const head = values.slice(0, expectedFields - 1).map(value => value.trim());
  const tail = values.slice(expectedFields - 1).join(',').trim();
  return [...head, tail];
};

const readField = (values: string[], fields: string[], fieldName: string): string | undefined => {
  const index = fields.indexOf(fieldName);
  return index === -1 ? undefined : values[index];
};

const buildTextDecoration = (underline: boolean, strike: boolean): string => {
  return [underline ? 'underline' : '', strike ? 'line-through' : ''].filter(Boolean).join(' ').trim();
};

const isASSFlag = (value?: string): boolean => value === '1' || value === '-1';

const toPx = (value?: string): string | undefined => {
  if (!value) return undefined;
  const num = Number(value);
  if (Number.isNaN(num)) return undefined;
  return `${num}px`;
};

const assColorToCss = (input?: string): string | undefined => {
  if (!input) return undefined;
  const value = input.trim();
  if (!value.startsWith('&H') || !value.endsWith('&')) return undefined;
  const hex = value.slice(2, -1).padStart(6, '0').slice(-6);
  const b = hex.slice(0, 2);
  const g = hex.slice(2, 4);
  const r = hex.slice(4, 6);
  return `#${r}${g}${b}`;
};

const decodeEntities = (text: string): string => {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

const pruneLines = (lines: SubtitleSegment[][]): SubtitleSegment[][] => {
  return lines
    .map(line => line.filter(segment => segment.text.length > 0))
    .filter((line, index, arr) => line.length > 0 || (index > 0 && index < arr.length - 1));
};
