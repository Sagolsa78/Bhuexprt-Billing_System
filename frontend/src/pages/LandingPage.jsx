import React from 'react';
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { Features } from '../components/Features'
import { Pricing } from '../components/Pricing'
import { DashboardPreview } from '../components/DashboardPreview'
import { ContactCTA } from '../components/ContactCTA'
import { Footer } from '../components/Footer'

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            <Header />
            <Hero />
            <Features />
            <DashboardPreview />
            <Pricing />
            <ContactCTA />
            <Footer />
        </div>
    );
};

export default LandingPage;
