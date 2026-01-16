import { useState } from 'react';

const HowItWorksSection = ({ howItWorks }) => {
  const [activeRole, setActiveRole] = useState('communities');

  const roles = [
    { id: 'communities', label: '👥 Communities', color: 'from-purple-500 to-pink-500' },
    { id: 'venues', label: '🏢 Venues', color: 'from-blue-500 to-cyan-500' },
    { id: 'brands', label: '🎯 Brands', color: 'from-orange-500 to-red-500' }
  ];

  const activeRoleData = roles.find(r => r.id === activeRole);

  return (
    <div className="space-y-8">
      {/* Role Selector Tabs */}
      <div className="flex flex-wrap gap-4 justify-center">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setActiveRole(role.id)}
            className={`px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 ${
              activeRole === role.id
                ? `bg-gradient-to-r ${role.color} text-white shadow-lg transform scale-105`
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500'
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {howItWorks[activeRole].map((step, index) => (
          <div
            key={step.step}
            className="relative bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group"
          >
            {/* Step Number */}
            <div
              className={`absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-r ${activeRoleData.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
            >
              {step.step}
            </div>

            {/* Icon */}
            <div className="text-4xl mb-4 mt-4">{step.icon}</div>

            {/* Title */}
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {step.title}
            </h4>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {step.description}
            </p>

            {/* Arrow Connector (not on last step) */}
            {index < howItWorks[activeRole].length - 1 && (
              <div className="hidden lg:block absolute -right-8 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-6 h-6 text-gray-300 dark:text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorksSection;
