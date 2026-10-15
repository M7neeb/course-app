/** A web image search for a term, opened in a new tab by the image block. */
export function imageSearchUrl(term: string): string {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(term.trim())}`;
}
