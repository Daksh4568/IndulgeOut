import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import CategoryTile from '../components/CategoryTile';
import { CATEGORY_CLUSTERS } from '../constants/categories';

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClusters, setFilteredClusters] = useState(CATEGORY_CLUSTERS);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter categories based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClusters(CATEGORY_CLUSTERS);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = CATEGORY_CLUSTERS.map(cluster => ({
      ...cluster,
      categories: cluster.categories.filter(cat =>
        cat.name.toLowerCase().includes(query) ||
        cat.descriptor.toLowerCase().includes(query) ||
        cat.subtext.toLowerCase().includes(query)
      )
    })).filter(cluster => cluster.categories.length > 0);

    setFilteredClusters(filtered);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <NavigationBar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Categories
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Find Your Perfect Experience
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full bg-white/95 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredClusters.length > 0 ? (
          <div className="space-y-16">
            {filteredClusters.map((cluster) => (
              <div key={cluster.id}>
                {/* Cluster Header */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {cluster.name}
                  </h2>
                  <div className={`h-1 w-24 bg-gradient-to-r ${cluster.color} rounded-full`} />
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {cluster.categories.map((category) => (
                    <CategoryTile
                      key={category.id}
                      category={category}
                      stats={{
                        eventCount: Math.floor(Math.random() * 50) + 10,
                        communityCount: Math.floor(Math.random() * 15) + 3
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No categories found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try searching for something else
            </p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-500 to-pink-500 py-16 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Can't find what you're looking for?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Have a unique category idea? Let us know!
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/host-partner'}
              className="bg-white text-orange-500 hover:bg-gray-100 font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105"
            >
              Suggest a Category
            </button>
            <button
              onClick={() => window.location.href = '/about'}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-8 rounded-full transition-all"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
