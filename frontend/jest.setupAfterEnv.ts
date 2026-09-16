import * as React from 'react'

// Registers the app's i18next instance for every test file. Without it, a component that calls
// `useTranslation` gets no instance, warns, and never resolves a translation, so a test that renders
// localized UI would assert against keys instead of text. The app does the same thing at boot, by
// importing this module through `I18nProvider`.
import 'lib/i18n/i18n'

global.React = React
