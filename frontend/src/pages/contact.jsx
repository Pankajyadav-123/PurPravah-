import { ArrowRight, ImageUp, Phone, ShieldCheck, Wifi } from 'lucide-react';
import { Link } from 'wouter';
import { SiteFooter, SiteHeader } from '@/components/app-shared';

export function ContactPage({ signedIn, profile }) {
    return (
        <main className="landing-page contact-page">
            <SiteHeader signedIn={signedIn} profile={profile} />

            <section className="about-hero contact-hero">
                <div className="about-hero-inner">
                    <span className="landing-eyebrow">CONTACT &amp; SUPPORT</span>
                    <h1>We’re here to<br /><span>help you report.</span></h1>
                    <p>
                        Need help using PurPravah or having trouble uploading a photo with your report?
                        Call our support team and tell us what happened.
                    </p>
                    <a className="landing-button landing-button-light" href="tel:9845678890">
                        <Phone size={16} /> Call 9845678890
                    </a>
                </div>
                <div className="about-hero-mark" aria-hidden="true"><Phone size={72} strokeWidth={1.2} /></div>
            </section>

            <section className="landing-section contact-help-section">
                <div className="landing-section-heading">
                    <span className="landing-eyebrow">UPLOAD HELP</span>
                    <h2>Photo upload not working?</h2>
                    <p>Try these steps, then call us if you still need help.</p>
                </div>
                <div className="contact-help-grid">
                    <article className="contact-help-card">
                        <span><ImageUp size={21} /></span>
                        <h3>Check the image</h3>
                        <p>Choose a photo from your device and make sure it opens correctly before uploading.</p>
                    </article>
                    <article className="contact-help-card">
                        <span><Wifi size={21} /></span>
                        <h3>Check your connection</h3>
                        <p>Keep your internet connection active until the upload finishes. If it fails, try again.</p>
                    </article>
                    <article className="contact-help-card">
                        <span><ShieldCheck size={21} /></span>
                        <h3>Keep personal details private</h3>
                        <p>Only share a photo relevant to the public issue. Don’t upload IDs or sensitive personal information.</p>
                    </article>
                </div>
            </section>

            <section className="landing-cta contact-cta">
                <div>
                    <span className="landing-cta-eyebrow">NEED MORE HELP?</span>
                    <h2>Call our support number.</h2>
                    <p>When you call, describe the issue and mention where the upload stopped or what message appeared.</p>
                </div>
                <a className="landing-button landing-button-light" href="tel:9845678890">
                    <Phone size={16} /> 9845678890
                </a>
            </section>

            {signedIn && profile?.role === 'citizen' && (
                <p className="contact-report-link">
                    Ready to report an issue?{' '}
                    <Link href="/complaints/new">Start a report <ArrowRight size={14} /></Link>
                </p>
            )}

            <SiteFooter signedIn={signedIn} profile={profile} />
        </main>
    );
}
