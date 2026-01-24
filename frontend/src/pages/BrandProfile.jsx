import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import {
  ArrowLeft, Building2, Target, Users, TrendingUp, Globe,
  MessageCircle, Sparkles, CheckCircle, Award, MapPin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import API_URL from '../config/api';

const BrandProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrandDetail();
  }, [id]);

  const fetchBrandDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/brands/${id}`);
      setBrand(response.data);
    } catch (error) {
      console.error('Error fetching brand detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProposeCollaboration = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/brand/${id}/propose-collaboration`);
  };

  const getBudgetDisplay = (budget) => {
    if (!budget || (!budget.min && !budget.max)) return 'Flexible budget';
    if (budget.min && budget.max) {
      return `₹${(budget.min / 1000).toFixed(0)}K - ₹${(budget.max / 1000).toFixed(0)}K`;
    }
    if (budget.max) {
      return `Up to ₹${(budget.max / 1000).toFixed(0)}K`;
    }
    return 'Flexible budget';
  };

  const getBudgetScale = (budget) => {
    if (!budget || !budget.max) return 'Not Specified';
    const max = budget.max;
    if (max <= 50000) return 'Micro (₹0-50K)';
    if (max <= 200000) return 'Mid (₹50K-2L)';
    return 'Large (₹2L+)';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      food_beverage: '🍽️',
      wellness_fitness: '💪',
      lifestyle: '✨',
      tech: '💻',
      entertainment: '🎬',
      fashion: '👗',
      education: '📚',
      other: '🏢'
    };
    return icons[category] || '🏢';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationBar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavigationBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Brand not found
          </h2>
          <button
            onClick={() => navigate('/browse/sponsors')}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            Back to Browse Brands
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/browse/sponsors')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Browse Brands</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Brand Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.brandName}
                    className="h-32 w-auto object-contain"
                  />
                ) : (
                  <Building2 className="h-24 w-24 text-gray-400" />
                )}
              </div>
            </div>

            {/* Overview Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Brand Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                {brand.brandDescription || 'No description available.'}
              </p>

              {/* Brand Category */}
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">{getCategoryIcon(brand.brandCategory)}</span>
                <span className="text-gray-900 dark:text-white font-medium capitalize">
                  {brand.brandCategory?.replace('_', ' ')}
                </span>
              </div>

              {/* Target Cities */}
              {brand.targetCity && brand.targetCity.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Active in Cities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {brand.targetCity.map((city, index) => (
                      <span
                        key={index}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                      >
                        <MapPin className="h-3 w-3" />
                        <span>{city}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Partnership Criteria */}
            {brand.partnershipCriteria && Object.keys(brand.partnershipCriteria).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Partnership Criteria
                </h2>
                <div className="space-y-3">
                  {brand.partnershipCriteria.mission && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Mission & Values
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {brand.partnershipCriteria.mission}
                      </p>
                    </div>
                  )}
                  {brand.partnershipCriteria.lookingFor && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Looking For
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {brand.partnershipCriteria.lookingFor}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Audience Fit */}
            {brand.audienceFit && Object.keys(brand.audienceFit).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Audience Fit
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {brand.audienceFit.targetDemographics && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Target Demographics
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {brand.audienceFit.targetDemographics}
                      </p>
                    </div>
                  )}
                  {brand.audienceFit.idealCommunitySize && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Ideal Community Size
                      </h3>
                      <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                        <Users className="h-4 w-4" />
                        <span>{brand.audienceFit.idealCommunitySize}</span>
                      </div>
                    </div>
                  )}
                  {brand.audienceFit.interests && brand.audienceFit.interests.length > 0 && (
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Target Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {brand.audienceFit.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Past Campaigns */}
            {brand.pastCampaigns && brand.pastCampaigns.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Past Activations
                </h2>
                <div className="space-y-6">
                  {brand.pastCampaigns.map((campaign, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-purple-600 pl-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 rounded-r-lg transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {campaign.campaignName}
                      </h3>
                      {campaign.community && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          with {campaign.community}
                        </p>
                      )}
                      {campaign.description && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                          {campaign.description}
                        </p>
                      )}
                      {campaign.results && (
                        <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span>{campaign.results}</span>
                        </div>
                      )}
                      {campaign.city && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          📍 {campaign.city}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {brand.pastActivations > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {brand.pastActivations}
                      </span>{' '}
                      successful collaborations
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Collaboration Models */}
            {brand.collaborationModels && brand.collaborationModels.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Collaboration Models
                </h2>
                <div className="space-y-4">
                  {brand.collaborationModels.map((model, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {model.type}
                      </h3>
                      {model.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {model.description}
                        </p>
                      )}
                      {model.examples && model.examples.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {model.examples.map((example, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
                            >
                              <span className="mr-2">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sponsorship Types */}
            {brand.sponsorshipType && brand.sponsorshipType.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Sponsorship Types Offered
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {brand.sponsorshipType.map((type, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                    >
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-gray-900 dark:text-white capitalize font-medium">
                        {type.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collaboration Formats */}
            {brand.collaborationIntent && brand.collaborationIntent.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Interested In
                </h2>
                <div className="flex flex-wrap gap-2">
                  {brand.collaborationIntent.map((intent, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-medium"
                    >
                      {intent.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Brand Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {brand.brandName}
                </h1>

                {/* Budget */}
                <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Budget Range
                  </h3>
                  <div className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-lg font-bold">{getBudgetDisplay(brand.budget)}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {getBudgetScale(brand.budget)}
                  </p>
                </div>

                {/* Secure Contact Notice */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Secure Communication</p>
                      <p className="text-blue-600 dark:text-blue-400">
                        All communication is managed through IndulgeOut for your security and protection.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleProposeCollaboration}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors mb-3"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>Propose Collaboration</span>
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Send your pitch to this brand
                </p>
              </div>

              {/* Stats Card */}
              {brand.pastActivations > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Brand Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Collaborations</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {brand.pastActivations}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                      <div className="flex items-center space-x-1">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {brand.successRate || '95%'}
                        </span>
                      </div>
                    </div>
                    {brand.targetCity && brand.targetCity.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Cities Active</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {brand.targetCity.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandProfile;
