import React from 'react';

const PlaceholderVideo = ({ index, className }) => {
  const colors = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600', 
    'from-orange-500 to-red-600'
  ];
  
  const activities = [
    'Community Events',
    'Social Connections', 
    'Shared Experiences'
  ];

  const icons = ['🤝', '🎨', '🌟'];

  return (
    <div className={`${className} bg-gradient-to-br ${colors[index]} flex items-center justify-center text-white relative overflow-hidden`}>
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.3),transparent_70%)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.2),transparent_70%)] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Content */}
      <div className="text-center z-10">
        <div className="text-6xl mb-4 animate-bounce">{icons[index]}</div>
        <h3 className="text-2xl font-bold mb-2">{activities[index]}</h3>
        <p className="text-sm opacity-90">Video {index + 1}</p>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full animate-ping"></div>
      <div className="absolute bottom-4 right-4 w-3 h-3 bg-white rounded-full animate-pulse"></div>
      <div className="absolute top-1/2 left-6 w-1 h-1 bg-white rounded-full animate-bounce"></div>
    </div>
  );
};

export default PlaceholderVideo;