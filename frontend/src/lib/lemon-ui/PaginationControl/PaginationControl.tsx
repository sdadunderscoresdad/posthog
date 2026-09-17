import './PaginationControl.scss'

import clsx from 'clsx'

import { IconChevronLeft, IconChevronRight } from '@posthog/icons'

import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'

import { PaginationState } from './types'

export interface PaginationControlProps<T> extends PaginationState<T> {
    nouns?: [string, string]
    bordered?: boolean
}

export function PaginationControl<T>({
    pagination,
    currentPage,
    setCurrentPage,
    pageCount,
    dataSourcePage,
    entryCount,
    currentStartIndex,
    currentEndIndex,
    nouns = ['entry', 'entries'],
    bordered = false,
}: PaginationControlProps<T>): JSX.Element | null {
    /** Whether pages previous and next are available. */
    const isPreviousAvailable: boolean =
        currentPage !== null ? currentPage > 1 : !!(pagination?.controlled && pagination.onBackward)
    const isNextAvailable: boolean =
        currentPage !== null && pageCount !== null
            ? currentPage < pageCount
            : !!(pagination?.controlled && pagination.onForward)
    /** Whether there's reason to show pagination. */
    const showPagination: boolean = isPreviousAvailable || isNextAvailable || pagination?.hideOnSinglePage === false

    const currentPageSize = dataSourcePage.length

    return showPagination ? (
        <div className={clsx('PaginationControl', bordered && 'PaginationControl--bordered')}>
            <span>
                {currentPageSize === 0
                    ? `No ${nouns[1]}`
                    : entryCount === null
                      ? `${currentPageSize} ${currentPageSize === 1 ? nouns[0] : nouns[1]} on this page`
                      : currentPageSize === 1
                        ? `${currentEndIndex} of ${entryCount} ${entryCount === 1 ? nouns[0] : nouns[1]}`
                        : `${currentStartIndex + 1}-${currentEndIndex} of ${entryCount} ${nouns[1]}`}
            </span>
            <LemonButton
                icon={<IconChevronLeft />}
                aria-label={i18n.t('lemonUi.previousPage', { defaultValue: 'Previous page' })}
                disabledReason={
                    !isPreviousAvailable
                        ? i18n.t('lemonUi.noPreviousPage', { defaultValue: 'No previous page' })
                        : undefined
                }
                size="small"
                onClick={() => {
                    pagination?.controlled && pagination.onBackward?.()
                    if ((pagination?.controlled && currentPage) || !pagination?.controlled) {
                        setCurrentPage(Math.max(1, Math.min(pageCount as number, currentPage as number) - 1))
                    }
                }}
            />
            <LemonButton
                icon={<IconChevronRight />}
                aria-label={i18n.t('lemonUi.nextPage', { defaultValue: 'Next page' })}
                disabledReason={
                    !isNextAvailable ? i18n.t('lemonUi.noNextPage', { defaultValue: 'No next page' }) : undefined
                }
                size="small"
                onClick={() => {
                    pagination?.controlled && pagination.onForward?.()
                    if ((pagination?.controlled && currentPage) || !pagination?.controlled) {
                        setCurrentPage(Math.min(pageCount as number, (currentPage as number) + 1))
                    }
                }}
            />
        </div>
    ) : null
}
