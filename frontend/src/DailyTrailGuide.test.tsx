import {cleanup,render,screen} from '@testing-library/react'
import {afterEach,expect,it} from 'vitest'
import {DailyTrailGuide} from './DailyTrailGuide'
afterEach(cleanup)
it('explains return timing and contract mechanics without inventing a record',()=>{render(<DailyTrailGuide/>);expect(screen.getByLabelText('The next dawn')).toHaveTextContent('00:00 UTC');expect(screen.queryByText(/Verified record/)).toBeNull();expect(screen.getByLabelText('The next dawn')).toHaveTextContent('may repeat')})
it('shows milestones only from supplied verified achievement bits',()=>{const {rerender}=render(<DailyTrailGuide state={{streak:7,scars:22,achievementMask:64n}}/>);expect(screen.getByText(/Verified record/)).toHaveTextContent('Seven Suns: earned. Unmarked Week: not earned');expect(screen.getByText(/Verified record/)).toHaveTextContent('20-Scar modifier');rerender(<DailyTrailGuide/>);expect(screen.queryByText(/Verified record/)).toBeNull()})
