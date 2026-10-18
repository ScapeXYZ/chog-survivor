import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
const fixture=vi.hoisted(()=>({renders:0}))
vi.mock('./NftApp',()=>({default:()=>{fixture.renders++;return <h1>NFT route fixture</h1>}}))
import {Routes} from './Routes'
afterEach(()=>{cleanup();window.location.hash='';fixture.renders=0})
it('starts directly as Guest without initializing the wallet app',()=>{window.location.hash='#guest';render(<Routes/>);expect(screen.getByRole('heading',{name:'Broken Bridge'})).toBeVisible();expect(fixture.renders).toBe(0)})
it('loads the NFT app only on explicit navigation and returns to a clean guest',async()=>{window.location.hash='#guest';render(<Routes/>);fireEvent.click(document.querySelectorAll('.guest-choices button')[0]);fireEvent.click(screen.getByRole('button',{name:'Play with Your NFT'}));fireEvent(window,new HashChangeEvent('hashchange'));expect(await screen.findByRole('heading',{name:'NFT route fixture'})).toBeVisible();window.location.hash='#guest';fireEvent(window,new HashChangeEvent('hashchange'));expect(await screen.findByRole('heading',{name:'Broken Bridge'})).toBeVisible();expect(document.querySelector('.guest-stats')).toHaveTextContent('XP0TRUST0SCARS0')})
