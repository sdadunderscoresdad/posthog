import clsx from 'clsx'
import posthog from 'posthog-js'
import { useEffect, useState } from 'react'

import { LemonButton, LemonInput, LemonModal, LemonSegmentedButton } from '@posthog/lemon-ui'

import { i18n } from 'lib/i18n/i18n'

import {
    normalizeWordArtSize,
    normalizeWordArtStyle,
    WORD_ART_SIZES,
    WordArtSize,
    wordArtPresets,
    wordArtSizeLabel,
} from './wordArtPresets'
import { WordArtText } from './WordArtText'

function sizeOptions(): { value: WordArtSize; label: string; tooltip: string; 'data-attr': string }[] {
    return WORD_ART_SIZES.map((value) => ({
        value,
        label: value[0].toUpperCase(),
        tooltip: wordArtSizeLabel(value),
        'data-attr': `word-art-size-${value}`,
    }))
}

export function WordArtModal({
    onClose,
    onSave,
    initialText,
    initialStyle,
    initialSize,
}: {
    onClose: () => void
    onSave: (attrs: { text: string; style: string; size: WordArtSize }) => void
    initialText?: string
    initialStyle?: string
    initialSize?: string
}): JSX.Element {
    const [text, setText] = useState(initialText ?? '')
    const [style, setStyle] = useState(normalizeWordArtStyle(initialStyle))
    const [size, setSize] = useState<WordArtSize>(normalizeWordArtSize(initialSize))
    const isEditing = !!initialText

    // Mounted only while open, so this fires once per gallery open
    useEffect(() => {
        posthog.capture('dashboard text tile word art gallery opened', { is_editing: isEditing })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const trimmedText = text.trim()
    const previewText = trimmedText || i18n.t('wordArt.placeholder', { defaultValue: 'Your text here' })

    const save = (): void => {
        if (trimmedText) {
            posthog.capture('dashboard text tile word art saved', {
                is_new: !isEditing,
                style,
                size,
                text_length: trimmedText.length,
            })
            onSave({ text: trimmedText, style, size })
        }
    }

    return (
        <LemonModal
            isOpen
            onClose={onClose}
            title={i18n.t('wordArt.title', { defaultValue: 'Word art' })}
            description={i18n.t('wordArt.description', {
                defaultValue: 'Pick a style. Yes, all of them are tasteful.',
            })}
            width={640}
            forceAbovePopovers
            footer={
                <>
                    <LemonButton type="secondary" onClick={onClose}>
                        {i18n.t('common.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton
                        type="primary"
                        onClick={save}
                        disabledReason={
                            !trimmedText
                                ? i18n.t('wordArt.enterSomeText', { defaultValue: 'Enter some text first' })
                                : undefined
                        }
                    >
                        {isEditing
                            ? i18n.t('cardEditor.update', { defaultValue: 'Update' })
                            : i18n.t('cardEditor.insert', { defaultValue: 'Insert' })}
                    </LemonButton>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <LemonInput
                        value={text}
                        onChange={setText}
                        placeholder={i18n.t('wordArt.placeholder', { defaultValue: 'Your text here' })}
                        maxLength={100}
                        autoFocus
                        onPressEnter={save}
                        data-attr="word-art-text-input"
                        className="flex-1"
                    />
                    <LemonSegmentedButton value={size} onChange={setSize} options={sizeOptions()} size="small" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {wordArtPresets().map((preset) => (
                        <button
                            key={preset.id}
                            type="button"
                            title={preset.label}
                            data-attr={`word-art-style-${preset.id}`}
                            onClick={() => setStyle(preset.id)}
                            className={clsx(
                                'flex h-24 items-center justify-center overflow-hidden rounded border bg-white p-2',
                                style === preset.id
                                    ? 'border-accent ring-1 ring-accent'
                                    : 'border-primary hover:border-accent'
                            )}
                        >
                            <WordArtText text={previewText} style={preset.id} className="WordArt--preview" />
                        </button>
                    ))}
                </div>
            </div>
        </LemonModal>
    )
}
