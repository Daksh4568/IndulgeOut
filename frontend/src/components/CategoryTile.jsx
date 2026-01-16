import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CategoryTile = ({ category, stats }) => {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group relative overflow-hidden rounded-2xl p-6 h-64 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Emoji */}
        <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">
          {category.emoji}
        </div>
        
        {/* Category Name */}
        <h3 className="text-2xl font-bold text-white mb-2">
          {category.name}
        </h3>
        
        {/* Descriptor */}
        <p className="text-white/90 font-medium text-sm mb-1">
          {category.descriptor}
        </p>
        
        {/* Subtext */}
        <p className="text-white/75 text-xs">
          {category.subtext}
        </p>
      </div>
      
      {/* Footer with Stats and Arrow */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="text-white/90 text-sm">
          {stats ? (
            <div className="flex gap-3">
              <span>{stats.eventCount} events</span>
              <span className="text-white/60">•</span>
              <span>{stats.communityCount} communities</span>
            </div>
          ) : (
            <span className="text-white/75">Explore →</span>
          )}
        </div>
        
        {/* Arrow Icon */}
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 group-hover:bg-white/30 transition-colors">
          <ArrowRight className="h-5 w-5 text-white transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default CategoryTile;
