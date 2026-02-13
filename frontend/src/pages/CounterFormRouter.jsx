import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../config/api';
import VenueCounterForm from './VenueCounterForm';
import BrandCounterForm from './BrandCounterForm';
import CommunityCounterFormBrand from './CommunityCounterFormBrand';
import CommunityCounterFormVenue from './CommunityCounterFormVenue';

const CounterFormRouter = () => {
  const { id } = useParams();
  const [collaboration, setCollaboration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollabType = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/collaborations/${id}`);
        setCollaboration(res.data.data);
      } catch (err) {
        console.error('Error fetching collaboration:', err);
        setError('Failed to load collaboration');
      } finally {
        setLoading(false);
      }
    };

    fetchCollabType();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !collaboration) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Collaboration not found'}</p>
        </div>
      </div>
    );
  }

  // Route to the correct counter form based on collaboration type
  switch (collaboration.type) {
    case 'communityToVenue':
      return <VenueCounterForm />;
    case 'communityToBrand':
      return <BrandCounterForm />;
    case 'brandToCommunity':
      return <CommunityCounterFormBrand />;
    case 'venueToCommunity':
      return <CommunityCounterFormVenue />;
    default:
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-red-400">Unknown collaboration type: {collaboration.type}</p>
        </div>
      );
  }
};

export default CounterFormRouter;
