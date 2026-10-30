import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function ScrollAnimations({ children }) {
    const [location] = useLocation();
    const rootRef = useRef(null);

    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;

        const media = gsap.matchMedia(root);
        media.add('(prefers-reduced-motion: no-preference)', () => {
            const pageElements = gsap.utils.toArray(
                'main > section, main > form, footer, .shell main > div, .scroll-animation-root > .min-h-screen',
                root,
            );

            pageElements.forEach((element) => {
                gsap.fromTo(
                    element,
                    { autoAlpha: 0, y: 24 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.75,
                        ease: 'power3.out',
                        clearProps: 'opacity,transform,visibility',
                        scrollTrigger: {
                            trigger: element,
                            start: 'top 88%',
                            once: true,
                        },
                    },
                );
            });

            const cards = gsap.utils.toArray(
                '.landing-feature, .landing-issue-card, .landing-step-card, .about-principle-card, .contact-help-card, .public-stat-card, .card',
                root,
            ).filter((element) => !pageElements.includes(element));

            if (cards.length) {
                ScrollTrigger.batch(cards, {
                    start: 'top 90%',
                    once: true,
                    onEnter: (elements) => {
                        gsap.fromTo(
                            elements,
                            { autoAlpha: 0, y: 18 },
                            {
                                autoAlpha: 1,
                                y: 0,
                                duration: 0.6,
                                ease: 'power2.out',
                                stagger: 0.08,
                                clearProps: 'opacity,transform,visibility',
                            },
                        );
                    },
                });
            }
        });

        return () => media.revert();
    }, [location]);

    return <div className="scroll-animation-root">{children}</div>;
}
