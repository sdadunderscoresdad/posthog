import { Placeholder } from '@tiptap/extension-placeholder'
import { Extensions } from '@tiptap/react'
import { useMemo } from 'react'

import { TextContent } from 'lib/components/Cards/TextCard/TextCard'
import { RichMarkdownEditor } from 'lib/components/MarkdownEditor/rich/RichMarkdownEditor'
import { i18n } from 'lib/i18n/i18n'
import { useLocale } from 'lib/i18n/useLocale'

import { TEXT_CARD_MARKDOWN_EXTENSIONS, textCardConverter } from './textCardMarkdown'

export function TextCardMarkdownEditor({
    value,
    onChange,
    minRows = 8,
    maxRows = 20,
}: {
    value?: string
    onChange?: (value: string) => void
    minRows?: number
    maxRows?: number
}): JSX.Element {
    const locale = useLocale()
    // Rebuilt per language, so the placeholder follows a switch instead of holding the first one.
    const extensions: Extensions = useMemo(
        () => [
            ...TEXT_CARD_MARKDOWN_EXTENSIONS,
            Placeholder.configure({
                placeholder: i18n.t('cardEditor.markdownPlaceholder', {
                    defaultValue: 'Write your markdown here...',
                }),
            }),
        ],
        [locale]
    )

    return (
        <RichMarkdownEditor
            value={value}
            onChange={onChange}
            minRows={minRows}
            maxRows={maxRows}
            maxLength={4000}
            dataAttr="text-card-edit-area"
            extensions={extensions}
            markdownToDoc={textCardConverter.markdownToDoc}
            docToMarkdown={textCardConverter.docToMarkdown}
            renderPreview={(markdown) => <TextContent text={markdown} className="LemonTextArea--preview" />}
            autoFocus
        />
    )
}
