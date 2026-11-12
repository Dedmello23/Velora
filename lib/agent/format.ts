/**
 * Safety net for the final reply. The chat shows plain text, so if the model still writes Markdown
 * (**bold**, # headings, `code`, * bullets) the symbols are removed here and the text stays readable.
 */
export function toPlainText(text: string): string {
  return text
    .replace(/```[a-z]*\n?([\s\S]*?)```/g, "$1") // code fences
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/(\*\*|__)(.+?)\1/g, "$2") // bold
    .replace(/(^|[\s(])\*(?!\s)([^*\n]+?)\*(?=[\s).,!?]|$)/g, "$1$2") // italics with single asterisks
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, "") // headings
    .replace(/^[ \t]*[*•][ \t]+/gm, "- ") // bullet variants -> simple dash
    .replace(/^[ \t]*-{3,}[ \t]*$/gm, "") // horizontal rules
    .replace(/[ \t]+\n/g, "\n") // trailing spaces
    .replace(/\n{3,}/g, "\n\n") // at most one blank line
    .trim();
}
