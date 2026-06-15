import { browser } from '@wdio/globals';
import { APLComponentFixture } from './APLComponentFixture';

export class APLPagerFixture extends APLComponentFixture {
    async wrapperStyle(property: string): Promise<string> {
        return browser.execute((sel: string, prop: string) => {
            const el = document.querySelector(sel) as any;
            const wrapper = el?.shadowRoot?.querySelector('.wrapper');
            if (!wrapper) return '';
            return getComputedStyle(wrapper)[prop as any];
        }, this.selector, property);
    }

    testPager() {
        this.testBase();
        this.testHasProperties(['data', 'initialPage', 'pageDirection', 'navigation', 'preserve']);
        this.testHasEvents([
            'onMount',
            'onChildrenChanged',
            'onFocus',
            'onBlur',
            'handleKeyDown',
            'handleKeyUp',
            'onPageChanged',
            'handlePageMove',
        ]);
        this.testPropertyType('navigation', 'list');
        this.testPropertyType('pageDirection', 'list');
        this.testPropertyDefault('navigation', 'wrap');
        this.testPropertyDefault('pageDirection', 'horizontal');
        this.testPropertyDefault('initialPage', '0');
    }
}
