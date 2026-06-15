import { APLComponentFixture } from './APLComponentFixture';

export class APLVectorGraphicFixture extends APLComponentFixture {
    testVectorGraphic() {
        this.testBase();
        this.testHasProperties(['source', 'align', 'scale', 'parameters']);
        this.testPositionProperties();
        this.testHasEvents([
            'onFocus',
            'onBlur',
            'handleKeyDown',
            'handleKeyUp',
            'onDown',
            'onMove',
            'onPress',
            'onUp',
            'onLoad',
            'onFail',
        ]);
        this.testPropertyType('align', 'list');
        this.testPropertyType('scale', 'list');
        this.testPropertyDefault('align', 'center');
        this.testPropertyDefault('scale', 'none');
    }
}
