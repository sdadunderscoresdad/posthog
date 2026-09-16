import './SentenceList.scss'

import { useTranslation } from 'react-i18next'

export interface SentenceListProps {
    listParts: (string | JSX.Element | null)[]
    prefix?: string | JSX.Element | null
    suffix?: string | JSX.Element | null
}

/** Transforms a list of phrases into a cohesive sentence, using the list's own separators. */
export function SentenceList({ listParts, prefix = null, suffix = null }: SentenceListProps): JSX.Element {
    const { t } = useTranslation()
    const separator = t('activityLog.listSeparator', { defaultValue: ', ' })
    const conjunction = t('activityLog.listConjunction', { defaultValue: 'and' })

    return (
        <div className="sentence-list">
            {prefix && <div className="sentence-part">{prefix}&nbsp;</div>}
            <>
                {listParts
                    .filter((part) => !!part)
                    .flatMap((part, index, all) => {
                        const isntFirst = index > 0
                        const isLast = index === all.length - 1
                        const isList = all.length >= 2
                        return [
                            isntFirst && (
                                <div className="sentence-part" key={`${index}-a`}>
                                    {separator}
                                </div>
                            ),
                            isLast && isList && (
                                <div className="sentence-part" key={`${index}-b`}>
                                    &nbsp;{conjunction}&nbsp;
                                </div>
                            ),
                            <div className="sentence-part" key={`${index}-c`}>
                                {part}
                            </div>,
                        ]
                    })}
            </>
            {suffix && <div className="sentence-part">&nbsp;{suffix}</div>}
        </div>
    )
}
