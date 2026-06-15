/**
 * https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-video.html
 *
 * Plays one or more video streams. A leaf component (no children) that is
 * actionable, so it extends APLActionableComponent and adds the media event
 * handlers (onEnd, onPause, onPlay, onTimeUpdate, onTrackUpdate, onTrackReady,
 * onTrackFail). `source` is the primary content property.
 */
class APLVideoComponent extends APLActionableComponent {
    static tag = 'apl-video-component';

    getAPLProperties() {
        let properties = super.getAPLProperties();
        properties = Object.assign(properties, {
            // Primary content: a video URL, or an array of sources.
            source: {
                type: 'text',
                options: {}
            },
            // How audio is mixed while the video plays.
            audioTrack: {
                type: 'list',
                items: [
                    'foreground',
                    'background',
                    'none',
                ],
                default: 'foreground',
                options: {}
            },
            // Start playing as soon as the video is laid out.
            autoplay: {
                type: 'text',
                default: 'false',
                options: {}
            },
            // Start muted.
            muted: {
                type: 'text',
                default: 'false',
                options: {}
            },
            // How the video scales to fill the component bounds.
            scale: {
                type: 'list',
                items: [
                    'best-fit',
                    'best-fill',
                ],
                default: 'best-fit',
                options: {
                    visual: 'scale-picker',
                }
            },
            // Keep the screen awake while playing.
            screenLock: {
                type: 'text',
                default: 'true',
                options: {}
            },
            // Properties preserved across reinflation (e.g. playingState).
            preserve: {
                type: 'text',
                options: {}
            },
        });
        properties = Object.assign(APLProperties.getContainerProperties(), properties);
        properties = Object.assign(APLProperties.getAlignmentAndPositioningProperties(), properties);
        return properties;
    }

    getAPLEvents() {
        let events = super.getAPLEvents();
        events = Object.assign(events, {
            onEnd:         { type: 'commands', options: {} },
            onPause:       { type: 'commands', options: {} },
            onPlay:        { type: 'commands', options: {} },
            onTimeUpdate:  { type: 'commands', options: {} },
            onTrackUpdate: { type: 'commands', options: {} },
            onTrackReady:  { type: 'commands', options: {} },
            onTrackFail:   { type: 'commands', options: {} },
        });
        return events;
    }

    shouldCaptureClick() { return true; }

    _resolveSource(source) {
        let src = source;
        if (Array.isArray(src)) {
            src = src.length ? src[0] : '';
        }
        if (src && typeof src === 'object') {
            src = src.url || '';
        }
        return typeof src === 'string' ? src : '';
    }

    renderContent() {
        const data = this.getAPLData();

        const video = document.createElement('video');
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = data.scale === 'best-fill' ? 'cover' : 'contain';
        video.controls = true;
        if (data.muted === true || data.muted === 'true') {
            video.muted = true;
        }

        const src = this._resolveSource(data.source);
        if (src) {
            video.src = src;
        }

        this.element.wrapper.replaceChildren(video);
    }
}

customElements.define(APLVideoComponent.tag, APLVideoComponent);
registerAPLComponent('Video', APLVideoComponent);
