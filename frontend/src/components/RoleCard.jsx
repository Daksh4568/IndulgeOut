import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const RoleCard = ({ role, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer rounded-2xl p-8 transition-all duration-300 ${
        isActive
          ? 'bg-white dark:bg-gray-800 shadow-2xl scale-105 border-2 border-orange-500'
          : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl'
      }`}
    >
      {/* Gradient Header */}
      <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${role.gradient} rounded-t-2xl`} />

      {/* Emoji Icon */}
      <div className="text-6xl mb-4">{role.emoji}</div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {role.title}
      </h3>

      {/* For Who */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">FOR:</p>
        <ul className="space-y-1">
          {role.forWho.map((item, index) => (
            <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="text-orange-500">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Benefits */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">WHAT YOU CAN DO:</p>
        <ul className="space-y-2">
          {role.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        {role.metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <div className={`text-xl font-bold bg-gradient-to-r ${role.gradient} bg-clip-text text-transparent`}>
              {metric.value}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3">
        <Link
          to={role.cta.link}
          className={`block w-full text-center bg-gradient-to-r ${role.gradient} text-white font-semibold py-3 px-6 rounded-full hover:shadow-lg transition-all transform hover:scale-105`}
        >
          {role.cta.label}
        </Link>
        {role.cta.secondary && (
          <button
            className="w-full text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium py-2 text-sm transition-colors flex items-center justify-center gap-2 group"
          >
            {role.cta.secondary}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RoleCard;
