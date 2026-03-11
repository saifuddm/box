const HTML_ELEMENT_PATTERN = /<\/?[a-z][\w:-]*\b[^>]*>/i;

export function containsHtmlElements(markdown: string): boolean {
  return HTML_ELEMENT_PATTERN.test(markdown);
}
