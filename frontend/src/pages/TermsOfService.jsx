import React from 'react';
import LegalLayout from '../components/LegalLayout';

const TermsOfService = () => {
    return (
        <LegalLayout title="Terms of Service">
            <section className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">1. Acceptance of Terms</h2>
                <p>
                    By accessing the BeatDrop terminal, you agree to bound by these Terms of Service. If you do not agree with any part of these terms, you must disconnect and terminate your account immediately.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">2. Account Responsibility</h2>
                <p>
                    You are solely responsible for maintaining the security of your authentication tokens and account access. Every action taken through your identity is your responsibility within the network.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">3. Acceptable Use</h2>
                <p>
                    The BeatDrop protocol is intended strictly for music release tracking. Prohibited actions include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Attempting to breach the terminal's security matrix.</li>
                    <li>Reverse engineering the synchronization engine.</li>
                    <li>Using the API to spam third-party calendar services.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">4. Data Ownership</h2>
                <p>
                    You maintain ownership of all tracked artist lists and personalized configurations. BeatDrop claims no ownership over your Spotify or Google account content.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">5. Service Termination</h2>
                <p>
                    We reserve the right to suspend access to specialized features if irregular traffic or system abuse is detected from your node.
                </p>
            </section>
        </LegalLayout>
    );
};

export default TermsOfService;
