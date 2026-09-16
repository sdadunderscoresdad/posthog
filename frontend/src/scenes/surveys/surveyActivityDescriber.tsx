import { Trans } from 'react-i18next'
import { P, match } from 'ts-pattern'

import {
    ActivityChange,
    ActivityLogItem,
    ActivityLogUserName,
    ChangeMapping,
    Description,
    HumanizedChange,
    defaultDescriber,
    detectBoolean,
} from 'lib/components/ActivityLog/humanizeActivity'
import { getActiveLocale, i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { truncate } from 'lib/utils/strings'
import { urls } from 'scenes/urls'

import {
    BasicSurveyQuestion,
    FeatureFlagBasicType,
    FeatureFlagFilters,
    LinkSurveyQuestion,
    MultipleSurveyQuestion,
    RatingSurveyQuestion,
    Survey,
    SurveyAppearance,
    SurveyQuestionType,
} from '~/types'

const isEmptyOrUndefined = (value: any): boolean => value === undefined || value === null || value === ''

/**
 * Names every appearance field the survey editor writes. Built per language, because a map of
 * messages resolved at import would keep the language the app started in.
 */
function buildAppearanceFieldLabels(): Record<keyof SurveyAppearance, string> {
    return {
        backgroundColor: i18n.t('surveyActivity.appearance.backgroundColor', { defaultValue: 'background color' }),
        textColor: i18n.t('surveyActivity.appearance.textColor', { defaultValue: 'text color' }),
        submitButtonColor: i18n.t('surveyActivity.appearance.submitButtonColor', {
            defaultValue: 'submit button color',
        }),
        submitButtonText: i18n.t('surveyActivity.appearance.submitButtonText', { defaultValue: 'submit button text' }),
        submitButtonTextColor: i18n.t('surveyActivity.appearance.submitButtonTextColor', {
            defaultValue: 'submit button text color',
        }),
        ratingButtonColor: i18n.t('surveyActivity.appearance.ratingButtonColor', {
            defaultValue: 'rating button color',
        }),
        ratingButtonActiveColor: i18n.t('surveyActivity.appearance.ratingButtonActiveColor', {
            defaultValue: 'active rating button color',
        }),
        borderColor: i18n.t('surveyActivity.appearance.borderColor', { defaultValue: 'border color' }),
        placeholder: i18n.t('surveyActivity.appearance.placeholder', { defaultValue: 'placeholder text' }),
        whiteLabel: i18n.t('surveyActivity.appearance.whiteLabel', { defaultValue: 'white label option' }),
        displayThankYouMessage: i18n.t('surveyActivity.appearance.displayThankYouMessage', {
            defaultValue: 'thank you message display',
        }),
        thankYouMessageHeader: i18n.t('surveyActivity.appearance.thankYouMessageHeader', {
            defaultValue: 'thank you message header',
        }),
        thankYouMessageDescription: i18n.t('surveyActivity.appearance.thankYouMessageDescription', {
            defaultValue: 'thank you message description',
        }),
        thankYouMessageDescriptionContentType: i18n.t(
            'surveyActivity.appearance.thankYouMessageDescriptionContentType',
            { defaultValue: 'thank you message content type' }
        ),
        thankYouMessageCloseButtonText: i18n.t('surveyActivity.appearance.thankYouMessageCloseButtonText', {
            defaultValue: 'thank you message close button text',
        }),
        autoDisappear: i18n.t('surveyActivity.appearance.autoDisappear', { defaultValue: 'auto-disappear option' }),
        position: i18n.t('surveyActivity.appearance.position', { defaultValue: 'survey position' }),
        tabPosition: i18n.t('surveyActivity.appearance.tabPosition', { defaultValue: 'survey button position' }),
        shuffleQuestions: i18n.t('surveyActivity.appearance.shuffleQuestions', { defaultValue: 'question shuffling' }),
        surveyPopupDelaySeconds: i18n.t('surveyActivity.appearance.surveyPopupDelaySeconds', {
            defaultValue: 'survey popup delay',
        }),
        allowGoBack: i18n.t('surveyActivity.appearance.allowGoBack', { defaultValue: 'back button' }),
        backButtonText: i18n.t('surveyActivity.appearance.backButtonText', { defaultValue: 'back button text' }),
        widgetType: i18n.t('surveyActivity.appearance.widgetType', { defaultValue: 'widget type' }),
        widgetSelector: i18n.t('surveyActivity.appearance.widgetSelector', { defaultValue: 'widget selector' }),
        widgetLabel: i18n.t('surveyActivity.appearance.widgetLabel', { defaultValue: 'widget label' }),
        widgetColor: i18n.t('surveyActivity.appearance.widgetColor', { defaultValue: 'widget color' }),
        zIndex: i18n.t('surveyActivity.appearance.zIndex', { defaultValue: 'survey form zIndex' }),
        fontFamily: i18n.t('surveyActivity.appearance.fontFamily', { defaultValue: 'font family' }),
        disabledButtonOpacity: i18n.t('surveyActivity.appearance.disabledButtonOpacity', {
            defaultValue: 'disabled button opacity',
        }),
        boxPadding: i18n.t('surveyActivity.appearance.boxPadding', { defaultValue: 'box padding' }),
        boxShadow: i18n.t('surveyActivity.appearance.boxShadow', { defaultValue: 'box shadow' }),
        borderRadius: i18n.t('surveyActivity.appearance.borderRadius', { defaultValue: 'border radius' }),
        maxWidth: i18n.t('surveyActivity.appearance.maxWidth', { defaultValue: 'max width' }),
        textSubtleColor: i18n.t('surveyActivity.appearance.textSubtleColor', { defaultValue: 'text subtle color' }),
        inputBackground: i18n.t('surveyActivity.appearance.inputBackground', { defaultValue: 'input background' }),
        inputTextColor: i18n.t('surveyActivity.appearance.inputTextColor', { defaultValue: 'input text color' }),
        hideCancelButton: i18n.t('surveyActivity.appearance.hideCancelButton', { defaultValue: 'hide cancel button' }),
    }
}

let cachedAppearanceFieldLabels: { locale: string; labels: Record<keyof SurveyAppearance, string> } | null = null

/** The appearance field names, in the language the app is rendering. */
function getAppearanceFieldLabels(): Record<keyof SurveyAppearance, string> {
    const locale = getActiveLocale()
    if (cachedAppearanceFieldLabels?.locale !== locale) {
        cachedAppearanceFieldLabels = { locale, labels: buildAppearanceFieldLabels() }
    }
    return cachedAppearanceFieldLabels.labels
}

const nameOrLinkToSurvey = (
    id: string | undefined,
    name: string | null | undefined,
    activity: string
): string | JSX.Element => {
    const displayName = name || i18n.t('surveyActivity.emptyName', { defaultValue: '(empty string)' })
    if (activity === 'deleted') {
        return <strong>{displayName}</strong>
    }
    return id ? <Link to={urls.survey(id)}>{displayName}</Link> : displayName
}

/**
 * The labels that name a survey question type in the activity log. The English text mirrors
 * `SurveyQuestionLabel`, which the survey editor renders; the activity log names them itself so
 * that the row reads in the app's language.
 */
function questionTypeLabel(type: SurveyQuestionType): string {
    switch (type) {
        case SurveyQuestionType.Open:
            return i18n.t('surveyActivity.questionType.open', {
                defaultValue: 'Freeform text',
            })
        case SurveyQuestionType.Rating:
            return i18n.t('surveyActivity.questionType.rating', {
                defaultValue: 'Rating',
            })
        case SurveyQuestionType.Link:
            return i18n.t('surveyActivity.questionType.link', {
                defaultValue: 'Link',
            })
        case SurveyQuestionType.SingleChoice:
            return i18n.t('surveyActivity.questionType.singleChoice', {
                defaultValue: 'Single choice select',
            })
        case SurveyQuestionType.MultipleChoice:
            return i18n.t('surveyActivity.questionType.multipleChoice', {
                defaultValue: 'Multiple choice select',
            })
    }
}

const surveyActionsMapping: Record<
    string,
    (change?: ActivityChange, logItem?: ActivityLogItem) => ChangeMapping | null
> = {
    name: function onName(change) {
        return {
            description: [
                <Trans
                    i18nKey="surveyActivity.name.changed"
                    values={{ before: change?.before, after: change?.after }}
                    components={{ Before: <strong />, After: <strong /> }}
                    defaults='changed the name from "<Before>{{ before }}</Before>" to "<After>{{ after }}</After>"'
                />,
            ],
        }
    },
    description: function onDescription(change) {
        return {
            description: [
                <>
                    {i18n.t('surveyActivity.description.changed', { defaultValue: 'updated the description from' })}{' '}
                    {formatDescription(change?.before as string | null | undefined)}{' '}
                    {i18n.t('surveyActivity.to', { defaultValue: 'to' })}{' '}
                    {formatDescription(change?.after as string | null | undefined)}
                </>,
            ],
        }
    },
    type: function onType(change) {
        return {
            description: [
                <Trans
                    i18nKey="surveyActivity.type.changed"
                    values={{ before: change?.before, after: change?.after }}
                    components={{ Before: <strong />, After: <strong /> }}
                    defaults="changed the type from <Before>{{ before }}</Before> to <After>{{ after }}</After>"
                />,
            ],
        }
    },
    questions: function onQuestions(change?: ActivityChange): ChangeMapping | null {
        if (!change) {
            return null
        }

        const beforeQuestions = change.before as Survey['questions']
        const afterQuestions = change.after as Survey['questions']

        if (beforeQuestions.length !== afterQuestions.length) {
            return {
                description: [
                    <Trans
                        i18nKey="surveyActivity.questions.countChanged"
                        values={{ before: beforeQuestions.length, after: afterQuestions.length }}
                        components={{ Before: <strong />, After: <strong /> }}
                        defaults="changed the number of questions from <Before>{{ before }}</Before> to <After>{{ after }}</After>"
                    />,
                ],
            }
        }

        const questionChanges = afterQuestions
            .map((afterQ, index) => {
                const beforeQ = beforeQuestions[index]
                if (JSON.stringify(beforeQ) !== JSON.stringify(afterQ)) {
                    return {
                        index: index + 1,
                        changes: describeQuestionChanges(beforeQ, afterQ),
                    }
                }
                return null
            })
            .filter((item): item is { index: number; changes: JSX.Element[] } => item !== null)

        if (questionChanges.length === 0) {
            return {
                description: [
                    <>{i18n.t('surveyActivity.questions.noChanges', { defaultValue: 'No changes to questions' })}</>,
                ],
            }
        }

        return {
            description: [
                <>
                    {i18n.t('surveyActivity.questions.updated', { defaultValue: 'updated' })}{' '}
                    <strong>{questionChanges.length}</strong>{' '}
                    {i18n.t('surveyActivity.questions.label', {
                        count: questionChanges.length,
                        defaultValue_one: 'question',
                        defaultValue_other: 'questions',
                    })}
                    :
                    <ul className="bullet-list">
                        {questionChanges.map(({ index, changes }) => (
                            <li key={index}>
                                {i18n.t('surveyActivity.questions.question', {
                                    defaultValue: 'Question {{ index }}:',
                                    index,
                                })}
                                <ul className="bullet-list">
                                    {changes.map((changeItem, changeIndex) => (
                                        <li key={changeIndex}>{changeItem}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </>,
            ],
        }
    },
    archived: function onArchived(change) {
        const isArchived = detectBoolean(change?.after)
        return {
            description: [
                <>
                    {isArchived
                        ? i18n.t('surveyActivity.archived', { defaultValue: 'archived' })
                        : i18n.t('surveyActivity.unarchived', { defaultValue: 'unarchived' })}
                </>,
            ],
        }
    },
    start_date: function onStartDate(change) {
        if (change?.before === null && change?.after !== null) {
            return {
                description: [<>{i18n.t('surveyActivity.launched', { defaultValue: 'launched' })}</>],
            }
        }
        return null
    },
    end_date: function onEndDate(change) {
        if (change?.before === null && change?.after !== null) {
            return {
                description: [<>{i18n.t('surveyActivity.stopped', { defaultValue: 'stopped' })}</>],
            }
        }
        if (change?.before !== null && change?.after === null) {
            return {
                description: [<>{i18n.t('surveyActivity.resumed', { defaultValue: 'resumed' })}</>],
            }
        }
        return null
    },
    appearance: function onAppearance(change) {
        const beforeAppearance = change?.before as SurveyAppearance
        const afterAppearance = change?.after as SurveyAppearance
        const changes: JSX.Element[] = []

        Object.entries(getAppearanceFieldLabels()).forEach(([field, readableFieldName]) => {
            const before = beforeAppearance?.[field as keyof SurveyAppearance]
            const after = afterAppearance?.[field as keyof SurveyAppearance]
            const changeDescription = describeFieldChange(readableFieldName, before, after)
            if (changeDescription) {
                changes.push(changeDescription)
            }
        })

        return changes.length > 0
            ? {
                  description: changes,
              }
            : null
    },
    conditions: function onConditions(change) {
        const beforeConditions = change?.before as Survey['conditions']
        const afterConditions = change?.after as Survey['conditions']
        const changes: (JSX.Element | null)[] = []

        changes.push(
            describeFieldChange(
                i18n.t('surveyActivity.conditions.url', { defaultValue: 'URL condition' }),
                beforeConditions?.url,
                afterConditions?.url
            ),
            describeFieldChange(
                i18n.t('surveyActivity.conditions.selector', { defaultValue: 'selector' }),
                beforeConditions?.selector,
                afterConditions?.selector
            ),
            describeFieldChange(
                i18n.t('surveyActivity.conditions.waitPeriod', { defaultValue: 'wait period' }),
                beforeConditions?.seenSurveyWaitPeriodInDays,
                afterConditions?.seenSurveyWaitPeriodInDays,
                i18n.t('surveyActivity.unit.days', { defaultValue: 'days' })
            ),
            describeFieldChange(
                i18n.t('surveyActivity.conditions.urlMatchType', { defaultValue: 'URL match type' }),
                beforeConditions?.urlMatchType,
                afterConditions?.urlMatchType
            )
        )

        // Use JSON.stringify for deep comparison of objects
        if (JSON.stringify(beforeConditions?.events) !== JSON.stringify(afterConditions?.events)) {
            changes.push(
                <>{i18n.t('surveyActivity.conditions.eventsModified', { defaultValue: 'modified event conditions' })}</>
            )
        }

        const described = changes.filter((change): change is JSX.Element => change !== null)
        return described.length > 0
            ? {
                  description: described,
              }
            : null
    },
    responses_limit: function onResponsesLimit(change) {
        const description = describeFieldChange(
            i18n.t('surveyActivity.field.responsesLimit', { defaultValue: 'response limit' }),
            change?.before,
            change?.after,
            i18n.t('surveyActivity.unit.responses', { defaultValue: 'responses' })
        )
        return { description: description ? [description] : [] }
    },
    iteration_count: function onIterationCount(change) {
        const description = describeFieldChange(
            i18n.t('surveyActivity.field.iterationCount', { defaultValue: 'iteration count' }),
            change?.before,
            change?.after
        )
        return { description: description ? [description] : [] }
    },
    iteration_frequency_days: function onIterationFrequency(change) {
        const description = describeFieldChange(
            i18n.t('surveyActivity.field.iterationFrequency', { defaultValue: 'iteration frequency' }),
            change?.before,
            change?.after,
            i18n.t('surveyActivity.unit.days', { defaultValue: 'days' })
        )
        return { description: description ? [description] : [] }
    },
    targeting_flag: function onTargetingFlag(change) {
        const beforeFlag = change?.before as FeatureFlagBasicType | null
        const afterFlag = change?.after as FeatureFlagBasicType | null
        const changes: Description[] = []

        if (!beforeFlag && afterFlag) {
            changes.push(
                <Trans
                    i18nKey="surveyActivity.targetingFlag.added"
                    values={{ key: afterFlag.key }}
                    components={{ Key: <strong /> }}
                    defaults="added a targeting flag with key <Key>{{ key }}</Key>"
                />
            )
            if (afterFlag.filters?.groups?.length > 0) {
                changes.push(
                    <>
                        {i18n.t('surveyActivity.targetingFlag.setConditions', {
                            defaultValue: 'set new targeting conditions',
                        })}
                    </>
                )
            }
        } else if (beforeFlag && !afterFlag) {
            changes.push(
                <Trans
                    i18nKey="surveyActivity.targetingFlag.removed"
                    values={{ key: beforeFlag.key }}
                    components={{ Key: <strong /> }}
                    defaults="removed the targeting flag with key <Key>{{ key }}</Key>"
                />
            )
        } else if (beforeFlag && afterFlag) {
            if (beforeFlag.key !== afterFlag.key) {
                changes.push(
                    <Trans
                        i18nKey="surveyActivity.targetingFlag.keyChanged"
                        values={{ before: beforeFlag.key, after: afterFlag.key }}
                        components={{ Before: <strong />, After: <strong /> }}
                        defaults="changed targeting flag key from <Before>{{ before }}</Before> to <After>{{ after }}</After>"
                    />
                )
            }
        }

        return changes.length > 0
            ? {
                  description: changes,
              }
            : null
    },
    targeting_flag_filters: function onTargetingFlagFilter(change) {
        const beforeFlag = change?.before as FeatureFlagFilters | null
        const afterFlag = change?.after as FeatureFlagFilters | null
        const changes: Description[] = []

        if (!beforeFlag && afterFlag) {
            changes.push(
                <>
                    {i18n.t('surveyActivity.targetingFlagFilter.added', {
                        defaultValue: 'added a targeting flag filter',
                    })}
                </>
            )
        } else if (beforeFlag && !afterFlag) {
            changes.push(
                <>
                    {i18n.t('surveyActivity.targetingFlagFilter.removed', {
                        defaultValue: 'removed targeting flag filter',
                    })}
                </>
            )
        } else if (beforeFlag && afterFlag) {
            if (JSON.stringify(beforeFlag) !== JSON.stringify(afterFlag)) {
                changes.push(
                    <>
                        {i18n.t('surveyActivity.targetingFlagFilter.changed', {
                            defaultValue: 'changed targeting conditions',
                        })}
                    </>
                )
            }
        }

        return changes.length > 0
            ? {
                  description: changes,
              }
            : null
    },
}

export function surveyActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope !== 'Survey') {
        console.error('survey describer received a non-survey activity')
        return { description: null }
    }

    const user = <ActivityLogUserName logItem={logItem} />
    const surveyLink = nameOrLinkToSurvey(logItem?.item_id, logItem?.detail.name, logItem.activity)

    if (logItem.activity === 'created') {
        return {
            description: (
                <>
                    {user} {i18n.t('activityLog.created', { defaultValue: 'created' })} {surveyLink}
                </>
            ),
        }
    }

    if (logItem.activity === 'deleted') {
        return {
            description: (
                <>
                    {user} {i18n.t('activityLog.deleted', { defaultValue: 'deleted' })} {surveyLink}
                </>
            ),
        }
    }

    if (logItem.activity === 'updated') {
        const changes: { field: string; description: Description }[] = []

        for (const change of logItem.detail.changes || []) {
            if (!change?.field) {
                continue
            }

            const possibleLogItem = surveyActionsMapping[change.field]?.(change, logItem)
            if (possibleLogItem?.description) {
                if (Array.isArray(possibleLogItem.description) && possibleLogItem.description.length > 1) {
                    // This is for the conditions section, which may have multiple changes.
                    // Probably could be refactored into a separate handler like some of the other fields
                    changes.push(
                        ...possibleLogItem.description.map((desc) => ({
                            field: 'conditions',
                            description: desc,
                        }))
                    )
                } else {
                    changes.push({
                        field: change.field,
                        description: possibleLogItem.description[0],
                    })
                }
            }
        }

        if (changes.length === 1) {
            const { field, description } = changes[0]
            const preposition =
                field === 'conditions'
                    ? i18n.t('surveyActivity.preposition.for', { defaultValue: 'for' })
                    : getPreposition(field)
            return {
                description: (
                    <>
                        {user} {description} {preposition} {surveyLink}
                    </>
                ),
            }
        } else if (changes.length > 1) {
            return {
                description: (
                    <>
                        {user}{' '}
                        {i18n.t('surveyActivity.madeMultipleChangesTo', { defaultValue: 'made multiple changes to' })}{' '}
                        {surveyLink}:
                        <ul className="bullet-list">
                            {changes.map(({ description }, index) => (
                                <li key={index}>{description}</li>
                            ))}
                        </ul>
                    </>
                ),
            }
        }
    }

    return defaultDescriber(logItem, asNotification, surveyLink)
}

/** The word that carries a changed field into the survey it belongs to. */
export function getPreposition(field: string): string {
    switch (field) {
        case 'questions':
        case 'appearance':
        case 'type':
            return i18n.t('surveyActivity.preposition.of', { defaultValue: 'of' })
        case 'name':
        case 'description':
        case 'responses_limit':
        case 'iteration_count':
        case 'iteration_frequency_days':
        case 'targeting_flag_filters':
        case 'targeting_flag':
            return i18n.t('surveyActivity.preposition.for', { defaultValue: 'for' })
        case 'archived':
        case 'start_date':
        case 'end_date':
            return ''
        default:
            return i18n.t('surveyActivity.preposition.of', { defaultValue: 'of' })
    }
}

type SurveyQuestion = BasicSurveyQuestion | LinkSurveyQuestion | RatingSurveyQuestion | MultipleSurveyQuestion

export function describeQuestionChanges(before: SurveyQuestion, after: SurveyQuestion): JSX.Element[] {
    const commonChanges = describeCommonChanges(before, after)
    const typeChangeDescription =
        before.type !== after.type
            ? [
                  <Trans
                      i18nKey="surveyActivity.question.typeChanged"
                      values={{ before: questionTypeLabel(before.type), after: questionTypeLabel(after.type) }}
                      components={{ Before: <strong />, After: <strong /> }}
                      defaults="changed question type from <Before>{{ before }}</Before> to <After>{{ after }}</After>"
                  />,
              ]
            : []

    const specificChanges = match([before, after])
        .with([{ type: SurveyQuestionType.Link }, { type: SurveyQuestionType.Link }], describeLinkChanges)
        .with([{ type: SurveyQuestionType.Rating }, { type: SurveyQuestionType.Rating }], describeRatingChanges)
        .with(
            [
                { type: P.union(SurveyQuestionType.SingleChoice, SurveyQuestionType.MultipleChoice) },
                { type: P.union(SurveyQuestionType.SingleChoice, SurveyQuestionType.MultipleChoice) },
            ],
            describeMultipleChoiceChanges
        )
        .otherwise(() => [])

    return [...commonChanges, ...typeChangeDescription, ...specificChanges, ...describeBranchingChanges(before, after)]
}

export function describeCommonChanges(before: SurveyQuestion, after: SurveyQuestion): JSX.Element[] {
    const changes: JSX.Element[] = []
    if (before.question !== after.question) {
        changes.push(
            <Trans
                i18nKey="surveyActivity.question.textChanged"
                values={{ before: before.question, after: after.question }}
                components={{ Before: <strong />, After: <strong /> }}
                defaults='changed question text from "<Before>{{ before }}</Before>" to "<After>{{ after }}</After>"'
            />
        )
    }
    if (before.description !== after.description) {
        changes.push(
            <>
                {i18n.t('surveyActivity.question.descriptionChanged', {
                    defaultValue: 'changed the question description from',
                })}{' '}
                {formatDescription(before.description)} {i18n.t('surveyActivity.to', { defaultValue: 'to' })}{' '}
                {formatDescription(after.description)}
            </>
        )
    }
    if (before.optional !== after.optional) {
        changes.push(
            <>
                {after.optional
                    ? i18n.t('surveyActivity.question.madeOptional', { defaultValue: 'made question optional' })
                    : i18n.t('surveyActivity.question.madeRequired', { defaultValue: 'made question required' })}
            </>
        )
    }
    if (before.buttonText !== after.buttonText) {
        changes.push(
            <Trans
                i18nKey="surveyActivity.question.buttonTextChanged"
                values={{ before: before.buttonText, after: after.buttonText }}
                components={{ Before: <strong />, After: <strong /> }}
                defaults='changed button text from "<Before>{{ before }}</Before>" to "<After>{{ after }}</After>"'
            />
        )
    }
    return changes
}

export function describeLinkChanges([before, after]: [LinkSurveyQuestion, LinkSurveyQuestion]): JSX.Element[] {
    return before.link !== after.link
        ? [
              <Trans
                  i18nKey="surveyActivity.question.linkChanged"
                  values={{ before: before.link, after: after.link }}
                  components={{ Before: <strong />, After: <strong /> }}
                  defaults="updated link from <Before>{{ before }}</Before> to <After>{{ after }}</After>"
              />,
          ]
        : []
}

export function describeRatingChanges([before, after]: [RatingSurveyQuestion, RatingSurveyQuestion]): JSX.Element[] {
    const changes: JSX.Element[] = []
    if (before.display !== after.display) {
        changes.push(
            <Trans
                i18nKey="surveyActivity.question.ratingDisplayChanged"
                values={{ before: before.display, after: after.display }}
                components={{ Before: <strong />, After: <strong /> }}
                defaults="changed rating display from <Before>{{ before }}</Before> to <After>{{ after }}</After>"
            />
        )
    }
    if (before.scale !== after.scale) {
        changes.push(
            <Trans
                i18nKey="surveyActivity.question.ratingScaleChanged"
                values={{ before: before.scale, after: after.scale }}
                components={{ Before: <strong />, After: <strong /> }}
                defaults="changed rating scale from <Before>{{ before }}</Before> to <After>{{ after }}</After>"
            />
        )
    }
    if (before.lowerBoundLabel !== after.lowerBoundLabel || before.upperBoundLabel !== after.upperBoundLabel) {
        changes.push(
            <Trans
                i18nKey="surveyActivity.question.ratingLabelsChanged"
                values={{
                    lowerBefore: before.lowerBoundLabel,
                    upperBefore: before.upperBoundLabel,
                    lowerAfter: after.lowerBoundLabel,
                    upperAfter: after.upperBoundLabel,
                }}
                components={{
                    LowerBefore: <strong />,
                    UpperBefore: <strong />,
                    LowerAfter: <strong />,
                    UpperAfter: <strong />,
                }}
                defaults='updated rating labels from <LowerBefore>"{{ lowerBefore }}"</LowerBefore>-<UpperBefore>"{{ upperBefore }}"</UpperBefore> to <LowerAfter>"{{ lowerAfter }}"</LowerAfter>-<UpperAfter>"{{ upperAfter }}"</UpperAfter>'
            />
        )
    }
    return changes
}

export function describeMultipleChoiceChanges([before, after]: [
    MultipleSurveyQuestion,
    MultipleSurveyQuestion,
]): JSX.Element[] {
    const changes: JSX.Element[] = []
    if (JSON.stringify(before.choices) !== JSON.stringify(after.choices)) {
        const addedChoices = after.choices.filter((c) => !before.choices.includes(c))
        const removedChoices = before.choices.filter((c) => !after.choices.includes(c))
        if (addedChoices.length > 0) {
            changes.push(
                <Trans
                    i18nKey="surveyActivity.question.choicesAdded"
                    values={{ choices: addedChoices.join(', ') }}
                    components={{ Choices: <strong /> }}
                    defaults="added choices: <Choices>{{ choices }}</Choices>"
                />
            )
        }
        if (removedChoices.length > 0) {
            changes.push(
                <Trans
                    i18nKey="surveyActivity.question.choicesRemoved"
                    values={{ choices: removedChoices.join(', ') }}
                    components={{ Choices: <strong /> }}
                    defaults="removed choices: <Choices>{{ choices }}</Choices>"
                />
            )
        }
    }
    if (before.shuffleOptions !== after.shuffleOptions) {
        changes.push(
            <>
                {after.shuffleOptions
                    ? i18n.t('surveyActivity.question.shufflingEnabled', { defaultValue: 'enabled option shuffling' })
                    : i18n.t('surveyActivity.question.shufflingDisabled', {
                          defaultValue: 'disabled option shuffling',
                      })}
            </>
        )
    }
    if (before.hasOpenChoice !== after.hasOpenChoice) {
        changes.push(
            <>
                {after.hasOpenChoice
                    ? i18n.t('surveyActivity.question.openChoiceAdded', { defaultValue: 'added open choice option' })
                    : i18n.t('surveyActivity.question.openChoiceRemoved', {
                          defaultValue: 'removed open choice option',
                      })}
            </>
        )
    }
    return changes
}

export function describeBranchingChanges(before: SurveyQuestion, after: SurveyQuestion): JSX.Element[] {
    if (JSON.stringify(before.branching) !== JSON.stringify(after.branching)) {
        return [<>{i18n.t('surveyActivity.question.branchingChanged', { defaultValue: 'updated branching logic' })}</>]
    }
    return []
}

export const formatDescription = (value: string | null | undefined): JSX.Element => {
    if (value === undefined || value === null || value === '') {
        return <i>{i18n.t('surveyActivity.unset', { defaultValue: 'unset' })}</i>
    }
    return <strong>"{truncate(value, 50)}"</strong>
}

export function describeFieldChange<T>(fieldName: string, before: T, after: T, unit?: string): JSX.Element | null {
    if (isEmptyOrUndefined(before) && isEmptyOrUndefined(after)) {
        return null
    }
    const withUnit = (value: T): string => `${String(value)}${unit ? ` ${unit}` : ''}`
    if (isEmptyOrUndefined(before) && !isEmptyOrUndefined(after)) {
        return (
            <Trans
                i18nKey="surveyActivity.fieldChange.set"
                values={{ field: fieldName, value: withUnit(after) }}
                components={{ Value: <strong /> }}
                defaults="set {{ field }} to <Value>{{ value }}</Value>"
            />
        )
    } else if (!isEmptyOrUndefined(before) && isEmptyOrUndefined(after)) {
        return (
            <Trans
                i18nKey="surveyActivity.fieldChange.removed"
                values={{ field: fieldName, value: withUnit(before) }}
                components={{ Value: <strong /> }}
                defaults="removed {{ field }} (was <Value>{{ value }}</Value>)"
            />
        )
    } else if (before !== after) {
        return (
            <Trans
                i18nKey="surveyActivity.fieldChange.changed"
                values={{ field: fieldName, before: withUnit(before), after: withUnit(after) }}
                components={{ Before: <strong />, After: <strong /> }}
                defaults="changed {{ field }} from <Before>{{ before }}</Before> to <After>{{ after }}</After>"
            />
        )
    }
    return null
}
