// THIS FILE GOES IN: lib/cleanHtml.ts (REPLACES existing file)
// Removes unsafe code (scripts, click handlers, unknown tags, page-covering styles)
// from rich-text HTML before it is shown. Keeps the look: fonts, colours, spacing, tables.
import sanitizeHtml from 'sanitize-html'

const SAFE = [/^(?!.*(?:url\s*\(|expression|javascript|@import|behavior)).*$/i]
const LOOK_PROPS = [
  'color', 'background-color', 'font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'line-height',
  'text-align', 'text-decoration', 'vertical-align', 'width', 'max-width', 'border', 'border-top', 'border-bottom', 'border-collapse',
  'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
]

const allowedStyle: Record<string, RegExp[]> = { display: [/^(block|inline|inline-block|table|table-cell|table-row)$/] }
LOOK_PROPS.forEach(p => { allowedStyle[p] = SAFE })

export function cleanHtml(html: string): string {
  return sanitizeHtml(html || '', {
    allowedTags: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'blockquote', 'hr', 'figure', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    allowedAttributes: { '*': ['style'], a: ['href', 'target', 'rel'], td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'] },
    allowedStyles: { '*': allowedStyle },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }) },
  })
}
