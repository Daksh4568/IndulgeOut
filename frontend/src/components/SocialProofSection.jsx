const SocialProofSection = ({ socialProof }) => {
  return (
    <div className="space-y-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {socialProof.stats.map((stat, index) => (
          <div
            key={index}
            className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
          >
            <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {socialProof.testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
          >
            {/* Quote Icon */}
            <div className="text-4xl text-orange-500 mb-4">"</div>

            {/* Quote Text */}
            <p className="text-gray-700 dark:text-gray-300 mb-6 italic leading-relaxed">
              {testimonial.quote}
            </p>

            {/* Author Info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                {testimonial?.name?.charAt(0) || '?'}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {testimonial?.name || 'Anonymous'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {testimonial?.role || 'User'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialProofSection;
