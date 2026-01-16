import { useState } from 'react';
import RoleCard from './RoleCard';

const RoleSelector = ({ roles }) => {
  const [activeRole, setActiveRole] = useState('communities');
  const [view, setView] = useState('grid'); // 'grid' or 'tabs' for mobile

  return (
    <div>
      {/* Mobile View Selector */}
      <div className="lg:hidden mb-6 flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setView('grid')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
            view === 'grid'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Grid View
        </button>
        <button
          onClick={() => setView('tabs')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
            view === 'tabs'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Tab View
        </button>
      </div>

      {/* Desktop Grid View - Always shows all 3 cards side by side */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-8">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            isActive={activeRole === role.id}
            onClick={() => setActiveRole(role.id)}
          />
        ))}
      </div>

      {/* Mobile Grid View - Stacked cards */}
      {view === 'grid' && (
        <div className="lg:hidden space-y-6">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              isActive={activeRole === role.id}
              onClick={() => setActiveRole(role.id)}
            />
          ))}
        </div>
      )}

      {/* Mobile Tab View - One card at a time with tab navigation */}
      {view === 'tabs' && (
        <div className="lg:hidden">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  activeRole === role.id
                    ? `bg-gradient-to-r ${role.gradient} text-white shadow-lg`
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {role.emoji} {role.title.split(' & ')[0]}
              </button>
            ))}
          </div>

          {/* Active Card */}
          <div>
            <RoleCard
              role={roles.find((r) => r.id === activeRole)}
              isActive={true}
              onClick={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
