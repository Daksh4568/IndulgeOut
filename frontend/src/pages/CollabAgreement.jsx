import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import { api } from '../config/api';
import { ArrowLeft, MessageSquare, Download, Settings, Check, X, Pencil } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';

const CollabAgreement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useContext(ToastContext);

  const [loading, setLoading] = useState(true);
  const [collaboration, setCollaboration] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCollaboration();
  }, [id]);

  const fetchCollaboration = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/collaborations/${id}`);
      setCollaboration(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching collaboration:', err);
      setError('Failed to load collaboration details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavigationBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-gray-400">Loading agreement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !collaboration) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavigationBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Collaboration not found'}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentUserId = user?.userId || user?._id;
  const isInitiator = collaboration.initiator?.user?._id === currentUserId || collaboration.initiator?.user === currentUserId;
  const collabType = collaboration.type;

  // Get proposal data based on type
  const getProposalData = () => {
    if (collabType === 'communityToBrand') return collaboration.communityToBrand || collaboration.formData || {};
    if (collabType === 'communityToVenue') return collaboration.communityToVenue || collaboration.formData || {};
    if (collabType === 'brandToCommunity') return collaboration.brandToCommunity || collaboration.formData || {};
    if (collabType === 'venueToCommunity') return collaboration.venueToCommunity || collaboration.formData || {};
    return collaboration.formData || {};
  };

  const proposalData = getProposalData();

  // Get counter data
  const counterData = collaboration.counterData || collaboration.response?.counterOffer || {};
  const fieldResponses = counterData.fieldResponses || {};
  const fieldResponsesObj = fieldResponses instanceof Map ? Object.fromEntries(fieldResponses) : fieldResponses;
  const hasCounter = !!(collaboration.hasCounter || Object.keys(fieldResponsesObj).length > 0);

  // Workspace active when counter_delivered or completed
  const workspaceActive = collaboration.status === 'counter_delivered' || collaboration.status === 'completed';

  // Determine labels based on perspective
  const getLabels = () => {
    if (collabType === 'communityToBrand') {
      return {
        title: 'EVENT AGREEMENT',
        subtitle: isInitiator ? 'Your Proposal to Brand' : 'Community Proposal to You',
        proposedLabel: 'COMMUNITY PROPOSED',
        responseLabel: 'BRAND RESPONSE',
        initiatorName: collaboration.initiator?.name || 'Community',
        recipientName: collaboration.recipient?.name || 'Brand',
      };
    }
    if (collabType === 'communityToVenue') {
      return {
        title: 'EVENT AGREEMENT',
        subtitle: isInitiator ? 'Your Proposal to Venue' : 'Community Proposal to You',
        proposedLabel: 'COMMUNITY PROPOSED',
        responseLabel: 'VENUE RESPONSE',
        initiatorName: collaboration.initiator?.name || 'Community',
        recipientName: collaboration.recipient?.name || 'Venue',
      };
    }
    if (collabType === 'brandToCommunity') {
      return {
        title: 'EVENT AGREEMENT',
        subtitle: isInitiator ? 'Your Proposal to Community' : 'Brand Proposal to You',
        proposedLabel: 'BRAND PROPOSED',
        responseLabel: 'COMMUNITY RESPONSE',
        initiatorName: collaboration.initiator?.name || 'Brand',
        recipientName: collaboration.recipient?.name || 'Community',
      };
    }
    if (collabType === 'venueToCommunity') {
      return {
        title: 'EVENT AGREEMENT',
        subtitle: isInitiator ? 'Your Proposal to Community' : 'Venue Proposal to You',
        proposedLabel: 'VENUE PROPOSED',
        responseLabel: 'COMMUNITY RESPONSE',
        initiatorName: collaboration.initiator?.name || 'Venue',
        recipientName: collaboration.recipient?.name || 'Community',
      };
    }
    return { title: 'COLLABORATION AGREEMENT', subtitle: '', proposedLabel: 'PROPOSED', responseLabel: 'RESPONSE', initiatorName: '', recipientName: '' };
  };

  const labels = getLabels();

  // Status badge for a field
  const FieldStatusBadge = ({ action }) => {
    if (!action) return null;
    const config = {
      accept: { text: 'ACCEPTED', bg: 'bg-green-900/40', border: 'border-green-700', textColor: 'text-green-400', icon: <Check className="h-3 w-3" /> },
      modify: { text: 'MODIFIED', bg: 'bg-yellow-900/40', border: 'border-yellow-700', textColor: 'text-yellow-400', icon: <Pencil className="h-3 w-3" /> },
      decline: { text: 'DECLINED', bg: 'bg-red-900/40', border: 'border-red-700', textColor: 'text-red-400', icon: <X className="h-3 w-3" /> },
    };
    const c = config[action] || config.accept;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.border} ${c.textColor} border`}>
        {c.icon} {c.text}
      </span>
    );
  };

  // Format values for display
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ') || 'N/A';
    if (typeof value === 'object') {
      if (value.date) {
        const d = new Date(value.date);
        const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        const time = value.startTime && value.endTime ? ` | ${value.startTime} - ${value.endTime}` : '';
        return `${dateStr}${time}`;
      }
      // For selected objects like deliverables/requirements
      const selected = Object.entries(value)
        .filter(([k, v]) => v?.selected || v === true)
        .map(([k]) => k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim());
      if (selected.length) return selected.join(', ');
      if (typeof value.value !== 'undefined') return String(value.value);
      return JSON.stringify(value);
    }
    if (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('-') && value.length > 8) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return String(value);
  };

  // Format pricing for display
  const formatPricing = (pricing) => {
    if (!pricing) return 'N/A';
    const parts = [];
    if (pricing.cashSponsorship?.selected) parts.push(`Cash Sponsorship: ₹${pricing.cashSponsorship.value || 'TBD'}`);
    if (pricing.revenueShare?.selected) parts.push(`Revenue Share: ${pricing.revenueShare.value || 'TBD'}`);
    if (pricing.flatRental?.selected) parts.push(`Flat Rental: ₹${pricing.flatRental.value || 'TBD'}`);
    if (pricing.coverCharge?.selected) parts.push(`Cover Charge: ₹${pricing.coverCharge.value || 'TBD'}/person`);
    if (pricing.barter?.selected) parts.push(`Barter: ${pricing.barter.value || 'TBD'}`);
    if (pricing.stallCost?.selected) parts.push(`Stall Cost: ₹${pricing.stallCost.value || 'TBD'}`);
    if (pricing.additionalNotes) parts.push(`Notes: ${pricing.additionalNotes}`);
    return parts.length ? parts.join(' • ') : 'N/A';
  };

  // Format brand deliverables
  const formatDeliverables = (deliverables) => {
    if (!deliverables) return 'N/A';
    const items = Object.entries(deliverables)
      .filter(([, v]) => v?.selected)
      .map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
        const subs = v.subOptions ? Object.entries(v.subOptions).filter(([, sv]) => sv?.selected).map(([sk]) => sk.replace(/_/g, ' ')).join(', ') : '';
        return subs ? `${label} (${subs})` : label;
      });
    return items.length ? items.join(', ') : 'N/A';
  };

  // Format requirements
  const formatRequirements = (reqs) => {
    if (!reqs) return 'N/A';
    const items = Object.entries(reqs)
      .filter(([, v]) => v?.selected)
      .map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
        const subs = v.subOptions ? Object.entries(v.subOptions).filter(([, sv]) => sv?.selected).map(([sk]) => sk.replace(/_/g, ' ')).join(', ') : '';
        return subs ? `${label} (${subs})` : label;
      });
    return items.length ? items.join(', ') : 'N/A';
  };

  // Format audience proof
  const formatAudienceProof = (proof) => {
    if (!proof) return 'N/A';
    const parts = [];
    if (proof.pastSponsorBrands?.selected) parts.push(`Past Sponsors: ${proof.pastSponsorBrands.value || 'Yes'}`);
    if (proof.averageAttendance?.selected) parts.push(`Avg Attendance: ${proof.averageAttendance.value || 'Yes'}`);
    if (proof.communitySize?.selected) parts.push(`Community Size: ${proof.communitySize.value || 'Yes'}`);
    if (proof.repeatEventRate?.selected) parts.push(`Repeat Rate: ${proof.repeatEventRate.value || 'Yes'}%`);
    return parts.length ? parts.join(' • ') : 'N/A';
  };

  // Build field sections based on collaboration type
  const getSections = () => {
    if (collabType === 'communityToBrand') {
      return [
        {
          title: 'EVENT & CAMPAIGN DETAILS',
          fields: [
            { key: 'eventCategory', label: 'Event Category', value: proposalData.eventCategory },
            { key: 'expectedAttendees', label: 'Expected Attendees', value: proposalData.expectedAttendees },
            { key: 'eventFormat', label: 'Event Format', value: proposalData.eventFormat },
            { key: 'targetAudience', label: 'Target Audience', value: proposalData.targetAudience },
            { key: 'eventDate', label: 'Event Date', value: proposalData.eventDate },
            { key: 'backupDate', label: 'Backup Date', value: proposalData.backupDate },
            { key: 'city', label: 'City', value: proposalData.city },
          ]
        },
        {
          title: 'BRAND DELIVERABLES',
          fields: [
            { key: 'logoPlacement', label: 'Logo Placement', value: proposalData.brandDeliverables?.logoPlacement?.selected ? 'Requested' : null, fullValue: proposalData.brandDeliverables?.logoPlacement },
            { key: 'onGroundBranding', label: 'On-ground Branding', value: proposalData.brandDeliverables?.onGroundBranding?.selected ? 'Requested' : null, fullValue: proposalData.brandDeliverables?.onGroundBranding },
            { key: 'sampling', label: 'Product Sampling / Trials', value: proposalData.brandDeliverables?.sampling?.selected ? 'Requested' : null },
            { key: 'sponsoredSegments', label: 'Sponsored Segment / Naming Rights', value: proposalData.brandDeliverables?.sponsoredSegments?.selected ? 'Requested' : null },
            { key: 'digitalShoutouts', label: 'Digital Shoutouts', value: proposalData.brandDeliverables?.digitalShoutouts?.selected ? 'Requested' : null, fullValue: proposalData.brandDeliverables?.digitalShoutouts },
            { key: 'leadCapture', label: 'Lead Capture / Registration Data', value: proposalData.brandDeliverables?.leadCapture?.selected ? 'Requested' : null },
          ].filter(f => f.value)
        },
        {
          title: 'COMMERCIAL TERMS',
          fields: [
            { key: 'commercialModel', label: 'Pricing Model', value: formatPricing(proposalData.pricing) },
          ]
        },
        {
          title: 'AUDIENCE PROOF',
          fields: [
            { key: 'audienceProof', label: 'Supporting Data', value: formatAudienceProof(proposalData.audienceProof) },
          ]
        }
      ];
    }

    if (collabType === 'communityToVenue') {
      return [
        {
          title: 'EVENT & TIMING DETAILS',
          fields: [
            { key: 'seatingCapacity', label: 'Capacity', value: proposalData.seatingCapacity || proposalData.expectedAttendees },
            { key: 'eventDate', label: 'Date & Time', value: proposalData.eventDate },
            { key: 'eventType', label: 'Event Type', value: proposalData.eventType },
          ]
        },
        {
          title: 'VENUE SERVICES & EQUIPMENT',
          fields: Object.entries(proposalData.requirements || {})
            .filter(([, v]) => v?.selected)
            .map(([k, v]) => {
              const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
              const subs = v.subOptions ? Object.entries(v.subOptions).filter(([, sv]) => sv?.selected).map(([sk]) => sk.replace(/_/g, ' ')).join(', ') : '';
              return { key: k, label, value: subs || 'Requested' };
            })
        },
        {
          title: 'COMMERCIAL TERMS',
          fields: [
            { key: 'commercialModel', label: 'Pricing Model', value: formatPricing(proposalData.pricing) },
          ]
        }
      ];
    }

    if (collabType === 'brandToCommunity') {
      return [
        {
          title: 'CAMPAIGN DETAILS',
          fields: [
            { key: 'campaignObjectives', label: 'Campaign Objectives', value: proposalData.campaignObjectives ? Object.keys(proposalData.campaignObjectives).filter(k => proposalData.campaignObjectives[k]).join(', ') : 'N/A' },
            { key: 'targetAudience', label: 'Target Audience', value: Array.isArray(proposalData.targetAudience) ? proposalData.targetAudience.map(a => a.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ') : proposalData.targetAudience },
            { key: 'preferredFormats', label: 'Preferred Formats', value: proposalData.preferredFormats },
            { key: 'city', label: 'City', value: proposalData.city },
            { key: 'eventDate', label: 'Event Date', value: proposalData.eventDate },
            { key: 'backupDate', label: 'Backup Date', value: proposalData.backupDate },
          ]
        },
        {
          title: 'BRAND OFFERS',
          fields: Object.entries(proposalData.brandOffers || {})
            .filter(([, v]) => v?.selected)
            .map(([k, v]) => ({
              key: k + 'Offer',
              label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
              value: v.value || 'Offered',
            }))
        },
        {
          title: 'BRAND EXPECTATIONS',
          fields: Object.entries(proposalData.brandExpectations || {})
            .filter(([, v]) => v?.selected)
            .map(([k, v]) => ({
              key: k + 'Expectation',
              label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
              value: v.value || 'Expected',
            }))
        }
      ];
    }

    if (collabType === 'venueToCommunity') {
      return [
        {
          title: 'VENUE DETAILS',
          fields: [
            { key: 'venueType', label: 'Venue Type', value: proposalData.venueType },
            { key: 'capacityRange', label: 'Capacity Range', value: proposalData.capacityRange },
            { key: 'preferredEventFormats', label: 'Preferred Event Formats', value: proposalData.preferredEventFormats },
          ]
        },
        {
          title: 'VENUE OFFERINGS',
          fields: Object.entries(proposalData.venueOfferings || {})
            .filter(([, v]) => v?.selected)
            .map(([k, v]) => ({
              key: k + 'Offering',
              label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
              value: v.value || 'Included',
            }))
        },
        {
          title: 'COMMERCIAL TERMS',
          fields: Object.entries(proposalData.commercialModels || {})
            .filter(([, v]) => v?.selected)
            .map(([k, v]) => ({
              key: k,
              label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
              value: v.value || 'Offered',
            }))
        }
      ];
    }

    return [];
  };

  const sections = getSections();

  // Get the response value for a field
  const getResponseValue = (fieldKey) => {
    const response = fieldResponsesObj[fieldKey];
    if (!response) return null;
    if (response.action === 'accept') return { action: 'accept', value: null };
    if (response.action === 'modify') return { action: 'modify', value: response.modifiedValue };
    if (response.action === 'decline') return { action: 'decline', value: null };
    return null;
  };

  // Render a single agreement field row
  const AgreementField = ({ field }) => {
    const response = getResponseValue(field.key);
    const displayProposed = formatValue(field.value);

    let displayResponse = null;
    let responseColor = 'text-green-400';

    if (response) {
      if (response.action === 'accept') {
        displayResponse = displayProposed;
        responseColor = 'text-green-400';
      } else if (response.action === 'modify') {
        displayResponse = formatValue(response.value);
        responseColor = 'text-yellow-400';
      } else if (response.action === 'decline') {
        displayResponse = 'Not Provided';
        responseColor = 'text-red-400';
      }
    }

    return (
      <div className="bg-zinc-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-white font-medium text-sm">{field.label}</h4>
          {hasCounter && response && <FieldStatusBadge action={response.action} />}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{labels.proposedLabel}:</p>
            <p className="text-gray-300 text-sm">{displayProposed}</p>
          </div>
          {hasCounter && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{labels.responseLabel}:</p>
              <p className={`text-sm ${response ? responseColor : 'text-gray-500 italic'}`}>
                {displayResponse || 'Pending'}
              </p>
            </div>
          )}
        </div>
        {response?.action === 'modify' && fieldResponsesObj[field.key]?.note && (
          <div className="mt-2 pt-2 border-t border-gray-800">
            <p className="text-xs text-gray-500">Note: <span className="text-gray-400">{fieldResponsesObj[field.key].note}</span></p>
          </div>
        )}
      </div>
    );
  };

  // House rules section for venue collabs
  const houseRules = counterData.houseRules;
  const venueHouseRulesSection = (collabType === 'communityToVenue' && houseRules) ? {
    title: 'HOUSE RULES & POLICIES',
    fields: Object.entries(houseRules)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => ({
        key: k,
        label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
        proposedValue: 'N/A',
        responseValue: typeof v === 'boolean' ? (v ? 'Allowed' : 'Not Allowed') : String(v),
      }))
  } : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <NavigationBar />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-zinc-900 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {labels.title}
                </h1>
              </div>
              <p className="text-gray-400 text-sm ml-7">
                {labels.subtitle}
              </p>
            </div>
            {workspaceActive && (
              <button
                onClick={() => navigate(`/collaborations/${id}/workspace`)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
              >
                <MessageSquare className="h-4 w-4" />
                Open Discussion
              </button>
            )}
          </div>
        </div>

        {/* Agreement Sections */}
        <div className="space-y-6">
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3 px-1">
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.fields.length > 0 ? (
                  section.fields.map((field, fIdx) => (
                    <AgreementField key={fIdx} field={field} />
                  ))
                ) : (
                  <div className="bg-zinc-900 border border-gray-800 rounded-lg p-4">
                    <p className="text-gray-500 text-sm italic">No data available for this section</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* House Rules for venue collabs */}
          {venueHouseRulesSection && venueHouseRulesSection.fields.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3 px-1">
                {venueHouseRulesSection.title}
              </h3>
              <div className="space-y-3">
                {venueHouseRulesSection.fields.map((rule, rIdx) => (
                  <div key={rIdx} className="bg-zinc-900 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium text-sm">{rule.label}</h4>
                      <FieldStatusBadge action="accept" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{labels.proposedLabel}:</p>
                        <p className="text-gray-300 text-sm">{rule.proposedValue}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{labels.responseLabel}:</p>
                        <p className="text-green-400 text-sm">{rule.responseValue}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 mb-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => toast?.info('PDF download coming soon')}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-gray-700 rounded-lg text-white text-sm font-medium hover:border-gray-600 transition-all"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              onClick={() => navigate(`/organizer/collaborations`)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
            >
              <Settings className="h-4 w-4" />
              Manage Collaboration
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-600 text-xs">
              This agreement document reflects the {isInitiator ? 'recipient' : 'initiator'}'s response to the {isInitiator ? 'your' : ''} proposal. 
              Final terms are pending {workspaceActive ? 'workspace negotiation and ' : ''}mutual agreement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollabAgreement;
