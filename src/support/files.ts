/** A file for an upload field, built in memory at run time: no binary test files are committed or written to disk. */
export interface SampleFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export type SampleFileType = 'txt' | 'pdf' | 'jpg' | 'png';

/** 1 KB as the user stories count it. */
export const KB = 1024;

const MIME_TYPES: Record<SampleFileType, string> = {
  txt: 'text/plain',
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  png: 'image/png',
};

/** Leading bytes of each format, so that the content matches the extension for servers that sniff it. */
const SIGNATURES: Record<SampleFileType, Buffer> = {
  txt: Buffer.alloc(0),
  pdf: Buffer.from('%PDF-1.4\n'),
  jpg: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
};

/** A file of exactly `bytes` bytes, e.g. `sampleFile('pdf', 1 * KB)` -> "attachment-1024-bytes.pdf". */
export function sampleFile(type: SampleFileType, bytes: number): SampleFile {
  const signature = SIGNATURES[type];
  const padding = Buffer.alloc(Math.max(0, bytes - signature.length), 'a');
  return {
    name: `attachment-${bytes}-bytes.${type}`,
    mimeType: MIME_TYPES[type],
    buffer: Buffer.concat([signature, padding]).subarray(0, bytes),
  };
}
