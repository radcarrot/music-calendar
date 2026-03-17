import React from 'react';
import LegalLayout from '../components/LegalLayout';

const PrivacyPolicy = () => {
    return (
        <LegalLayout title="Privacy Policy">
            <section className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">1. Data Collection</h2>
                <p>
                    BeatDrop collects minimal data required to provide our music release tracking service. This includes your email address, profile name, and preferences provided during registration or through connected third-party services.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">2. Service Integration</h2>
                <p>
                    Our application integrates with third-party services to enhance your experience:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Spotify:</strong> We access your top artists and profile information to help you track releases from artists you enjoy. We do not store your Spotify password.</li>
                    <li><strong>Google Calendar:</strong> We request permission to create and manage events on your Google Calendar to synchronize music release dates. We only modify events created by the BeatDrop application.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">3. Data Usage</h2>
                <p>
                    Collected data is used exclusively to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Personalize your music release dashboard.</li>
                    <li>Send synchronized alerts and notifications.</li>
                    <li>Maintain account security and authentication.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">4. Your Rights</h2>
                <p>
                    You can disconnect third-party services at any time via the Settings panel. You may also request the complete deletion of your account and all associated data through the same interface.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">5. Contact</h2>
                <p>
                    For privacy-related inquiries, contact the regional terminal at legal@beatdrop.network.
                </p>
            </section>
        </LegalLayout>
    );
};

export default PrivacyPolicy;
