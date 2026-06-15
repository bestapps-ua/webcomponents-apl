import { APLComponentFixture } from './APLComponentFixture';

export class APLTextFixture extends APLComponentFixture {
    testText() {
        this.testBase();
        this.testHasProperties([
            'text', 'color', 'fontSize', 'fontFamily', 'fontWeight',
            'fontStyle', 'lang', 'letterSpacing', 'lineHeight', 'maxLines',
            'textAlign', 'textAlignVertical',
        ]);
        this.testHasEvents(['onMount', 'onTextLayout']);
        this.testPositionProperties();
        this.testPropertyType('fontSize', 'dimension');
        this.testPropertyType('color', 'color');
        this.testPropertyType('fontStyle', 'list');
        this.testPropertyType('textAlign', 'list');
        this.testPropertyType('textAlignVertical', 'list');
        this.testPropertyDefault('fontSize', '40dp');
        this.testPropertyDefault('fontStyle', 'normal');
        this.testPropertyDefault('fontWeight', 'normal');
        this.testPropertyDefault('textAlign', 'auto');
        this.testPropertyDefault('textAlignVertical', 'auto');
    }
}
