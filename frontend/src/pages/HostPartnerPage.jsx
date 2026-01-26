import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Users, Building2, Target } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import RoleSelector from '../components/RoleSelector';
import HowItWorksSection from '../components/HowItWorksSection';
import DifferentiatorsGrid from '../components/DifferentiatorsGrid';
import SocialProofSection from '../components/SocialProofSection';
import FAQAccordion from '../components/FAQAccordion';
import FinalCTA from '../components/FinalCTA';
import { ROLE_CARDS, HOW_IT_WORKS, DIFFERENTIATORS, FAQS, SOCIAL_PROOF } from '../constants/hostPartnerData';

const HostPartnerPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <NavigationBar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 pt-24 pb-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Sparkles Icon */}
          <div className="flex justify-center mb-6 animate-bounce">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Host, Partner, and Create
            <br />
            <span className="bg-white text-transparent bg-clip-text">Meaningful Experiences</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            IndulgeOut connects communities, venues, and brands to create authentic, offline experiences that people actually care about.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="flex items-center gap-3 text-white">
              <Users className="h-8 w-8" />
              <div className="text-left">
                <div className="text-2xl font-bold">1,200+</div>
                <div className="text-sm text-white/80">Communities</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Building2 className="h-8 w-8" />
              <div className="text-left">
                <div className="text-2xl font-bold">150+</div>
                <div className="text-sm text-white/80">Venues</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Target className="h-8 w-8" />
              <div className="text-left">
                <div className="text-2xl font-bold">80+</div>
                <div className="text-sm text-white/80">Brands</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 mb-24">
        <RoleSelector roles={ROLE_CARDS} />
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Getting started is simple. Choose your role and follow these steps to start creating meaningful connections.
          </p>
        </div>
        <HowItWorksSection howItWorks={HOW_IT_WORKS} />
      </section>

      {/* Why IndulgeOut? Section */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Partner with IndulgeOut?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We're not just another events platform. Here's what makes us different.
            </p>
          </div>
          <DifferentiatorsGrid differentiators={DIFFERENTIATORS} />
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Trusted by Communities, Venues & Brands
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of partners who are already creating meaningful experiences with IndulgeOut.
          </p>
        </div>
        <SocialProofSection socialProof={SOCIAL_PROOF} />
      </section>

      {/* FAQ Section */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Everything you need to know about hosting and partnering with IndulgeOut.
            </p>
          </div>
          <FAQAccordion faqs={FAQS} />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <FinalCTA />
      </section>

      {/* Footer Note */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Have questions? <Link to="/about" className="text-orange-600 hover:underline font-medium">Contact us</Link> and we'll help you get started.
        </p>
      </section>
    </div>
  );
};

export default HostPartnerPage;

