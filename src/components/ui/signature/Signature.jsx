import { useEffect, useRef } from 'react';
import { VIEW_BOX, STROKES, THICKEN } from './signatureData.js';

/**
 * The signature, optionally drawing itself.
 *
 * Each stroke is the real filled artwork masked by a stroked centreline. The
 * centreline is never visible; animating its dash offset from 1 to 0 uncovers
 * the artwork in the order and direction a pen would lay it down, keeping the
 * pen weight that makes it look handwritten. Dashing the filled path directly
 * cannot do this — a fill has a boundary, not a direction, so it would trace
 * the outline of each letter instead of the letter itself.
 *
 * `uid` scopes the mask ids. Two copies of this component render at once (the
 * splash and the docked mark) and duplicate ids in a document mean the second
 * copy silently steals the first one's mask.
 */
/* The flourish, and everything that is not.
 *
 * `share` in signatureData.js weights each stroke by its length, which gives
 * one pen speed across the whole signature. That is not how this signature is
 * actually written: the Z is a single swept flourish and the three letters
 * after it are deliberate. Running both at one speed makes the letters look
 * hurried no matter how long the total is.
 *
 * So the letters get their own pace multiplier on top of the length weighting.
 * At 2.8 they take nearly three times as long per unit of ink as the Z does.
 *
 * Keyed off the stroke id rather than an index or a field in signatureData.js,
 * because that file is generated from public/signature.svg and says so — a
 * hand-added field there would be wiped the next time it is regenerated. */
const FLOURISH = 'z';
const LETTER_PACE = 2.8;

export default function Signature({ uid, run = false, duration = 2600, className }) {
    const ref = useRef(null);

    // Timeline is laid out here rather than in CSS because each stroke's slice
    // is data (see signatureData.js), and a stylesheet cannot read it.
    //
    // The weights are NORMALISED back to `duration`, so that prop stays the
    // total wall-clock time of the draw whatever the paces are. Hi.jsx times
    // the splash off the same number, and having the two drift apart would
    // either cut the signature off mid-letter or leave the page waiting on
    // nothing.
    const weights = STROKES.map((s) => s.share * (s.id === FLOURISH ? 1 : LETTER_PACE));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let acc = 0;
    const timing = STROKES.map((s, i) => {
        const dur = (weights[i] / totalWeight) * duration;
        // Strokes start slightly before the previous one lands. A pen does not
        // stop dead between letters, and a perfectly serial sequence reads as
        // four separate animations rather than one hand moving.
        const delay = Math.max(0, acc - dur * 0.08);
        acc += dur;
        return { delay, dur };
    });

    useEffect(() => {
        if (!run || !ref.current) return;
        const paths = ref.current.querySelectorAll('.sig-trace');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const animations = [];

        paths.forEach((path, i) => {
            path.style.strokeDashoffset = '1';

            if (reducedMotion) {
                path.style.strokeDashoffset = '0';
                return;
            }

            if (typeof path.animate === 'function') {
                animations.push(
                    path.animate(
                        [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
                        {
                            duration: timing[i].dur,
                            delay: timing[i].delay,
                            easing: STROKES[i].ease,
                            fill: 'forwards',
                        }
                    )
                );
                return;
            }

            path.style.transition = [
                `stroke-dashoffset ${timing[i].dur}ms ${STROKES[i].ease}`,
                `visibility 0s ${timing[i].delay}ms`,
            ].join(', ');
            path.style.strokeDashoffset = '0';
        });

        return () => animations.forEach((animation) => animation.cancel());
    }, [run]);

    return (
        <svg
            ref={ref}
            className={className}
            viewBox={VIEW_BOX}
            fill="currentColor"
            role="img"
            aria-label="Altyeb's signature"
        >
            <title>Developed by Altyeb</title>
            <defs>
                {STROKES.map((s, i) => (
                    <mask key={s.id} id={`${uid}-m-${s.id}`} maskUnits="userSpaceOnUse">
                        <path
                            className="sig-trace"
                            d={s.trace}
                            fill="none"
                            stroke="#fff"
                            strokeWidth={s.width}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength="1"
                            /* The gap is a hair over 1 so the dash never wraps
                               and shows a second segment at the far end. */
                            strokeDasharray="1 1.001"
                            style={{
                                strokeDashoffset: run ? 1 : 0,
                            }}
                        />
                    </mask>
                ))}
            </defs>
            <g>
                {STROKES.map((s) => (
                    <path
                        key={s.id}
                        d={s.fill}
                        mask={`url(#${uid}-m-${s.id})`}
                        /* Stroking the fill with its own colour fattens the
                           ink. The artwork is a fine-liner and reads as a
                           hairline at display size; the mask widths in the
                           data already account for the extra spread. */
                        stroke="currentColor"
                        strokeWidth={THICKEN}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        />
                ))}
            </g>
        </svg>
    );
}
