import { browser } from '@wdio/globals';
import { APLComponentFixture } from './APLComponentFixture';

export class APLGridSequenceFixture extends APLComponentFixture {
    async wrapperStyle(property: string): Promise<string> {
        return browser.execute((sel: string, prop: string) => {
            const el = document.querySelector(sel) as any;
            const wrapper = el?.shadowRoot?.querySelector('.wrapper');
            if (!wrapper) return '';
            return getComputedStyle(wrapper)[prop as any];
        }, this.selector, property);
    }

    testGridSequence() {
        this.testBase();
        this.testHasProperties(['data', 'childWidth', 'childHeight', 'scrollDirection', 'snap', 'numbered', 'preserve']);
        this.testHasEvents([
            'onMount',
            'onChildrenChanged',
            'onFocus',
            'onBlur',
            'handleKeyDown',
            'handleKeyUp',
            'onScroll',
        ]);
        this.testPropertyType('scrollDirection', 'list');
        this.testPropertyType('childWidth', 'dimension');
        this.testPropertyType('childHeight', 'dimension');
        this.testPropertyType('snap', 'list');
        this.testPropertyDefault('scrollDirection', 'vertical');
        this.testPropertyDefault('snap', 'none');
    }
}
