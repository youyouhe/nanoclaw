import path from 'path';

import { Channel, NewMessage } from './types.js';
import { formatLocalTime } from './timezone.js';

export function escapeXml(s: string): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatMessages(
  messages: NewMessage[],
  timezone: string,
): string {
  const lines = messages.map((m) => {
    const displayTime = formatLocalTime(m.timestamp, timezone);
    let attrs = `sender="${escapeXml(m.sender_name)}" time="${escapeXml(displayTime)}"`;
    if (m.media_type) {
      attrs += ` media_type="${escapeXml(m.media_type)}"`;
      if (m.media_path) {
        const filename = path.basename(m.media_path);
        attrs += ` media_path="/workspace/group/media/${escapeXml(filename)}"`;
      }
      if (m.media_mime) attrs += ` media_mime="${escapeXml(m.media_mime)}"`;
      if (m.media_filename)
        attrs += ` media_filename="${escapeXml(m.media_filename)}"`;
    }
    return `<message ${attrs}>${escapeXml(m.content)}</message>`;
  });

  const header = `<context timezone="${escapeXml(timezone)}" />\n`;

  return `${header}<messages>\n${lines.join('\n')}\n</messages>`;
}

export function stripInternalTags(text: string): string {
  return text.replace(/<internal>[\s\S]*?<\/internal>/g, '').trim();
}

export function formatOutbound(rawText: string): string {
  const text = stripInternalTags(rawText);
  if (!text) return '';
  return text;
}

export function routeOutbound(
  channels: Channel[],
  jid: string,
  text: string,
): Promise<void> {
  const channel = channels.find((c) => c.ownsJid(jid) && c.isConnected());
  if (!channel) throw new Error(`No channel for JID: ${jid}`);
  return channel.sendMessage(jid, text);
}

export function findChannel(
  channels: Channel[],
  jid: string,
): Channel | undefined {
  return channels.find((c) => c.ownsJid(jid));
}
