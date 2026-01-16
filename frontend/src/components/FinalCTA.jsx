import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const FinalCTA = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-2xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative px-8 py-16 md:py-20 text-center">
        {/* Sparkles Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Ready to Create Meaningful Experiences?
        </h2>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Whether you're hosting, providing a venue, or partnering as a brand—IndulgeOut helps you connect with engaged, interest-driven communities.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/register?role=host"
            className="group px-8 py-4 bg-white text-purple-600 font-bold text-lg rounded-full hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            to="/explore"
            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-full border-2 border-white hover:bg-white/20 transition-all flex items-center gap-2"
          >
            Explore Experiences
          </Link>
        </div>

        {/* Trust Badge */}
        <p className="mt-8 text-white/80 text-sm">
          Join 1,200+ communities, 150+ venues, and 80+ brands already creating magic with IndulgeOut
        </p>
      </div>
    </div>
  );
};

export default FinalCTA;
