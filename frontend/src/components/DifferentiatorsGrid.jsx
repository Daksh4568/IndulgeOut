const DifferentiatorsGrid = ({ differentiators }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {differentiators && differentiators.map((item, index) => (
        <div
          key={item.id || index}
          className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-xl group"
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 text-4xl group-hover:scale-110 transition-transform duration-300">
              {item.icon}
            </div>

            {/* Content */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DifferentiatorsGrid;
