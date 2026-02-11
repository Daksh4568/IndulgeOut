import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import Footer from '../components/Footer';
import { api } from '../config/api';

// Community → Venue sections
import EventInfoSection from '../components/collaboration/sections/EventInfoSection';
import RequirementsSection from '../components/collaboration/sections/RequirementsSection';
import PricingSection from '../components/collaboration/sections/PricingSection';
import SupportingInfoSection from '../components/collaboration/sections/SupportingInfoSection';

// Community → Brand sections
import EventSnapshotSection from '../components/collaboration/sections/EventSnapshotSection';
import BrandDeliverablesSection from '../components/collaboration/sections/BrandDeliverablesSection';

// Brand → Community sections
import CampaignObjectivesSection from '../components/collaboration/sections/CampaignObjectivesSection';
import BrandOffersExpectsSection from '../components/collaboration/sections/BrandOffersExpectsSection';

// Venue → Community sections
import VenueOfferingsSection from '../components/collaboration/sections/VenueOfferingsSection';
import VenueCommercialSection from '../components/collaboration/sections/VenueCommercialSection';

const ProposalForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get proposal type from URL params or location state
  // proposalType: 'communityToVenue', 'communityToBrand', 'brandToCommunity', 'venueToCommunity'
  const [proposalType, setProposalType] = useState('communityToVenue');
  const [recipientId, setRecipientId] = useState(null);
  const [recipientType, setRecipientType] = useState(null);
  
  const [formData, setFormData] = useState({
    // Community → Venue
    eventType: '',
    expectedAttendees: '',
    seatingCapacity: '',
    eventDate: { date: '', startTime: '', endTime: '' },
    showBackupDate: false,
    backupDate: { date: '', startTime: '', endTime: '' },
    requirements: {},
    pricing: {},
    
    // Community → Brand
    eventCategory: '',
    targetAudience: '',
    city: '',
    brandDeliverables: {},
    
    // Brand → Community
    campaignObjectives: {},
    preferredFormats: [],
    brandOffers: {},
    brandExpectations: {},
    
    // Venue → Community
    venueType: '',
    capacityRange: '',
    venueOfferings: {},
    commercialModels: {},
    additionalTerms: '',
    
    // Shared
    supportingInfo: { images: [], note: '' },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // Parse proposal type from route or state
    const urlParams = new URLSearchParams(location.search);
    const type = urlParams.get('type') || location.state?.proposalType || 'communityToVenue';
    setProposalType(type);

    // Get recipient info from location.state
    if (location.state?.recipientId) {
      setRecipientId(location.state.recipientId);
    }
    if (location.state?.recipientType) {
      setRecipientType(location.state.recipientType);
    }
  }, [location]);

  const getProposalTitle = () => {
    const titles = {
      communityToVenue: 'VENUE REQUEST FORM',
      communityToBrand: 'BRAND COLLABORATION PROPOSAL',
      brandToCommunity: 'COMMUNITY PARTNERSHIP PROPOSAL',
      venueToCommunity: 'VENUE PARTNERSHIP PROPOSAL',
    };
    return titles[proposalType] || 'COLLABORATION PROPOSAL';
  };

  const getProposalSubtitle = () => {
    const subtitles = {
      communityToVenue: 'Community to Venue • Est. time: 60-90 seconds',
      communityToBrand: 'Community to Brand • Est. time: 60-90 seconds',
      brandToCommunity: 'Brand to Community • Est. time: 60 seconds',
      venueToCommunity: 'Venue to Community • Est. time: 45-60 seconds',
    };
    return subtitles[proposalType] || 'Collaboration Proposal';
  };

  const handleSaveAsDraft = async () => {
    // Validate recipient info
    if (!recipientId || !recipientType) {
      alert('Missing recipient information. Please go back and select a partner again.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        type: proposalType,
        recipientId: recipientId,
        recipientType: recipientType,
        formData: formData
      };

      console.log('Saving draft:', payload);
      
      const response = await api.post('/collaborations/draft', payload);
      
      console.log('Draft saved successfully:', response.data);
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      const errorMsg = error.response?.data?.error || 'Failed to save draft. Please try again.';
      alert(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const getProgressSteps = () => {
    const steps = {
      communityToVenue: ['Event Info', 'Requirements', 'Pricing', 'Extras'],
      communityToBrand: ['Event Snapshot', 'Deliverables', 'Pricing', 'Extras'],
      brandToCommunity: ['Objectives', 'Offer & Expect', 'Extras'],
      venueToCommunity: ['Venue Info', 'Services', 'Commercial', 'Extras'],
    };
    return steps[proposalType] || steps.communityToVenue;
  };

  const validateForm = () => {
    if (proposalType === 'communityToVenue') {
      if (!formData.eventType) {
        alert('Please select an event type');
        return false;
      }
      if (!formData.expectedAttendees || !formData.seatingCapacity) {
        alert('Please select expected attendees and seating capacity');
        return false;
      }
      if (!formData.eventDate.date || !formData.eventDate.startTime || !formData.eventDate.endTime) {
        alert('Please fill in all event date and time fields');
        return false;
      }
      if (Object.keys(formData.requirements).length === 0) {
        alert('Please select at least one requirement');
        return false;
      }
      if (Object.keys(formData.pricing).filter((key) => key !== 'additionalNotes').length === 0) {
        alert('Please select at least one pricing model');
        return false;
      }
    } else if (proposalType === 'communityToBrand') {
      if (!formData.eventCategory || !formData.expectedAttendees || !formData.city) {
        alert('Please complete all event snapshot fields');
        return false;
      }
      if (Object.keys(formData.brandDeliverables).length === 0) {
        alert('Please select at least one deliverable for the brand');
        return false;
      }
    } else if (proposalType === 'brandToCommunity') {
      if (Object.keys(formData.campaignObjectives).length === 0) {
        alert('Please select at least one campaign objective');
        return false;
      }
      if (Object.keys(formData.brandOffers).length === 0) {
        alert('Please select what you can offer');
        return false;
      }
      if (Object.keys(formData.brandExpectations).length === 0) {
        alert('Please select what you expect from the community');
        return false;
      }
    } else if (proposalType === 'venueToCommunity') {
      if (!formData.venueType || !formData.capacityRange) {
        alert('Please complete venue snapshot');
        return false;
      }
      if (Object.keys(formData.venueOfferings).length === 0) {
        alert('Please select at least one offering');
        return false;
      }
      if (Object.keys(formData.commercialModels).length === 0) {
        alert('Please select a commercial model');
        return false;
      }
    }

    return true;
  };

  const getSubmitActionText = () => {
    const texts = {
      communityToVenue: {
        title: 'Ready to send your request?',
        subtitle: 'This venue will review and respond here',
      },
      communityToBrand: {
        title: 'Ready to propose collaboration?',
        subtitle: 'This brand will review and respond here',
      },
      brandToCommunity: {
        title: 'Ready to send your proposal?',
        subtitle: 'This community will review and respond here',
      },
      venueToCommunity: {
        title: 'Ready to propose partnership?',
        subtitle: 'This community will review and respond here',
      },
    };
    return texts[proposalType] || texts.communityToVenue;
  };

  const handleSendRequest = async () => {
    if (!validateForm()) return;

    // Validate recipient info
    if (!recipientId || !recipientType) {
      alert('Missing recipient information. Please go back and select a partner again.');
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        type: proposalType,
        recipientId: recipientId,
        recipientType: recipientType,
        formData: formData
      };

      console.log('Sending collaboration proposal:', payload);
      
      const response = await api.post('/collaborations/propose', payload);
      
      console.log('Proposal sent successfully:', response.data);
      
      // Navigate to collaborations page with success message
      navigate('/collaborations', { 
        state: { 
          message: 'Your collaboration request has been sent successfully! You can track its status in Sent Requests.',
          tab: 'sent'
        } 
      });
    } catch (error) {
      console.error('Error sending proposal:', error);
      const errorMsg = error.response?.data?.error || 'Failed to send request. Please try again.';
      alert(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <NavigationBar />
      
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        {/* Form Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{getProposalTitle()}</h1>
          <p className="text-gray-400">{getProposalSubtitle()}</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-4 mb-12 overflow-x-auto pb-2">
          {getProgressSteps().map((step, index) => (
            <React.Fragment key={index}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    index === 0
                      ? 'text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                  style={
                    index === 0
                      ? { background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }
                      : {}
                  }
                >
                  {index + 1}
                </div>
                <span className={`text-sm whitespace-nowrap ${index === 0 ? 'text-white' : 'text-gray-400'}`}>
                  {step}
                </span>
              </div>
              {index < getProgressSteps().length - 1 && (
                <div className="h-px w-12 bg-gray-800"></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Sections */}
        <div className="space-y-16">
          {/* Community → Venue */}
          {proposalType === 'communityToVenue' && (
            <>
              <EventInfoSection
                formData={formData}
                setFormData={setFormData}
                proposalType={proposalType}
              />
              <RequirementsSection
                formData={formData}
                setFormData={setFormData}
                proposalType={proposalType}
              />
              <PricingSection
                formData={formData}
                setFormData={setFormData}
                proposalType={proposalType}
              />
              <SupportingInfoSection
                formData={formData}
                setFormData={setFormData}
                proposalType={proposalType}
              />
            </>
          )}

          {/* Community → Brand */}
          {proposalType === 'communityToBrand' && (
            <>
              <EventSnapshotSection
                formData={formData}
                setFormData={setFormData}
              />
              <BrandDeliverablesSection
                formData={formData}
                setFormData={setFormData}
              />
              <PricingSection
                formData={formData}
                setFormData={setFormData}
                proposalType={proposalType}
              />
              <SupportingInfoSection
                formData={formData}
                setFormData={setFormData}
                proposalType={proposalType}
              />
            </>
          )}

          {/* Brand → Community */}
          {proposalType === 'brandToCommunity' && (
            <>
              <CampaignObjectivesSection
                formData={formData}
                setFormData={setFormData}
              />
              <BrandOffersExpectsSection
                formData={formData}
                setFormData={setFormData}
              />
              <SupportingInfoSection
                formData={formData}
                setFormData={setFormData}
                proposalType={proposalType}
              />
            </>
          )}

          {/* Venue → Community */}
          {proposalType === 'venueToCommunity' && (
            <>
              <VenueOfferingsSection
                formData={formData}
                setFormData={setFormData}
              />
              <VenueCommercialSection
                formData={formData}
                setFormData={setFormData}
              />
              <SupportingInfoSection
                formData={formData}
                setFormData={setFormData}
                proposalType={proposalType}
              />
            </>
          )}
        </div>

        {/* Submit Actions */}
        <div className="mt-12 mb-16">
          <div
            className="p-6 rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
            }}
          >
            <h3 className="text-white text-lg font-semibold mb-1">
              {getSubmitActionText().title}
            </h3>
            <p className="text-indigo-100 text-sm mb-4">
              {getSubmitActionText().subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSaveAsDraft}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white bg-opacity-10 border border-white border-opacity-30 text-white rounded-lg hover:bg-opacity-20 transition-all font-medium disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {isSaving ? 'Saving...' : 'SAVE AS DRAFT'}
              </button>
              
              <button
                onClick={handleSendRequest}
                disabled={isSending}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-all font-medium disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
                {isSending ? 'Sending...' : 'SEND REQUEST'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProposalForm;
