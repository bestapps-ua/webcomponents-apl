import { browser } from '@wdio/globals';
import { APLComponentFixture } from './APLComponentFixture';

export class APLScrollViewFixture extends APLComponentFixture {
    async getWrapperOverflow(): Promise<string> {
        return browser.execute((sel: string) => {
            const el = document.querySelector(sel) as any;
            const wrapper = el?.shadowRoot?.querySelector('.wrapper');
            if (!wrapper) return '';
            return getComputedStyle(wrapper).overflow;
        }, this.selector);
    }

    testScrollView() {
        this.testBase();
        this.testHasEvents(['onFocus', 'onBlur', 'handleKeyDown', 'handleKeyUp', 'onScroll']);
    }
}
