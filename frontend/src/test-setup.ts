import '@testing-library/jest-dom/vitest'

import {vi} from 'vitest'
// Historical read-only/Anvil suites use withheld authorization explicitly.
// mainnetRelease.test.ts unmocks this module to verify the actual production flag.
vi.mock('./mainnetRelease', () => ({mainnetGameplayReleaseAuthorized: false}))
