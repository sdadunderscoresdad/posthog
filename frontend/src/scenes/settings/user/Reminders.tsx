import type { TFunction } from 'i18next'
import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { useTranslation } from 'react-i18next'

import { IconPencil, IconPlus, IconTrash } from '@posthog/icons'
import { LemonButton, LemonInput, LemonModal, LemonSelect, LemonTable, LemonTag } from '@posthog/lemon-ui'

import { DatePicker } from 'lib/components/DatePicker/DatePicker'
import { TZLabel } from 'lib/components/TZLabel'
import { dayjs } from 'lib/dayjs'
import { LemonDialog } from 'lib/lemon-ui/LemonDialog'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { LemonInputSelect } from 'lib/lemon-ui/LemonInputSelect/LemonInputSelect'
import { LemonSegmentedButton } from 'lib/lemon-ui/LemonSegmentedButton'
import { LemonTextArea } from 'lib/lemon-ui/LemonTextArea'
import { capitalizeFirstLetter } from 'lib/utils/strings'

import { ReminderApi, ReminderStatusEnumApi } from 'products/reminders/frontend/generated/api.schemas'

import { remindersLogic } from './remindersLogic'

function recurrenceOptions(t: TFunction): { value: string; label: string }[] {
    return [
        { value: 'daily', label: t('settings.user.reminders.recurrence.daily', { defaultValue: 'Daily' }) },
        { value: 'weekly', label: t('settings.user.reminders.recurrence.weekly', { defaultValue: 'Weekly' }) },
        { value: 'monthly', label: t('settings.user.reminders.recurrence.monthly', { defaultValue: 'Monthly' }) },
        { value: 'yearly', label: t('settings.user.reminders.recurrence.yearly', { defaultValue: 'Yearly' }) },
    ]
}

const STATUS_TAG_TYPE: Record<ReminderStatusEnumApi, 'primary' | 'muted' | 'danger'> = {
    active: 'primary',
    completed: 'muted',
    errored: 'danger',
}

function scheduleSummary(t: TFunction, reminder: ReminderApi): string {
    if (reminder.cron_expression) {
        return t('settings.user.reminders.cronSummary', {
            defaultValue: 'Cron: {{ expression }}',
            expression: reminder.cron_expression,
        })
    }
    if (reminder.recurrence_interval) {
        return (
            recurrenceOptions(t).find((option) => option.value === reminder.recurrence_interval)?.label ??
            capitalizeFirstLetter(reminder.recurrence_interval)
        )
    }
    return t('settings.user.reminders.scheduleTypes.oneOff', { defaultValue: 'One-off' })
}

function reminderStatusLabel(t: TFunction, status: ReminderStatusEnumApi): string {
    switch (status) {
        case 'active':
            return t('settings.user.reminders.status.active', { defaultValue: 'Active' })
        case 'completed':
            return t('settings.user.reminders.status.completed', { defaultValue: 'Completed' })
        case 'errored':
            return t('settings.user.reminders.status.errored', { defaultValue: 'Errored' })
        default:
            return capitalizeFirstLetter(status)
    }
}

function ReminderModal(): JSX.Element {
    const { t } = useTranslation()
    const {
        editingReminderId,
        reminderForm,
        isReminderFormSubmitting,
        isScheduleEditable,
        projectOptions,
        timezoneOptions,
    } = useValues(remindersLogic)
    const { setEditingReminderId, submitReminderForm } = useActions(remindersLogic)

    const isOpen = editingReminderId !== null
    const isCreating = editingReminderId === 'new'

    return (
        <LemonModal
            isOpen={isOpen}
            onClose={() => setEditingReminderId(null)}
            title={
                isCreating
                    ? t('settings.user.reminders.new', { defaultValue: 'New reminder' })
                    : t('settings.user.reminders.edit', { defaultValue: 'Edit reminder' })
            }
            footer={
                <>
                    <LemonButton type="secondary" onClick={() => setEditingReminderId(null)}>
                        {t('settings.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton
                        type="primary"
                        onClick={submitReminderForm}
                        loading={isReminderFormSubmitting}
                        data-attr="save-reminder"
                    >
                        {isCreating
                            ? t('settings.user.reminders.create', { defaultValue: 'Create reminder' })
                            : t('settings.save', { defaultValue: 'Save' })}
                    </LemonButton>
                </>
            }
        >
            <Form logic={remindersLogic} formKey="reminderForm" className="deprecated-space-y-4">
                <LemonField name="title" label={t('settings.user.reminders.fields.title', { defaultValue: 'Title' })}>
                    <LemonInput
                        placeholder={t('settings.user.reminders.titlePlaceholder', {
                            defaultValue: 'Review the activation dashboard',
                        })}
                        maxLength={255}
                        autoFocus
                    />
                </LemonField>
                <LemonField
                    name="message"
                    label={t('settings.user.reminders.fields.message', { defaultValue: 'Message' })}
                    info={t('settings.user.reminders.messageInfo', {
                        defaultValue: 'Optional longer text shown in the notification.',
                    })}
                >
                    <LemonTextArea
                        placeholder={t('settings.user.reminders.messagePlaceholder', {
                            defaultValue: 'Optional details',
                        })}
                        minRows={2}
                    />
                </LemonField>
                <LemonField
                    name="team"
                    label={t('settings.user.reminders.fields.project', { defaultValue: 'Project' })}
                >
                    {({ value, onChange }) => (
                        <LemonSelect value={value} onChange={onChange} options={projectOptions} fullWidth />
                    )}
                </LemonField>

                <LemonField
                    name="scheduleType"
                    label={t('settings.user.reminders.fields.schedule', { defaultValue: 'Schedule' })}
                >
                    {({ value, onChange }) => (
                        <LemonSegmentedButton
                            value={value}
                            onChange={onChange}
                            disabledReason={
                                !isScheduleEditable
                                    ? t('settings.user.reminders.alreadyFired', {
                                          defaultValue: 'This reminder has already fired',
                                      })
                                    : undefined
                            }
                            options={[
                                {
                                    value: 'one-off',
                                    label: t('settings.user.reminders.scheduleTypes.oneOff', {
                                        defaultValue: 'One-off',
                                    }),
                                },
                                {
                                    value: 'repeats',
                                    label: t('settings.user.reminders.scheduleTypes.repeats', {
                                        defaultValue: 'Repeats',
                                    }),
                                },
                                {
                                    value: 'advanced',
                                    label: t('settings.user.reminders.scheduleTypes.advanced', {
                                        defaultValue: 'Advanced',
                                    }),
                                },
                            ]}
                            fullWidth
                        />
                    )}
                </LemonField>

                {reminderForm.scheduleType === 'one-off' && (
                    <LemonField
                        name="scheduled_at"
                        label={t('settings.user.reminders.fields.firesAt', { defaultValue: 'Fires at' })}
                    >
                        {({ value, onChange }) => (
                            <DatePicker
                                value={value ? dayjs(value) : null}
                                onChange={(date) => onChange(date ? date.toISOString() : null)}
                                granularity="minute"
                                placeholder={t('settings.user.reminders.selectDateTime', {
                                    defaultValue: 'Select date and time',
                                })}
                                maxDate={dayjs().add(10, 'year')}
                                disabledReason={
                                    !isScheduleEditable
                                        ? t('settings.user.reminders.alreadyFired', {
                                              defaultValue: 'This reminder has already fired',
                                          })
                                        : undefined
                                }
                            />
                        )}
                    </LemonField>
                )}

                {reminderForm.scheduleType === 'repeats' && (
                    <LemonField
                        name="recurrence_interval"
                        label={t('settings.user.reminders.fields.repeatsEvery', { defaultValue: 'Repeats every' })}
                    >
                        {({ value, onChange }) => (
                            <LemonSelect
                                value={value}
                                onChange={onChange}
                                options={recurrenceOptions(t)}
                                placeholder={t('settings.user.reminders.selectInterval', {
                                    defaultValue: 'Select an interval',
                                })}
                                disabled={!isScheduleEditable}
                                fullWidth
                            />
                        )}
                    </LemonField>
                )}

                {reminderForm.scheduleType === 'advanced' && (
                    <LemonField
                        name="cron_expression"
                        label={t('settings.user.reminders.fields.cron', { defaultValue: 'Cron expression' })}
                        info={t('settings.user.reminders.cronInfo', {
                            defaultValue: '5-field cron, max 4 fires per day.',
                        })}
                    >
                        <LemonInput placeholder="0 9 * * 1" disabled={!isScheduleEditable} />
                    </LemonField>
                )}

                {reminderForm.scheduleType !== 'one-off' && (
                    <LemonField
                        name="end_date"
                        label={t('settings.user.reminders.fields.ends', { defaultValue: 'Ends' })}
                        info={t('settings.user.reminders.endsInfo', {
                            defaultValue: 'Optional. The reminder stops after this time.',
                        })}
                    >
                        {({ value, onChange }) => (
                            <DatePicker
                                value={value ? dayjs(value) : null}
                                onChange={(date) => onChange(date ? date.toISOString() : null)}
                                granularity="minute"
                                placeholder={t('settings.user.reminders.noEndDate', { defaultValue: 'No end date' })}
                                clearable
                                maxDate={dayjs().add(10, 'year')}
                                disabledReason={
                                    !isScheduleEditable
                                        ? t('settings.user.reminders.alreadyFired', {
                                              defaultValue: 'This reminder has already fired',
                                          })
                                        : undefined
                                }
                            />
                        )}
                    </LemonField>
                )}

                <LemonField
                    name="timezone"
                    label={t('settings.user.reminders.fields.timeZone', { defaultValue: 'Time zone' })}
                >
                    {({ value, onChange }) => (
                        <LemonInputSelect
                            mode="single"
                            value={[value]}
                            onChange={(newTimezones) => newTimezones[0] && onChange(newTimezones[0])}
                            options={timezoneOptions}
                            placeholder={t('settings.user.reminders.selectTimeZone', {
                                defaultValue: 'Select a time zone',
                            })}
                            disabled={!isScheduleEditable}
                            virtualized
                        />
                    )}
                </LemonField>
            </Form>
        </LemonModal>
    )
}

export function Reminders(): JSX.Element {
    const { t } = useTranslation()
    const { reminders, remindersLoading } = useValues(remindersLogic)
    const { setEditingReminderId, deleteReminder } = useActions(remindersLogic)

    return (
        <div className="flex flex-col gap-4">
            <div>
                <LemonButton
                    type="primary"
                    icon={<IconPlus />}
                    onClick={() => setEditingReminderId('new')}
                    data-attr="new-reminder"
                >
                    {t('settings.user.reminders.new', { defaultValue: 'New reminder' })}
                </LemonButton>
            </div>

            <LemonTable
                loading={remindersLoading}
                dataSource={reminders}
                rowKey="id"
                emptyState={t('settings.user.reminders.empty', {
                    defaultValue: "No reminders yet. Create one to get a nudge when it's due.",
                })}
                columns={[
                    {
                        title: t('settings.user.reminders.fields.title', { defaultValue: 'Title' }),
                        dataIndex: 'title',
                        render: (_, reminder) => <span className="font-semibold">{reminder.title}</span>,
                    },
                    {
                        title: t('settings.user.reminders.fields.schedule', { defaultValue: 'Schedule' }),
                        render: (_, reminder) => scheduleSummary(t, reminder),
                    },
                    {
                        title: t('settings.user.reminders.fields.nextFire', { defaultValue: 'Next fire' }),
                        render: (_, reminder) =>
                            reminder.next_fire_at ? <TZLabel time={reminder.next_fire_at} /> : '—',
                    },
                    {
                        title: t('settings.user.reminders.fields.status', { defaultValue: 'Status' }),
                        render: (_, reminder) => (
                            <LemonTag type={STATUS_TAG_TYPE[reminder.status]}>
                                {reminderStatusLabel(t, reminder.status)}
                            </LemonTag>
                        ),
                    },
                    {
                        title: '',
                        width: 0,
                        render: (_, reminder) => (
                            <div className="flex gap-1 justify-end">
                                <LemonButton
                                    size="small"
                                    icon={<IconPencil />}
                                    tooltip={t('settings.user.reminders.edit', { defaultValue: 'Edit reminder' })}
                                    onClick={() => setEditingReminderId(reminder.id)}
                                />
                                <LemonButton
                                    size="small"
                                    status="danger"
                                    icon={<IconTrash />}
                                    tooltip={t('settings.apiKeys.actions.delete', { defaultValue: 'Delete' })}
                                    onClick={() =>
                                        LemonDialog.open({
                                            title: t('settings.user.reminders.deleteTitle', {
                                                defaultValue: 'Delete reminder?',
                                            }),
                                            description: t('settings.user.reminders.deleteDescription', {
                                                defaultValue: '"{{ title }}" will be permanently deleted.',
                                                title: reminder.title,
                                            }),
                                            primaryButton: {
                                                children: t('settings.apiKeys.actions.delete', {
                                                    defaultValue: 'Delete',
                                                }),
                                                status: 'danger',
                                                onClick: () => deleteReminder(reminder.id),
                                            },
                                            secondaryButton: {
                                                children: t('settings.cancel', { defaultValue: 'Cancel' }),
                                            },
                                        })
                                    }
                                />
                            </div>
                        ),
                    },
                ]}
            />

            <ReminderModal />
        </div>
    )
}
