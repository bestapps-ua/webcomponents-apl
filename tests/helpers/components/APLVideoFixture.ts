import { APLComponentFixture } from './APLComponentFixture';

export class APLVideoFixture extends APLComponentFixture {
    testVideo() {
        this.testBase();
        this.testHasProperties(['source', 'audioTrack', 'autoplay', 'muted', 'scale', 'screenLock', 'preserve']);
        this.testPositionProperties();
        this.testHasEvents([
            'onFocus',
            'onBlur',
            'handleKeyDown',
            'handleKeyUp',
            'onEnd',
            'onPause',
            'onPlay',
            'onTimeUpdate',
            'onTrackUpdate',
            'onTrackReady',
            'onTrackFail',
        ]);
        this.testPropertyType('audioTrack', 'list');
        this.testPropertyType('scale', 'list');
        this.testPropertyDefault('audioTrack', 'foreground');
        this.testPropertyDefault('scale', 'best-fit');
        this.testPropertyDefault('autoplay', 'false');
        this.testPropertyDefault('muted', 'false');
        this.testPropertyDefault('screenLock', 'true');
    }
}
