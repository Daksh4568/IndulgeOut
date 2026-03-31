import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import CityDropdown from '../components/CityDropdown';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loading: authLoading } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'dashboard'); // dashboard, proposals, counters, flagged, analytics, all-collaborations, organizers
  const [stats, setStats] = useState(null);
  const [collabAnalytics, setCollabAnalytics] = useState(null);
  
  // Proposals state
  const [pendingProposals, setPendingProposals] = useState([]);
  const [flaggedProposals, setFlaggedProposals] = useState([]);
  const [allCollaborations, setAllCollaborations] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [proposalFilters, setProposalFilters] = useState({ type: '', status: '' });
  
  // Counters state
  const [pendingCounters, setPendingCounters] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState(null);
  
  // Organizers state
  const [organizers, setOrganizers] = useState([]);
  const [organizerPagination, setOrganizerPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [organizerFilters, setOrganizerFilters] = useState({ search: '', city: '', verified: '' });
  const [currentView, setCurrentView] = useState('list'); // list, organizer-details, event-details
  
  // Modals state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  
  // Form state
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Marketing state
  const [marketingAudienceType, setMarketingAudienceType] = useState('all_b2c');
  const [marketingOrganizerId, setMarketingOrganizerId] = useState('');
  const [marketingCategories, setMarketingCategories] = useState([]);
  const [marketingEventId, setMarketingEventId] = useState('');
  const [marketingEvents, setMarketingEvents] = useState([]);
  const [marketingEventSearch, setMarketingEventSearch] = useState('');
  const [marketingOrganizers, setMarketingOrganizers] = useState([]);
  const [marketingOrganizerSearch, setMarketingOrganizerSearch] = useState('');
  const [showOrganizerDropdown, setShowOrganizerDropdown] = useState(false);
  const orgDropdownRef = useRef(null);
  const [marketingAudiencePreview, setMarketingAudiencePreview] = useState(null);
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [marketingSending, setMarketingSending] = useState(false);
  const [marketingResult, setMarketingResult] = useState(null);
  const [showMarketingConfirm, setShowMarketingConfirm] = useState(false);
  // Sub-filters
  const [marketingAgeMin, setMarketingAgeMin] = useState('');
  const [marketingAgeMax, setMarketingAgeMax] = useState('');
  const [marketingGender, setMarketingGender] = useState('');
  const [marketingCity, setMarketingCity] = useState('');
  const [showSubFilters, setShowSubFilters] = useState(false);

  // Close organizer dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target)) {
        setShowOrganizerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if user is admin
  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (user && user.role === 'admin') {
      switch (activeTab) {
        case 'proposals':
          fetchPendingProposals();
          break;
        case 'counters':
          fetchPendingCounters();
          break;
        case 'flagged':
          fetchFlaggedProposals();
          break;
        case 'analytics':
          fetchCollabAnalytics();
          break;
        case 'all-collaborations':
          fetchAllCollaborations();
          break;
        case 'organizers':
          fetchOrganizers();
          setCurrentView('list');
          break;
        case 'marketing':
          fetchMarketingData();
          break;
        default:
          break;
      }
    }
  }, [activeTab, user]);

  // Re-fetch all collaborations when filters change
  useEffect(() => {
    if (activeTab === 'all-collaborations') {
      fetchAllCollaborations();
    }
  }, [proposalFilters]);

  // Fetch Functions
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, proposalsRes, countersRes, analyticsRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/collaborations/pending'),
        api.get('/admin/collaborations/counters/pending'),
        api.get('/admin/collaborations/analytics')
      ]);

      setStats(statsRes.data);
      setPendingProposals(proposalsRes.data.data || proposalsRes.data);
      setPendingCounters(countersRes.data.data || countersRes.data);
      setCollabAnalytics(analyticsRes.data.data || analyticsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingProposals = async () => {
    try {
      const res = await api.get('/admin/collaborations/pending');
      setPendingProposals(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching proposals:', err);
    }
  };

  const fetchPendingCounters = async () => {
    try {
      const res = await api.get('/admin/collaborations/counters/pending');
      setPendingCounters(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching counters:', err);
    }
  };

  const fetchFlaggedProposals = async () => {
    try {
      const res = await api.get('/admin/collaborations/flagged');
      setFlaggedProposals(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching flagged proposals:', err);
    }
  };

  const fetchCollabAnalytics = async () => {
    try {
      const res = await api.get('/admin/collaborations/analytics');
      setCollabAnalytics(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const fetchAllCollaborations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/collaborations/all', {
        params: {
          page: 1,
          limit: 100,
          status: proposalFilters.status || undefined,
          type: proposalFilters.type || undefined
        }
      });
      setAllCollaborations(res.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching all collaborations:', err);
      setError('Failed to load collaborations');
    } finally {
      setLoading(false);
    }
  };

  // Organizer Fetch Functions
  const fetchOrganizers = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', 20);
      if (organizerFilters.search) queryParams.append('search', organizerFilters.search);
      if (organizerFilters.city) queryParams.append('city', organizerFilters.city);
      if (organizerFilters.verified) queryParams.append('verified', organizerFilters.verified);
      
      const response = await api.get(`/admin/organizers?${queryParams}`);
      setOrganizers(response.data.organizers || []);
      setOrganizerPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
      setError(null);
    } catch (err) {
      console.error('Error fetching organizers:', err);
      setError('Failed to fetch organizers');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizerDetails = async (organizerId) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/organizers/${organizerId}`);
      setSelectedOrganizer(response.data);
      // Also fetch their events
      const eventsResponse = await api.get(`/admin/organizers/${organizerId}/events`);
      setOrganizerEvents(eventsResponse.data.events || []);
      setCurrentView('organizer-details');
      setError(null);
    } catch (err) {
      console.error('Error fetching organizer details:', err);
      setError('Failed to fetch organizer details');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetails = async (eventId) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/events/${eventId}/complete-details`);
      setEventDetails(response.data);
      setCurrentView('event-details');
      setError(null);
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError('Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyKYC = async (organizerId, isVerified) => {
    try {
      await api.put(`/admin/organizers/${organizerId}/verify-kyc`, {
        isVerified,
        notes: isVerified ? 'KYC verified by admin' : 'Please update your KYC details'
      });
      alert(`KYC ${isVerified ? 'verified' : 'rejected'} successfully`);
      // Refresh organizer details
      fetchOrganizerDetails(organizerId);
    } catch (err) {
      console.error('Error verifying KYC:', err);
      alert('Failed to update KYC status');
    }
  };

  const downloadAuditReport = async (eventId, eventTitle) => {
    try {
      const response = await api.get(`/admin/events/${eventId}/audit-report`, {
        params: { format: 'csv' },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-${eventTitle.replace(/\s+/g, '-')}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading audit report:', err);
      alert('Failed to download audit report');
    }
  };

  const handleBackToOrganizers = () => {
    setCurrentView('list');
    setSelectedOrganizer(null);
    setOrganizerEvents([]);
    setSelectedEvent(null);
    setEventDetails(null);
  };

  const handleBackToOrganizerDetails = () => {
    setCurrentView('organizer-details');
    setSelectedEvent(null);
    setEventDetails(null);
  };

  // ==================== MARKETING FUNCTIONS ====================

  const fetchMarketingData = async () => {
    try {
      const [eventsRes, orgRes] = await Promise.all([
        api.get('/admin/marketing/events'),
        api.get('/admin/organizers?limit=100')
      ]);
      if (eventsRes.data.success) setMarketingEvents(eventsRes.data.events);
      if (orgRes.data.organizers) setMarketingOrganizers(orgRes.data.organizers);
    } catch (err) {
      console.error('Error fetching marketing data:', err);
    }
  };

  const fetchMarketingAudience = async () => {
    setMarketingLoading(true);
    setMarketingAudiencePreview(null);
    try {
      const params = new URLSearchParams({ audienceType: marketingAudienceType });
      if (marketingAudienceType === 'organizer_specific' && marketingOrganizerId) {
        params.append('organizerId', marketingOrganizerId);
      }
      if (marketingAudienceType === 'category_interests' && marketingCategories.length > 0) {
        params.append('categories', marketingCategories.join(','));
      }
      // Sub-filters
      if (marketingAgeMin) params.append('ageMin', marketingAgeMin);
      if (marketingAgeMax) params.append('ageMax', marketingAgeMax);
      if (marketingGender) params.append('gender', marketingGender);
      if (marketingCity.trim()) params.append('city', marketingCity.trim());

      const res = await api.get(`/admin/marketing/audience?${params.toString()}`);
      if (res.data.success) {
        setMarketingAudiencePreview(res.data);
      }
    } catch (err) {
      console.error('Error fetching audience preview:', err);
    } finally {
      setMarketingLoading(false);
    }
  };

  const handleSendMarketing = async () => {
    setMarketingSending(true);
    setMarketingResult(null);
    setShowMarketingConfirm(false);
    try {
      const body = {
        audienceType: marketingAudienceType,
        eventId: marketingEventId,
      };
      if (marketingAudienceType === 'organizer_specific') body.organizerId = marketingOrganizerId;
      if (marketingAudienceType === 'category_interests') body.categories = marketingCategories;
      // Sub-filters
      if (marketingAgeMin) body.ageMin = marketingAgeMin;
      if (marketingAgeMax) body.ageMax = marketingAgeMax;
      if (marketingGender) body.gender = marketingGender;
      if (marketingCity.trim()) body.city = marketingCity.trim();

      const res = await api.post('/admin/marketing/send', body);
      setMarketingResult(res.data);
    } catch (err) {
      console.error('Error sending marketing messages:', err);
      setMarketingResult({ success: false, error: err.response?.data?.error || 'Failed to send' });
    } finally {
      setMarketingSending(false);
    }
  };

  const handleExportAudienceCSV = async () => {
    try {
      const params = new URLSearchParams({ audienceType: marketingAudienceType });
      if (marketingAudienceType === 'organizer_specific' && marketingOrganizerId) {
        params.append('organizerId', marketingOrganizerId);
      }
      if (marketingAudienceType === 'category_interests' && marketingCategories.length > 0) {
        params.append('categories', marketingCategories.join(','));
      }
      if (marketingAgeMin) params.append('ageMin', marketingAgeMin);
      if (marketingAgeMax) params.append('ageMax', marketingAgeMax);
      if (marketingGender) params.append('gender', marketingGender);
      if (marketingCity.trim()) params.append('city', marketingCity.trim());

      const res = await api.get(`/admin/marketing/audience/export?${params.toString()}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `b2c_users_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting audience CSV:', err);
    }
  };

  // MSG91 WhatsApp pricing per message (Marketing template rate for India)
  // Utility templates: ₹0.115 | Marketing templates: ₹0.78 (Meta) + MSG91 markup
  const MSG91_MARKETING_RATE = 0.80;

  const MARKETING_CATEGORIES = [
    'Social Mixers',
    'Wellness, Fitness & Sports',
    'Art, Music & Dance',
    'Immersive',
    'Food & Beverage',
    'Games'
  ];

  // ==================== PROPOSAL/COUNTER FORMATTING HELPERS ====================
  const formatFieldValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
      // Handle arrays of objects (like images)
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        if (value[0].url || value[0].key) return '__IMAGES__';
        return value.map(v => JSON.stringify(v)).join(', ');
      }
      return value.join(', ') || 'N/A';
    }
    if (typeof value === 'object') {
      if (value.date) {
        const d = new Date(value.date);
        const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const time = value.startTime && value.endTime ? ` | ${value.startTime} - ${value.endTime}` : '';
        return `${dateStr}${time}`;
      }
      const selected = Object.entries(value)
        .filter(([, v]) => v?.selected || v === true)
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

  const formatPricingData = (pricing) => {
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

  const formatAudienceProofData = (proof) => {
    if (!proof) return 'N/A';
    const parts = [];
    if (proof.pastSponsorBrands?.selected) parts.push(`Past Sponsors: ${proof.pastSponsorBrands.value || 'Yes'}`);
    if (proof.averageAttendance?.selected) parts.push(`Avg Attendance: ${proof.averageAttendance.value || 'Yes'}`);
    if (proof.communitySize?.selected) parts.push(`Community Size: ${proof.communitySize.value || 'Yes'}`);
    if (proof.repeatEventRate?.selected) parts.push(`Repeat Rate: ${proof.repeatEventRate.value || 'Yes'}%`);
    return parts.length ? parts.join(' • ') : 'N/A';
  };

  const getProposalSections = (collab) => {
    const type = collab.type;
    const data = collab.communityToBrand || collab.communityToVenue || collab.brandToCommunity || collab.venueToCommunity || collab.formData || {};

    if (type === 'communityToBrand') {
      return [
        {
          title: 'Event & Campaign Details',
          fields: [
            { label: 'Event Category', value: data.eventCategory },
            { label: 'Expected Attendees', value: data.expectedAttendees },
            { label: 'Event Format', value: data.eventFormat },
            { label: 'Target Audience', value: data.targetAudience },
            { label: 'Niche Audience Details', value: data.nicheAudienceDetails },
            { label: 'Event Date', value: data.eventDate },
            { label: 'Backup Date', value: data.backupDate },
            { label: 'City', value: data.city },
          ].filter(f => f.value !== undefined && f.value !== null && f.value !== '')
        },
        {
          title: 'Brand Deliverables',
          fields: Object.entries(data.brandDeliverables || {})
            .filter(([, v]) => v?.selected)
            .map(([k, v]) => {
              const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
              const subs = v.subOptions ? Object.entries(v.subOptions).filter(([, sv]) => sv?.selected).map(([sk]) => sk.replace(/_/g, ' ')).join(', ') : '';
              return { label, value: subs || 'Requested', comment: v.comment };
            })
        },
        {
          title: 'Commercial Terms',
          fields: [{ label: 'Pricing Model', value: formatPricingData(data.pricing) }]
        },
        {
          title: 'Audience Proof',
          fields: [{ label: 'Supporting Data', value: formatAudienceProofData(data.audienceProof) }]
        },
        {
          title: 'Supporting Information',
          fields: [
            ...(data.supportingInfo?.images?.length ? [{ label: 'Images', value: data.supportingInfo.images, isImages: true }] : []),
            ...(data.supportingInfo?.note ? [{ label: 'Note', value: data.supportingInfo.note }] : []),
          ]
        }
      ];
    }

    if (type === 'communityToVenue') {
      return [
        {
          title: 'Event & Timing Details',
          fields: [
            { label: 'Capacity', value: data.seatingCapacity || data.expectedAttendees },
            { label: 'Event Date', value: data.eventDate },
            { label: 'Backup Date', value: data.backupDate },
            { label: 'Event Type', value: data.eventType },
            { label: 'Event Category', value: data.eventCategory },
            { label: 'City', value: data.city },
          ].filter(f => f.value !== undefined && f.value !== null && f.value !== '')
        },
        {
          title: 'Venue Services & Equipment',
          fields: Object.entries(data.requirements || {})
            .filter(([, v]) => v?.selected)
            .map(([k, v]) => {
              const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
              const subs = v.subOptions ? Object.entries(v.subOptions).filter(([, sv]) => sv?.selected).map(([sk]) => sk.replace(/_/g, ' ')).join(', ') : '';
              return { label, value: subs || 'Requested', comment: v.comment };
            })
        },
        {
          title: 'Commercial Terms',
          fields: [{ label: 'Pricing Model', value: formatPricingData(data.pricing) }]
        },
        {
          title: 'Supporting Information',
          fields: [
            ...(data.supportingInfo?.images?.length ? [{ label: 'Images', value: data.supportingInfo.images, isImages: true }] : []),
            ...(data.supportingInfo?.note ? [{ label: 'Note', value: data.supportingInfo.note }] : []),
          ]
        }
      ];
    }

    if (type === 'brandToCommunity') {
      return [
        {
          title: 'Campaign Details',
          fields: [
            { label: 'Campaign Objectives', value: data.campaignObjectives ? Object.keys(data.campaignObjectives).filter(k => data.campaignObjectives[k]).join(', ') : null },
            { label: 'Target Audience', value: data.targetAudience },
            { label: 'Preferred Formats', value: data.preferredFormats },
            { label: 'City', value: data.city },
            { label: 'Timeline', value: (() => {
              const tl = data.timeline;
              if (!tl?.startDate) return null;
              const sdDate = typeof tl.startDate === 'object' ? tl.startDate.date : tl.startDate;
              const edDate = typeof tl.endDate === 'object' ? tl.endDate.date : tl.endDate;
              const sdTime = typeof tl.startDate === 'object' && tl.startDate.startTime ? ` ${tl.startDate.startTime}${tl.startDate.endTime ? '-' + tl.startDate.endTime : ''}` : '';
              const edTime = typeof tl.endDate === 'object' && tl.endDate.startTime ? ` ${tl.endDate.startTime}${tl.endDate.endTime ? '-' + tl.endDate.endTime : ''}` : '';
              const start = sdDate ? new Date(sdDate).toLocaleDateString('en-IN') + sdTime : '';
              const end = edDate ? new Date(edDate).toLocaleDateString('en-IN') + edTime : 'TBD';
              return start ? `${start} - ${end}` : null;
            })() },
            { label: 'Backup Timeline', value: (() => {
              const bt = data.backupTimeline;
              if (!bt?.startDate?.date) return null;
              const sdTime = bt.startDate.startTime ? ` ${bt.startDate.startTime}${bt.startDate.endTime ? '-' + bt.startDate.endTime : ''}` : '';
              const edTime = bt.endDate?.startTime ? ` ${bt.endDate.startTime}${bt.endDate.endTime ? '-' + bt.endDate.endTime : ''}` : '';
              const start = new Date(bt.startDate.date).toLocaleDateString('en-IN') + sdTime;
              const end = bt.endDate?.date ? new Date(bt.endDate.date).toLocaleDateString('en-IN') + edTime : 'TBD';
              return `${start} - ${end}`;
            })() },
          ].filter(f => f.value !== undefined && f.value !== null && f.value !== '')
        },
        {
          title: 'Brand Offers',
          fields: Object.entries(data.brandOffers || {})
            .filter(([, v]) => v?.selected)
            .map(([k, v]) => ({
              label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
              value: v.value || 'Offered',
              comment: v.comment,
            }))
        },
        {
          title: 'Brand Expectations',
          fields: Object.entries(data.brandExpectations || {})
            .filter(([, v]) => v?.selected)
            .map(([k, v]) => ({
              label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
              value: v.value || 'Expected',
              comment: v.comment,
            }))
        },
        {
          title: 'Supporting Information',
          fields: [
            ...(data.supportingInfo?.images?.length ? [{ label: 'Images', value: data.supportingInfo.images, isImages: true }] : []),
            ...(data.supportingInfo?.note ? [{ label: 'Note', value: data.supportingInfo.note }] : []),
          ]
        }
      ];
    }

    if (type === 'venueToCommunity') {
      return [
        {
          title: 'Venue Details',
          fields: [
            { label: 'Venue Type', value: data.venueType },
            { label: 'Capacity Range', value: data.capacityRange },
            { label: 'Preferred Event Formats', value: data.preferredEventFormats },
            { label: 'City', value: data.city },
          ].filter(f => f.value !== undefined && f.value !== null && f.value !== '')
        },
        {
          title: 'Venue Offerings',
          fields: Object.entries(data.venueOfferings || {})
            .filter(([, v]) => v?.selected)
            .map(([k, v]) => ({
              label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
              value: v.value || 'Included',
              comment: v.comment,
            }))
        },
        {
          title: 'Commercial Terms',
          fields: Object.entries(data.commercialModels || {})
            .filter(([, v]) => v?.selected)
            .map(([k, v]) => ({
              label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
              value: v.value || 'Offered',
              comment: v.comment,
            }))
        },
        {
          title: 'Supporting Information',
          fields: [
            ...(data.supportingInfo?.images?.length ? [{ label: 'Images', value: data.supportingInfo.images, isImages: true }] : []),
            ...(data.supportingInfo?.note ? [{ label: 'Note', value: data.supportingInfo.note }] : []),
          ]
        }
      ];
    }

    // Fallback: render formData as flat key-value
    return [{
      title: 'Proposal Details',
      fields: Object.entries(data).map(([k, v]) => ({
        label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
        value: v,
      }))
    }];
  };

  // Render an image value (array of image URLs or {url, key} objects)
  const renderImageGallery = (images) => {
    if (!images || !Array.isArray(images)) return null;
    const urls = images.map(img => {
      if (typeof img === 'string') return img;
      if (img?.url) return img.url;
      if (img?.key) return `https://${img.key}`;
      return null;
    }).filter(Boolean);
    if (urls.length === 0) return <span className="text-gray-500 text-sm">No images</span>;
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {urls.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
            <img src={url} alt={`Attachment ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-700 hover:border-purple-500 transition-colors" />
          </a>
        ))}
      </div>
    );
  };

  const fetchProposalDetails = async (id) => {
    try {
      const res = await api.get(`/admin/collaborations/${id}`);
      const collaboration = res.data.data || res.data;
      setSelectedProposal(collaboration);
      
      // Counter data is now included in the collaboration response
      if (collaboration.hasCounter && collaboration.counterData) {
        console.log('Counter Data Found in Collaboration:', collaboration.counterData);
        console.log('🔍 AdminReview data in collaboration:', {
          hasAdminReview: !!collaboration.adminReview,
          reviewedAt: collaboration.adminReview?.reviewedAt,
          counterReviewedAt: collaboration.adminReview?.counterReviewedAt,
          counterReviewedBy: collaboration.adminReview?.counterReviewedBy,
          counterDecision: collaboration.adminReview?.counterDecision
        });
        // Set the counter data directly from the collaboration
        const selectedCounterData = {
          ...collaboration,
          counterData: collaboration.counterData,
          responderId: collaboration.counterData.responderId || collaboration.recipient?.user || collaboration.recipientId,
          responderType: collaboration.counterData.responderType || collaboration.recipient?.userType || collaboration.recipientType,
          createdAt: collaboration.response?.respondedAt || collaboration.acceptedAt,
          status: collaboration.status
        };
        console.log('🔍 SelectedCounter adminReview after spread:', selectedCounterData.adminReview);
        setSelectedCounter(selectedCounterData);
      } else {
        setSelectedCounter(null);
      }
      
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error fetching proposal details:', err);
      alert('Failed to load proposal details');
    }
  };

  const fetchCounterDetails = async (id) => {
    try {
      const res = await api.get(`/admin/collaborations/counters/${id}`);
      setSelectedCounter(res.data.data || res.data);
      setShowCounterModal(true);
    } catch (err) {
      console.error('Error fetching counter details:', err);
      alert('Failed to load counter details');
    }
  };

  // Action Handlers
  const handleApproveProposal = async () => {
    try {
      setActionLoading(true);
      await api.put(`/admin/collaborations/${selectedProposal._id}/approve`, {
        adminNotes
      });

      // Refresh data
      await fetchDashboardData();
      
      setShowApproveModal(false);
      setShowDetailsModal(false);
      setAdminNotes('');
      setSelectedProposal(null);
      setSelectedCounter(null);
      
      alert('Proposal approved successfully!');
    } catch (err) {
      console.error('Error approving proposal:', err);
      alert(err.response?.data?.message || 'Failed to approve proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProposal = async () => {
    if (rejectionReason.length < 10) {
      alert('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/collaborations/${selectedProposal._id}/reject`, {
        reason: rejectionReason,
        adminNotes
      });

      // Refresh data
      await fetchDashboardData();
      
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setRejectionReason('');
      setAdminNotes('');
      setSelectedProposal(null);
      setSelectedCounter(null);
      
      alert('Proposal rejected successfully!');
    } catch (err) {
      console.error('Error rejecting proposal:', err);
      alert(err.response?.data?.message || 'Failed to reject proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlagProposal = async () => {
    if (flagReason.length < 5) {
      alert('Please provide a reason for flagging');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/collaborations/${selectedProposal._id}/flag`, {
        flagReason,
        adminNotes
      });

      // Refresh data
      await fetchDashboardData();
      await fetchFlaggedProposals();
      
      setShowFlagModal(false);
      setShowDetailsModal(false);
      setFlagReason('');
      setAdminNotes('');
      setSelectedProposal(null);
      setSelectedCounter(null);
      
      alert('Proposal flagged successfully!');
    } catch (err) {
      console.error('Error flagging proposal:', err);
      alert(err.response?.data?.message || 'Failed to flag proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCounter = async () => {
    try {
      setActionLoading(true);
      await api.put(`/admin/collaborations/counters/${selectedCounter._id}/approve`, {
        adminNotes
      });

      // Refresh data
      await fetchDashboardData();
      
      setShowApproveModal(false);
      setShowCounterModal(false);
      setAdminNotes('');
      setSelectedCounter(null);
      
      alert('Counter-proposal approved successfully!');
    } catch (err) {
      console.error('Error approving counter:', err);
      alert(err.response?.data?.message || 'Failed to approve counter');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCounter = async () => {
    if (rejectionReason.length < 10) {
      alert('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/collaborations/counters/${selectedCounter._id}/reject`, {
        rejectionReason,
        adminNotes
      });

      // Refresh data
      await fetchDashboardData();
      
      setShowRejectModal(false);
      setShowCounterModal(false);
      setRejectionReason('');
      setAdminNotes('');
      setSelectedCounter(null);
      
      alert('Counter-proposal rejected successfully!');
    } catch (err) {
      console.error('Error rejecting counter:', err);
      alert(err.response?.data?.message || 'Failed to reject counter');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper Functions
  const getCollabTypeLabel = (type) => {
    const labels = {
      communityToVenue: 'Community → Venue',
      communityToBrand: 'Community → Brand',
      brandToCommunity: 'Brand → Community',
      venueToCommunity: 'Venue → Community'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { color: 'bg-gray-500', text: 'Draft' },
      pending_admin_review: { color: 'bg-yellow-500', text: 'Pending Review' },
      approved_delivered: { color: 'bg-green-500', text: 'Approved' },
      rejected: { color: 'bg-red-500', text: 'Rejected' },
      counter_pending_review: { color: 'bg-blue-500', text: 'Counter Pending' },
      counter_delivered: { color: 'bg-purple-500', text: 'Counter Delivered' },
      confirmed: { color: 'bg-emerald-500', text: 'Confirmed' },
      declined: { color: 'bg-orange-500', text: 'Declined' },
      flagged: { color: 'bg-red-600 animate-pulse', text: 'Flagged' }
    };
    const { color, text } = config[status] || { color: 'bg-gray-500', text: status };
    return (
      <span className={`px-2 py-1 text-xs font-semibold text-white rounded ${color}`}>
        {text}
      </span>
    );
  };

  const getComplianceRiskBadge = (flags) => {
    if (!flags || flags.length === 0) {
      return <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">Clean</span>;
    }
    
    const highRisk = flags.some(f => f.includes('auto_reject') || f.includes('phone') || f.includes('email'));
    if (highRisk) {
      return <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded animate-pulse">High Risk</span>;
    }
    
    return <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded">Review</span>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Collaboration Management Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome, {user?.name || 'Admin'} • {user?.adminProfile?.accessLevel?.replace('_', ' ').toUpperCase() || 'FULL ACCESS'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {[
                { id: 'dashboard', label: 'Overview', badge: null },
                { id: 'organizers', label: 'Organizers', badge: null },
                { id: 'proposals', label: 'Pending Proposals', badge: pendingProposals.length || null },
                { id: 'counters', label: 'Pending Counters', badge: pendingCounters.length || null },
                { id: 'all-collaborations', label: 'All Collaborations', badge: null },
                { id: 'flagged', label: 'Flagged Items', badge: flaggedProposals.length || null },
                { id: 'analytics', label: 'Analytics', badge: null },
                { id: 'marketing', label: 'Marketing', badge: null }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Platform Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Users */}
              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stats?.overview?.totalUsers || 0}
                    </p>
                    {stats?.growth?.users?.growthPercentage !== undefined && (
                      <p className={`text-sm mt-2 ${stats.growth.users.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.growth.users.growthPercentage >= 0 ? '+' : ''}{stats.growth.users.growthPercentage}% from last month
                      </p>
                    )}
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Communities */}
              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Communities</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stats?.overview?.totalCommunities || 0}
                    </p>
                    {stats?.growth?.communities?.growthPercentage !== undefined && (
                      <p className={`text-sm mt-2 ${stats.growth.communities.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.growth.communities.growthPercentage >= 0 ? '+' : ''}{stats.growth.communities.growthPercentage}% from last month
                      </p>
                    )}
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Venues */}
              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Venues</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stats?.overview?.totalVenues || 0}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Brands */}
              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Brands</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stats?.overview?.totalBrands || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                    <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Collaboration Stats */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Collaboration Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-zinc-900/50 rounded-lg shadow p-6 border-2 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                      {collabAnalytics?.pendingReview || 0}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                      Needs your action
                    </p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                    <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Proposals</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {collabAnalytics?.totalProposals || 0}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approval Rate</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {collabAnalytics?.approvalRate ? `${Math.round(collabAnalytics.approvalRate)}%` : '0%'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Review Time</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {collabAnalytics?.avgReviewTime ? `${Math.round(collabAnalytics.avgReviewTime)}h` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/50 rounded-lg shadow p-6 border-2 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Flagged Items</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                      {collabAnalytics?.flagged || 0}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Compliance issues
                    </p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirmed</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                    {collabAnalytics?.confirmed || 0}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {collabAnalytics?.rejected || 0}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Counters</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {pendingCounters.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('proposals')}
                  className="p-4 border-2 border-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">Review Proposals</span>
                    {pendingProposals.length > 0 && (
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {pendingProposals.length}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review and approve pending collaboration proposals
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('counters')}
                  className="p-4 border-2 border-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">Review Counters</span>
                    {pendingCounters.length > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {pendingCounters.length}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review counter-proposals from recipients
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('flagged')}
                  className="p-4 border-2 border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-600 dark:text-red-400 font-semibold">Check Flagged</span>
                    {flaggedProposals.length > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                        {flaggedProposals.length}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review compliance violations and flagged items
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Proposals Tab */}
        {activeTab === 'proposals' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pending Proposals</h2>
              <p className="text-gray-600 dark:text-gray-400">Review and approve collaboration proposals submitted by users</p>
            </div>

            {pendingProposals.length === 0 ? (
              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-lg">No pending proposals to review</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">All caught up! 🎉</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingProposals.map((proposal) => (
                  <div key={proposal._id} className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {getStatusBadge(proposal.status)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {getCollabTypeLabel(proposal.type)}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Submitted {getTimeSince(proposal.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {proposal.complianceFlags && proposal.complianceFlags.length > 0 && (
                            <>
                              {getComplianceRiskBadge(proposal.complianceFlags)}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        {/* Proposer */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={proposal.proposerId?.profilePicture || '/default-avatar.png'}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">From</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {proposal.proposerId?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {proposal.proposerType}
                            </p>
                          </div>
                        </div>

                        {/* Recipient */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={proposal.recipientId?.profilePicture || '/default-avatar.png'}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">To</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {proposal.recipientId?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {proposal.recipientType}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Compliance Flags Alert */}
                      {proposal.complianceFlags && proposal.complianceFlags.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Compliance Issues Detected</p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {proposal.complianceFlags.map((flag, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded">
                                    {flag.replace(/_/g, ' ').toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => fetchProposalDetails(proposal._id)}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                        >
                          View Full Details →
                        </button>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowFlagModal(true);
                            }}
                            className="px-4 py-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 border border-yellow-300 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                          >
                            Flag
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowRejectModal(true);
                            }}
                            className="px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowApproveModal(true);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Counters Tab */}
        {activeTab === 'counters' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pending Counter-Proposals</h2>
              <p className="text-gray-600 dark:text-gray-400">Review counter-proposals submitted in response to collaborations</p>
            </div>

            {pendingCounters.length === 0 ? (
              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-lg">No pending counters to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCounters.map((counter) => (
                  <div key={counter._id} className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            Counter-Proposal Response
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Original: {getCollabTypeLabel(counter.collaborationId?.type)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Submitted {getTimeSince(counter.createdAt)}
                          </p>
                        </div>
                        {getStatusBadge(counter.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        {/* Original Proposer */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={counter.collaborationId?.proposerId?.profilePicture || '/default-avatar.png'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Original Proposer</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {counter.collaborationId?.proposerId?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>

                        {/* Counter Responder */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={counter.responderId?.profilePicture || '/default-avatar.png'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Counter by</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {counter.responderId?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Counter Summary */}
                      {counter.counterData && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm text-blue-900 dark:text-blue-300">
                            <strong>Modifications:</strong> {Object.keys(counter.counterData.fieldResponses || {}).filter(key => 
                              counter.counterData.fieldResponses[key]?.action === 'modify'
                            ).length} fields modified
                          </p>
                          {counter.counterData.generalNotes && (
                            <p className="text-sm text-blue-900 dark:text-blue-300 mt-1">
                              <strong>Note:</strong> {counter.counterData.generalNotes.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => fetchCounterDetails(counter._id)}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                        >
                          View Full Counter →
                        </button>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setSelectedCounter(counter);
                              setShowRejectModal(true);
                            }}
                            className="px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCounter(counter);
                              setShowApproveModal(true);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Flagged Items Tab */}
        {activeTab === 'flagged' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Flagged Items</h2>
              <p className="text-gray-600 dark:text-gray-400">Review proposals with compliance violations or manual flags</p>
            </div>

            {flaggedProposals.length === 0 ? (
              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-12 text-center">
                <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-lg">No flagged items</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">All submissions are compliant! ✨</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flaggedProposals.map((proposal) => (
                  <div key={proposal._id} className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow border-2 border-red-300 hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusBadge(proposal.status)}
                            {getComplianceRiskBadge(proposal.complianceFlags)}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {getCollabTypeLabel(proposal.type)}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Flagged {getTimeSince(proposal.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={proposal.proposerId?.profilePicture || '/default-avatar.png'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">From</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {proposal.proposerId?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <img
                            src={proposal.recipientId?.profilePicture || '/default-avatar.png'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">To</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {proposal.recipientId?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Compliance Flags */}
                      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Violation Details:</p>
                            <div className="flex flex-wrap gap-2">
                              {proposal.complianceFlags && proposal.complianceFlags.map((flag, idx) => (
                                <span key={idx} className="inline-block text-xs px-3 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-full font-medium">
                                  {flag.replace(/_/g, ' ').toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => fetchProposalDetails(proposal._id)}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                        >
                          Investigate Details →
                        </button>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowRejectModal(true);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowApproveModal(true);
                            }}
                            className="px-4 py-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 border border-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          >
                            Approve Anyway
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && collabAnalytics && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Collaboration Analytics</h2>
              <p className="text-gray-600 dark:text-gray-400">Insights and metrics for collaboration workflow</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                <p className="text-sm opacity-90">Total Proposals</p>
                <p className="text-4xl font-bold mt-2">{collabAnalytics.totalProposals || 0}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
                <p className="text-sm opacity-90">Approval Rate</p>
                <p className="text-4xl font-bold mt-2">{collabAnalytics.approvalRate ? `${Math.round(collabAnalytics.approvalRate)}%` : '0%'}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
                <p className="text-sm opacity-90">Avg Review Time</p>
                <p className="text-4xl font-bold mt-2">{collabAnalytics.avgReviewTime ? `${Math.round(collabAnalytics.avgReviewTime)}h` : 'N/A'}</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow p-6 text-white">
                <p className="text-sm opacity-90">Success Rate</p>
                <p className="text-4xl font-bold mt-2">
                  {collabAnalytics.totalProposals > 0 
                    ? `${Math.round((collabAnalytics.confirmed / collabAnalytics.totalProposals) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>

            {/* Breakdown by Type */}
            <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Proposals by Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {collabAnalytics.byType && Object.entries(collabAnalytics.byType).map(([type, count]) => (
                  <div key={type} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{getCollabTypeLabel(type)}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {collabAnalytics.totalProposals > 0 
                        ? `${Math.round((count / collabAnalytics.totalProposals) * 100)}%`
                        : '0%'
                      } of total
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{collabAnalytics.pendingReview || 0}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300 mb-1">Approved</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{collabAnalytics.approved || 0}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{collabAnalytics.rejected || 0}</p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">Confirmed</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{collabAnalytics.confirmed || 0}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              {collabAnalytics.recentActivity && collabAnalytics.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {collabAnalytics.recentActivity.map((activity) => (
                    <div key={activity._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(activity.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {getCollabTypeLabel(activity.type)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.proposerId?.name} → {activity.recipientId?.name}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(activity.updatedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        )}

        {/* All Collaborations Tab */}
        {activeTab === 'all-collaborations' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">All Collaborations</h2>
              <p className="text-gray-600 dark:text-gray-400">View and manage all collaboration requests in the system</p>
            </div>

            {/* Filters */}
            <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select
                    value={proposalFilters.status}
                    onChange={(e) => {
                      const newFilters = { ...proposalFilters, status: e.target.value };
                      setProposalFilters(newFilters);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending_admin_review">Pending Review</option>
                    <option value="approved_delivered">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="counter_pending_review">Counter Pending</option>
                    <option value="counter_delivered">Counter Delivered</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="declined">Declined</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select
                    value={proposalFilters.type}
                    onChange={(e) => {
                      const newFilters = { ...proposalFilters, type: e.target.value };
                      setProposalFilters(newFilters);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Types</option>
                    <option value="communityToVenue">Community → Venue</option>
                    <option value="communityToBrand">Community → Brand</option>
                    <option value="brandToCommunity">Brand → Community</option>
                    <option value="venueToCommunity">Venue → Community</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Collaborations List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : allCollaborations.length === 0 ? (
              <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No collaborations found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allCollaborations.map((collab) => (
                  <div key={collab._id} className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(collab.status)}
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {getCollabTypeLabel(collab.type)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {getTimeSince(collab.createdAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Proposer */}
                      <div className="flex items-center space-x-3">
                        <img
                          src={collab.proposerId?.profilePicture || '/default-avatar.png'}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">From</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {collab.proposerId?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {collab.proposerType}
                          </p>
                        </div>
                      </div>

                      {/* Recipient */}
                      <div className="flex items-center space-x-3">
                        <img
                          src={collab.recipientId?.profilePicture || '/default-avatar.png'}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">To</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {collab.recipientId?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {collab.recipientType}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                        <p className="text-gray-900 dark:text-white">{formatDate(collab.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Updated:</span>
                        <p className="text-gray-900 dark:text-white">{formatDate(collab.updatedAt)}</p>
                      </div>
                      {collab.hasCounter && (
                        <div>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">Has Counter</span>
                        </div>
                      )}
                      {collab.complianceFlags && collab.complianceFlags.length > 0 && (
                        <div>
                          {getComplianceRiskBadge(collab.complianceFlags)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3">
                      {(collab.status === 'counter_delivered' || collab.status === 'confirmed' || collab.status === 'completed') && (
                        <button
                          onClick={() => navigate(`/admin/collaborations/${collab._id}/workspace/spectate`)}
                          className="px-4 py-2 text-white rounded-lg transition-colors flex items-center font-medium"
                          style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Spectate
                        </button>
                      )}
                      <button
                        onClick={() => fetchProposalDetails(collab._id)}
                        className="px-4 py-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 border border-primary-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Organizers Tab */}
        {activeTab === 'organizers' && (
          <div>
            {currentView === 'list' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Community Organizers</h2>
                  <p className="text-gray-600 dark:text-gray-400">Manage community organizers, verify KYC, and track events</p>
                </div>

                {/* Filters */}
                <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                      <input
                        type="text"
                        placeholder="Name, email, community..."
                        value={organizerFilters.search}
                        onChange={(e) => {
                          setOrganizerFilters({ ...organizerFilters, search: e.target.value });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') fetchOrganizers(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-zinc-800 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                      <input
                        type="text"
                        placeholder="Filter by city..."
                        value={organizerFilters.city}
                        onChange={(e) => {
                          setOrganizerFilters({ ...organizerFilters, city: e.target.value });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') fetchOrganizers(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-zinc-800 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">KYC Status</label>
                      <select
                        value={organizerFilters.verified}
                        onChange={(e) => {
                          setOrganizerFilters({ ...organizerFilters, verified: e.target.value });
                          fetchOrganizers(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-zinc-800 text-white"
                      >
                        <option value="">All</option>
                        <option value="true">Verified</option>
                        <option value="false">Unverified</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchOrganizers(1)}
                    className="mt-4 px-6 py-2 text-white rounded-lg font-semibold transition-all hover:scale-105 hover:opacity-90"
                    style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                  >
                    Apply Filters
                  </button>
                </div>

                {/* Organizers Grid */}
                {organizers.length > 0 ? (
                  <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organizers.map((organizer) => (
                      <div key={organizer._id} className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              {organizer.logo ? (
                                <img src={organizer.logo} alt={organizer.communityName} className="w-16 h-16 rounded-full object-cover" />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                                  {organizer.communityName?.charAt(0) || organizer.name?.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h3 className="font-bold text-white">{organizer.communityName}</h3>
                                <p className="text-sm text-gray-400">{organizer.name}</p>
                              </div>
                            </div>
                            {organizer.kycVerified ? (
                              <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                                ✓ Verified
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                                ⚠ Unverified
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-sm mb-4">
                            <p className="text-gray-400">
                              📍 {organizer.city}
                            </p>
                            <p className="text-gray-400">
                              📧 {organizer.email}
                            </p>
                            {organizer.phoneNumber && (
                              <p className="text-gray-400">
                                📞 {organizer.phoneNumber}
                              </p>
                            )}
                            <p className="text-gray-400">
                              🏷️ {organizer.category}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-zinc-800/50 border border-gray-700 rounded-lg">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-white">{organizer.stats.totalEvents}</p>
                              <p className="text-xs text-gray-400">Events</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">{organizer.stats.activeEvents}</p>
                              <p className="text-xs text-gray-400">Active</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-400">{organizer.stats.totalSpotsBooked}</p>
                              <p className="text-xs text-gray-400">Spots</p>
                            </div>
                          </div>

                          <button
                            onClick={() => fetchOrganizerDetails(organizer._id)}
                            className="w-full px-4 py-2 text-white rounded-lg font-semibold transition-all hover:scale-105 hover:opacity-90"
                            style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                          >
                            View Details →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {organizerPagination.pages > 1 && (
                    <div className="flex items-center justify-center space-x-4 mt-8">
                      <button
                        onClick={() => fetchOrganizers(organizerPagination.page - 1)}
                        disabled={organizerPagination.page <= 1}
                        className="px-4 py-2 rounded-lg text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                        style={{ background: organizerPagination.page <= 1 ? '#3A3A52' : 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                      >
                        ← Previous
                      </button>
                      <span className="text-gray-400 text-sm">
                        Page {organizerPagination.page} of {organizerPagination.pages} ({organizerPagination.total} organizers)
                      </span>
                      <button
                        onClick={() => fetchOrganizers(organizerPagination.page + 1)}
                        disabled={organizerPagination.page >= organizerPagination.pages}
                        className="px-4 py-2 rounded-lg text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                        style={{ background: organizerPagination.page >= organizerPagination.pages ? '#3A3A52' : 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No organizers found</p>
                  </div>
                )}
              </div>
            )}

            {currentView === 'organizer-details' && selectedOrganizer && (
              <div>
                {/* Header */}
                <div className="mb-6">
                  <button
                    onClick={handleBackToOrganizers}
                    className="mb-4 px-4 py-2 text-purple-600 hover:text-purple-800 flex items-center space-x-2"
                  >
                    <span>←</span>
                    <span>Back to Organizers</span>
                  </button>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      {selectedOrganizer.communityProfile.logo ? (
                        <img src={selectedOrganizer.communityProfile.logo} alt={selectedOrganizer.communityProfile.communityName} className="w-20 h-20 rounded-full object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold">
                          {selectedOrganizer.communityProfile.communityName?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedOrganizer.communityProfile.communityName}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{selectedOrganizer.organizer.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">{selectedOrganizer.organizer.email}</p>
                      </div>
                    </div>
                    {selectedOrganizer.payoutDetails.isVerified ? (
                      <span className="px-4 py-2 text-sm font-semibold bg-green-100 text-green-800 rounded-full">
                        ✓ KYC Verified
                      </span>
                    ) : (
                      <span className="px-4 py-2 text-sm font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                        ⚠ KYC Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm text-gray-400">Total Events</p>
                    <p className="text-3xl font-bold text-white">{selectedOrganizer.eventStats.total}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm text-gray-400">Total Collected (User Paid)</p>
                    <p className="text-3xl font-bold text-cyan-400">₹{((selectedOrganizer.revenueStats.totalUserPaid || selectedOrganizer.revenueStats.totalRevenue) / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-gray-500 mt-1">Includes GST + Platform Fees</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm text-gray-400">Base Revenue (Organizer Share)</p>
                    <p className="text-3xl font-bold text-green-600">₹{(selectedOrganizer.revenueStats.totalRevenue / 1000).toFixed(1)}k</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm text-gray-400">Spots Booked</p>
                    <p className="text-3xl font-bold text-purple-400">{selectedOrganizer.revenueStats.totalSpotsBooked}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm text-gray-400">Pending Settlement</p>
                    <p className="text-3xl font-bold text-orange-600">₹{(selectedOrganizer.revenueStats.pendingSettlement / 1000).toFixed(1)}k</p>
                  </div>
                </div>

                {/* Settlement & Cashfree Charges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm text-gray-400">Total Settled to Bank</p>
                    <p className="text-3xl font-bold text-green-400">₹{((selectedOrganizer.revenueStats.settledAmount || 0) / 1000).toFixed(1)}k</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm text-gray-400">Cashfree Charges Deducted</p>
                    <p className="text-3xl font-bold text-red-400">₹{((selectedOrganizer.revenueStats.totalCashfreeDeducted || 0)).toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Fee: ₹{((selectedOrganizer.revenueStats.cashfreeServiceCharge || 0)).toFixed(2)} + Tax: ₹{((selectedOrganizer.revenueStats.cashfreeServiceTax || 0)).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm text-gray-400">Net Settled (After Charges)</p>
                    <p className="text-3xl font-bold text-emerald-400">₹{(((selectedOrganizer.revenueStats.settledAmount || 0)) / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-gray-500 mt-1">Amount received in organizer's bank</p>
                  </div>
                </div>

                {/* KYC Details Section */}
                <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">KYC & Payout Details</h3>
                    {!selectedOrganizer.payoutDetails.isVerified && (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleVerifyKYC(selectedOrganizer.organizer._id, true)}
                          className="px-4 py-2 text-white rounded-lg font-semibold transition-all hover:scale-105 hover:opacity-90"
                          style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                        >
                          ✓ Verify KYC
                        </button>
                        <button
                          onClick={() => handleVerifyKYC(selectedOrganizer.organizer._id, false)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          ✗ Reject KYC
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400">Account Holder Name</p>
                      <p className="font-semibold text-white">{selectedOrganizer.payoutDetails.accountHolderName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Account Number</p>
                      <p className="font-semibold text-white">{selectedOrganizer.payoutDetails.accountNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">IFSC Code</p>
                      <p className="font-semibold text-white">{selectedOrganizer.payoutDetails.ifscCode || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">UPI ID</p>
                      <p className="font-semibold text-white">{selectedOrganizer.payoutDetails.upiId || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">GST Number</p>
                      <p className="font-semibold text-white">{selectedOrganizer.payoutDetails.gstNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Billing Address</p>
                      <p className="font-semibold text-white">{selectedOrganizer.payoutDetails.billingAddress || 'Not provided'}</p>
                    </div>
                    {selectedOrganizer.payoutDetails.idProofDocument && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-400 mb-2">ID Proof Document</p>
                        <a
                          href={selectedOrganizer.payoutDetails.idProofDocument}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-white rounded-lg hover:opacity-90 inline-block font-semibold"
                          style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                        >
                          View Document →
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Community Profile */}
                <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6 mb-6">
                  <h3 className="text-xl font-bold text-white mb-4">Community Profile</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">Description</p>
                      <p className="text-white">{selectedOrganizer.communityProfile.communityDescription || 'No description'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">City</p>
                        <p className="font-semibold text-white">{selectedOrganizer.communityProfile.city}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Member Count</p>
                        <p className="font-semibold text-white">{selectedOrganizer.communityProfile.memberCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Community Type</p>
                        <p className="font-semibold text-white capitalize">{selectedOrganizer.communityProfile.communityType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Categories</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedOrganizer.communityProfile.category?.map((cat, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {selectedOrganizer.communityProfile.socialLinks && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Social Links</p>
                        <div className="flex space-x-4">
                          {selectedOrganizer.communityProfile.socialLinks.instagram && (
                            <a href={selectedOrganizer.communityProfile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                              Instagram
                            </a>
                          )}
                          {selectedOrganizer.communityProfile.socialLinks.facebook && (
                            <a href={selectedOrganizer.communityProfile.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                              Facebook
                            </a>
                          )}
                          {selectedOrganizer.communityProfile.socialLinks.website && (
                            <a href={selectedOrganizer.communityProfile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Events Section */}
                <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Hosted Events</h3>
                  {organizerEvents.length > 0 ? (
                    <div className="space-y-4">
                      {organizerEvents.map((event) => (
                        <div key={event._id} className="p-4 border border-gray-700 rounded-lg hover:border-purple-400 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-white mb-2">{event.title}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-3">
                                <div>
                                  <p className="text-gray-400">Date</p>
                                  <p className="font-semibold text-white">{new Date(event.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Status</p>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    event.status === 'published' ? 'bg-green-100 text-green-800' :
                                    event.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {event.status}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-gray-400">Ticket Price</p>
                                  <p className="font-semibold text-purple-400">{event.price?.amount > 0 ? `₹${event.price.amount}` : 'Free'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Spots Booked</p>
                                  <p className="font-semibold text-white">{event.revenue?.totalSpotsBooked || event.currentParticipants || 0} / {event.maxParticipants}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Base Revenue</p>
                                  <p className="font-semibold text-green-600">₹{(event.revenue?.totalRevenue / 1000 || 0).toFixed(1)}k</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                                <span>📍 {event.location?.city || 'TBA'}</span>
                                <span>•</span>
                                <span>💰 User Paid: ₹{(event.revenue?.totalUserPaid / 1000 || 0).toFixed(1)}k</span>
                                <span>•</span>
                                <span>🏦 Settled: ₹{(event.revenue?.settledRevenue / 1000 || 0).toFixed(1)}k</span>
                                {event.revenue?.cashfreeChargesDeducted > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>💳 Cashfree: ₹{event.revenue.cashfreeChargesDeducted.toFixed(0)}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>✅ {event.revenue?.checkedInTickets || 0} checked-in</span>
                              </div>
                            </div>
                            <button
                              onClick={() => fetchEventDetails(event._id)}
                              className="ml-4 px-4 py-2 text-white rounded-lg font-semibold transition-all hover:scale-105 hover:opacity-90"
                              style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">No events found</p>
                  )}
                </div>
              </div>
            )}

            {currentView === 'event-details' && eventDetails && (
              <div>
                {/* Header */}
                <div className="mb-6">
                  <button
                    onClick={handleBackToOrganizerDetails}
                    className="mb-4 px-4 py-2 text-purple-600 hover:text-purple-800 flex items-center space-x-2"
                  >
                    <span>←</span>
                    <span>Back to Organizer</span>
                  </button>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{eventDetails.event.title}</h2>
                      <p className="text-gray-600 dark:text-gray-400">{eventDetails.event.description?.substring(0, 150)}...</p>
                      <div className="flex items-center space-x-4 mt-4 text-sm">
                        <span className="flex items-center space-x-2 text-white">
                          <span>📅</span>
                          <span>{new Date(eventDetails.event.date).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-2 text-white">
                          <span>📍</span>
                          <span>{eventDetails.event.location?.city}</span>
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          eventDetails.event.status === 'live' ? 'bg-green-100 text-green-800' :
                          eventDetails.event.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {eventDetails.event.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadAuditReport(eventDetails.event._id, eventDetails.event.title)}
                      className="px-4 py-2 text-white rounded-lg font-semibold transition-all hover:scale-105 hover:opacity-90"
                      style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                    >
                      📄 Download Audit Report
                    </button>
                  </div>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-400">Ticket Price</p>
                    <p className="text-2xl font-bold text-purple-400">{eventDetails.event.price?.amount > 0 ? `₹${eventDetails.event.price.amount}` : 'Free'}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-400">Total Spots Booked</p>
                    <p className="text-2xl font-bold text-white">{eventDetails.analytics.totalSpotsBooked || eventDetails.analytics.totalTickets}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-400">Total Collected (User Paid)</p>
                    <p className="text-2xl font-bold text-cyan-400">₹{((eventDetails.analytics.totalUserPaid || eventDetails.analytics.totalRevenue) / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-gray-500">Includes GST + Fees</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-400">Base Revenue (Organizer Share)</p>
                    <p className="text-2xl font-bold text-green-600">₹{(eventDetails.analytics.totalRevenue / 1000).toFixed(1)}k</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-400">Settled to Bank</p>
                    <p className="text-2xl font-bold text-blue-600">₹{(eventDetails.analytics.settledRevenue / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-gray-500">{eventDetails.analytics.settlementPercentage}%</p>
                    {eventDetails.analytics.capturedRevenue > 0 && eventDetails.analytics.settledRevenue === 0 && (
                      <p className="text-xs text-yellow-500 mt-1">₹{(eventDetails.analytics.capturedRevenue / 1000).toFixed(1)}k captured</p>
                    )}
                  </div>
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-400">Cashfree Charges</p>
                    <p className="text-2xl font-bold text-red-400">₹{(eventDetails.analytics.cashfreeCharges?.totalDeducted || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      Fee: ₹{(eventDetails.analytics.cashfreeCharges?.serviceCharge || 0).toFixed(2)} + Tax: ₹{(eventDetails.analytics.cashfreeCharges?.serviceTax || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-400">Check-in Rate</p>
                    <p className="text-2xl font-bold text-purple-400">{eventDetails.analytics.checkInRate}%</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-400">Issues</p>
                    <p className={`text-2xl font-bold ${eventDetails.hasIssues ? 'text-red-600' : 'text-green-600'}`}>
                      {eventDetails.hasIssues ? '⚠️ Yes' : '✓ None'}
                    </p>
                  </div>
                </div>

                {/* Ticket Status Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Ticket Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Active</span>
                        <span className="font-bold text-white">{eventDetails.analytics.ticketsByStatus.active}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Checked In</span>
                        <span className="font-bold text-green-600">{eventDetails.analytics.ticketsByStatus.checked_in}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Cancelled</span>
                        <span className="font-bold text-red-600">{eventDetails.analytics.ticketsByStatus.cancelled}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Refunded</span>
                        <span className="font-bold text-orange-600">{eventDetails.analytics.ticketsByStatus.refunded}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Settlement Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Settled</span>
                        <span className="font-bold text-green-600">{eventDetails.analytics.settlementStats.settled}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Captured</span>
                        <span className="font-bold text-blue-600">{eventDetails.analytics.settlementStats.captured}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Pending</span>
                        <span className="font-bold text-yellow-600">{eventDetails.analytics.settlementStats.pending}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Failed</span>
                        <span className="font-bold text-red-600">{eventDetails.analytics.settlementStats.failed}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Change Timeline */}
                {((eventDetails.priceChangeHistory && eventDetails.priceChangeHistory.length > 0) || 
                  (eventDetails.pricingTimeline && eventDetails.pricingTimeline.enabled)) && (
                  <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6 mb-6">
                    <h3 className="text-lg font-bold text-white mb-4">💰 Price Change Timeline</h3>
                    
                    {/* Scheduled Pricing Tiers */}
                    {eventDetails.pricingTimeline?.enabled && eventDetails.pricingTimeline.tiers?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Scheduled Price Tiers</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {eventDetails.pricingTimeline.tiers.map((tier, index) => {
                            // IST-aware date comparison for tier status
                            const IST_OFFSET = 5.5 * 60 * 60 * 1000;
                            const toISTDate = (d) => new Date(new Date(d).getTime() + IST_OFFSET).toISOString().split('T')[0];
                            const todayIST = toISTDate(new Date());
                            const startIST = toISTDate(tier.startDate);
                            const endIST = toISTDate(tier.endDate);
                            const isActive = todayIST >= startIST && todayIST <= endIST;
                            const isPast = todayIST > endIST;
                            return (
                              <div key={index} className={`p-4 rounded-lg border ${
                                isActive ? 'border-green-500/40 bg-green-900/10' :
                                isPast ? 'border-gray-700 bg-gray-800/30 opacity-60' :
                                'border-blue-500/30 bg-blue-900/10'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-white">{tier.label || `Tier ${index + 1}`}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    isActive ? 'bg-green-500/20 text-green-400' :
                                    isPast ? 'bg-gray-600/20 text-gray-400' :
                                    'bg-blue-500/20 text-blue-400'
                                  }`}>
                                    {isActive ? 'Active' : isPast ? 'Ended' : 'Upcoming'}
                                  </span>
                                </div>
                                <div className="text-xl font-bold text-white mb-1">₹{tier.price}</div>
                                <div className="text-xs text-gray-400 mb-2">
                                  {new Date(tier.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} → {new Date(tier.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-400">{tier.spotsBought || 0} spots</span>
                                  <span className="text-green-400 font-medium">₹{(tier.revenue || 0).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Price Change History */}
                    {eventDetails.priceChangeHistory && eventDetails.priceChangeHistory.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Price Change History</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-zinc-800">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date & Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Previous</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">New Price</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Reason</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Spots at Prev</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                              {eventDetails.priceChangeHistory.map((change, index) => (
                                <tr key={index} className="hover:bg-zinc-800">
                                  <td className="px-4 py-3 text-sm text-white">
                                    {new Date(change.changedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-300">₹{change.previousPrice}</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-white">
                                    ₹{change.newPrice}
                                    {change.newPrice > change.previousPrice ? ' ↑' : change.newPrice < change.previousPrice ? ' ↓' : ''}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      change.reason === 'initial_creation' ? 'bg-blue-500/20 text-blue-400' :
                                      change.reason === 'timeline_automatic' ? 'bg-purple-500/20 text-purple-400' :
                                      'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                      {change.reason === 'initial_creation' ? 'Created' : 
                                       change.reason === 'timeline_automatic' ? 'Auto (Timeline)' : 'Manual Edit'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-300">{change.spotsBookedAtPrevPrice}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Attendees List */}
                <div className="bg-zinc-900/50 border border-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Attendees ({eventDetails.attendees.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-zinc-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ticket #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Booking Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ticket Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Coupon Used</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Per Ticket Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Total Ticket Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                            Final Amount Paid
                            <span className="block text-[10px] normal-case text-gray-500 font-normal">(inc. Fees & GST)</span>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Settlement</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Reconciliation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {[...eventDetails.attendees].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)).map((attendee) => (
                          <tr key={attendee.ticketNumber} className="hover:bg-zinc-800">
                            <td className="px-4 py-3 text-sm font-mono text-white">
                              {attendee.ticketNumber}
                              {attendee.quantity > 1 && (
                                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full">
                                  × {attendee.quantity}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <p className="font-medium text-white">{attendee.user?.name}</p>
                                <p className="text-xs text-gray-500">{attendee.user?.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-white">
                              <div>
                                {new Date(attendee.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(attendee.purchaseDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {attendee.orderId ? (
                                <div className="font-mono text-xs text-blue-400 truncate max-w-[150px]" title={attendee.orderId}>
                                  {attendee.orderId.substring(0, 18)}...
                                </div>
                              ) : (
                                <span className="text-gray-600 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 text-xs font-medium bg-gray-700/50 text-gray-300 rounded-full">
                                {attendee.ticketType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {attendee.couponCode ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-300 rounded-full inline-block w-fit">
                                    {attendee.couponCode}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    -₹{attendee.couponDiscount || 0}
                                    {attendee.discountType === 'percentage' ? ` (${attendee.discountValue}%)` : ''}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-600 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="font-semibold text-white">
                                ₹{attendee.priceAtPurchase || attendee.price}
                              </div>
                              <div className="text-xs text-gray-500">Per spot</div>
                              {attendee.pricingTimelineTier && (
                                <div className="text-xs text-purple-400">{attendee.pricingTimelineTier}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="text-white">
                                ₹{attendee.basePrice || ((attendee.priceAtPurchase || attendee.price) * (attendee.quantity || 1))}
                              </div>
                              {(attendee.quantity || 1) > 1 && (
                                <div className="text-xs text-gray-500">
                                  ₹{attendee.priceAtPurchase || attendee.price} × {attendee.quantity} spots
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="font-semibold text-green-400">
                                ₹{attendee.totalPaid || attendee.price}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                attendee.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                                attendee.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {attendee.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                attendee.settlementStatus === 'settled' ? 'bg-green-100 text-green-800' :
                                attendee.settlementStatus === 'captured' ? 'bg-blue-100 text-blue-800' :
                                attendee.settlementStatus === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {attendee.settlementStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                attendee.reconciliationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                                attendee.reconciliationStatus === 'mismatch' ? 'bg-red-100 text-red-800' :
                                attendee.reconciliationStatus === 'manual_review' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {attendee.reconciliationStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Marketing Tab */}
        {activeTab === 'marketing' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">📱 WhatsApp Marketing</h2>
              <p className="text-gray-400">Send promotional event messages to targeted users via WhatsApp</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Filters */}
              <div className="lg:col-span-2 space-y-6">
                {/* Step 1: Audience Selection */}
                <div className="bg-zinc-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Step 1: Select Target Audience</h3>
                  
                  <div className="space-y-3">
                    {[
                      { value: 'all_b2c', label: 'All B2C Users', desc: 'Every registered user with a phone number' },
                      { value: 'organizer_specific', label: 'Organizer-Specific Users', desc: 'Users who previously booked events from a specific organizer' },
                      { value: 'category_interests', label: 'Category Interests', desc: 'Users who selected specific interest categories in their profile' },
                    ].map(opt => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                          marketingAudienceType === opt.value
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-700 bg-white/5 hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="audienceType"
                          value={opt.value}
                          checked={marketingAudienceType === opt.value}
                          onChange={(e) => {
                            setMarketingAudienceType(e.target.value);
                            setMarketingAudiencePreview(null);
                            setMarketingResult(null);
                          }}
                          className="mt-1"
                          style={{ accentColor: '#7878E9' }}
                        />
                        <div>
                          <p className="text-white font-medium text-sm">{opt.label}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Organizer Dropdown with Search */}
                  {marketingAudienceType === 'organizer_specific' && (
                    <div className="mt-4 relative" ref={orgDropdownRef}>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Select Organizer</label>
                      <div
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-700 text-white text-sm cursor-pointer flex items-center justify-between"
                        onClick={() => setShowOrganizerDropdown(!showOrganizerDropdown)}
                      >
                        <span className={marketingOrganizerId ? 'text-white' : 'text-gray-400'}>
                          {marketingOrganizerId
                            ? (() => {
                                const sel = marketingOrganizers.find(o => o._id === marketingOrganizerId);
                                return sel ? (sel.communityName || sel.name) : '-- Choose an organizer --';
                              })()
                            : '-- Choose an organizer --'}
                        </span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${showOrganizerDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>

                      {showOrganizerDropdown && (
                        <div className="absolute z-50 mt-1 w-full rounded-lg bg-zinc-800 border border-gray-700 shadow-xl max-h-72 overflow-hidden">
                          <div className="p-2 border-b border-gray-700">
                            <input
                              type="text"
                              placeholder="Search organizer..."
                              value={marketingOrganizerSearch}
                              onChange={(e) => setMarketingOrganizerSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-3 py-2 rounded-md bg-white/5 border border-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                              autoFocus
                            />
                          </div>
                          <div className="overflow-y-auto max-h-56">
                            {marketingOrganizers
                              .filter(org => {
                                if (!marketingOrganizerSearch) return true;
                                const search = marketingOrganizerSearch.toLowerCase();
                                return (org.communityName || '').toLowerCase().includes(search) ||
                                       (org.name || '').toLowerCase().includes(search);
                              })
                              .map(org => (
                                <div
                                  key={org._id}
                                  onClick={() => {
                                    setMarketingOrganizerId(org._id);
                                    setMarketingAudiencePreview(null);
                                    setShowOrganizerDropdown(false);
                                    setMarketingOrganizerSearch('');
                                  }}
                                  className={`px-4 py-2.5 cursor-pointer text-sm transition-colors hover:bg-white/10 ${
                                    marketingOrganizerId === org._id ? 'bg-purple-500/20 text-white' : 'text-gray-300'
                                  }`}
                                >
                                  <span className="font-medium">{org.communityName || org.name}</span>
                                  <span className="text-gray-500 ml-2">— {org.stats?.totalEvents || 0} events, {org.stats?.totalSpotsBooked || 0} spots</span>
                                </div>
                              ))}
                            {marketingOrganizers.filter(org => {
                              if (!marketingOrganizerSearch) return true;
                              const search = marketingOrganizerSearch.toLowerCase();
                              return (org.communityName || '').toLowerCase().includes(search) ||
                                     (org.name || '').toLowerCase().includes(search);
                            }).length === 0 && (
                              <p className="px-4 py-3 text-gray-500 text-sm text-center">No organizers found</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category Checkboxes */}
                  {marketingAudienceType === 'category_interests' && (
                    <div className="mt-4">
                      <label className="block text-gray-300 text-sm font-medium mb-2">Select Categories</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {MARKETING_CATEGORIES.map(cat => (
                          <label
                            key={cat}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-sm transition-colors ${
                              marketingCategories.includes(cat)
                                ? 'border-purple-500 bg-purple-500/10 text-white'
                                : 'border-gray-700 bg-white/5 text-gray-300 hover:border-gray-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={marketingCategories.includes(cat)}
                              onChange={(e) => {
                                setMarketingCategories(prev =>
                                  e.target.checked ? [...prev, cat] : prev.filter(c => c !== cat)
                                );
                                setMarketingAudiencePreview(null);
                              }}
                              style={{ accentColor: '#7878E9' }}
                            />
                            {cat}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub-Filters: Age, Gender, City */}
                  <div className="mt-5 border-t border-gray-700 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSubFilters(prev => !prev)}
                      className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                      <svg className={`w-4 h-4 transition-transform ${showSubFilters ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      Refine Audience
                      {(marketingAgeMin || marketingAgeMax || marketingGender || marketingCity) && (
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                          {[marketingAgeMin || marketingAgeMax ? 'age' : '', marketingGender, marketingCity].filter(Boolean).length} active
                        </span>
                      )}
                    </button>

                    {showSubFilters && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Age Range - Manual Inputs */}
                        <div>
                          <label className="block text-gray-300 text-xs font-medium mb-1.5">Age Range</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Min"
                              min="1"
                              max="100"
                              value={marketingAgeMin}
                              onChange={(e) => { setMarketingAgeMin(e.target.value); setMarketingAudiencePreview(null); }}
                              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <span className="text-gray-500 text-sm">–</span>
                            <input
                              type="number"
                              placeholder="Max"
                              min="1"
                              max="100"
                              value={marketingAgeMax}
                              onChange={(e) => { setMarketingAgeMax(e.target.value); setMarketingAudiencePreview(null); }}
                              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        {/* Gender */}
                        <div>
                          <label className="block text-gray-300 text-xs font-medium mb-1.5">Gender</label>
                          <select
                            value={marketingGender}
                            onChange={(e) => { setMarketingGender(e.target.value); setMarketingAudiencePreview(null); }}
                            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none"
                          >
                            <option value="" className="bg-zinc-800">All Genders</option>
                            <option value="Male" className="bg-zinc-800">Male</option>
                            <option value="Female" className="bg-zinc-800">Female</option>
                            <option value="Non-binary" className="bg-zinc-800">Non-binary</option>
                          </select>
                        </div>

                        {/* City */}
                        <div>
                          <label className="block text-gray-300 text-xs font-medium mb-1.5">City</label>
                          <CityDropdown
                            value={marketingCity}
                            onChange={(val) => { setMarketingCity(val); setMarketingAudiencePreview(null); }}
                            placeholder="All Cities"
                          />
                        </div>
                      </div>
                    )}

                    {/* Clear sub-filters */}
                    {showSubFilters && (marketingAgeMin || marketingAgeMax || marketingGender || marketingCity) && (
                      <button
                        type="button"
                        onClick={() => { setMarketingAgeMin(''); setMarketingAgeMax(''); setMarketingGender(''); setMarketingCity(''); setMarketingAudiencePreview(null); }}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-300 underline"
                      >
                        Clear all sub-filters
                      </button>
                    )}
                  </div>

                  {/* Preview Button */}
                  <button
                    onClick={fetchMarketingAudience}
                    disabled={
                      marketingLoading ||
                      (marketingAudienceType === 'organizer_specific' && !marketingOrganizerId) ||
                      (marketingAudienceType === 'category_interests' && marketingCategories.length === 0)
                    }
                    className="mt-4 px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-40 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                  >
                    {marketingLoading ? 'Estimating...' : 'Preview Audience'}
                  </button>

                  {/* Audience Preview */}
                  {marketingAudiencePreview && (
                    <div className="mt-4 p-4 rounded-lg bg-green-900/20 border border-green-700/40">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-green-400 font-semibold text-lg">
                          🎯 {marketingAudiencePreview.totalUsers} user{marketingAudiencePreview.totalUsers !== 1 ? 's' : ''} matched
                        </p>
                        {marketingAudiencePreview.totalUsers > 0 && (
                          <button
                            onClick={handleExportAudienceCSV}
                            className="px-3 py-1.5 rounded-lg bg-white/10 border border-gray-600 text-gray-200 text-xs font-medium hover:bg-white/20 transition-colors flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Export CSV
                          </button>
                        )}
                      </div>
                      {marketingAudiencePreview.sampleUsers?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-gray-400 text-xs font-medium">Sample users:</p>
                          {marketingAudiencePreview.sampleUsers.map((u, i) => (
                            <p key={i} className="text-gray-300 text-xs">
                              {u.name} • {u.phone}{u.age ? ` • ${u.age}y` : ''}{u.gender ? ` • ${u.gender}` : ''}{u.city ? ` • ${u.city}` : ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2: Select Event */}
                <div className="bg-zinc-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Step 2: Select Event to Promote</h3>
                  
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={marketingEventSearch}
                    onChange={(e) => setMarketingEventSearch(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-700 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                  />

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {marketingEvents
                      .filter(e => !marketingEventSearch || e.title.toLowerCase().includes(marketingEventSearch.toLowerCase()))
                      .map(evt => (
                        <label
                          key={evt._id}
                          className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                            marketingEventId === evt._id
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-gray-700 bg-white/5 hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name="marketingEvent"
                            value={evt._id}
                            checked={marketingEventId === evt._id}
                            onChange={() => setMarketingEventId(evt._id)}
                            style={{ accentColor: '#7878E9' }}
                          />
                          {evt.image && (
                            <img src={evt.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{evt.title}</p>
                            <p className="text-gray-400 text-xs">
                              {new Date(evt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {evt.organizerName}
                            </p>
                            <p className="text-gray-500 text-xs truncate">{evt.venue}</p>
                          </div>
                        </label>
                      ))}
                    {marketingEvents.length === 0 && (
                      <p className="text-gray-500 text-sm py-4 text-center">No upcoming events found</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Summary & Send */}
              <div className="space-y-6">
                <div className="bg-zinc-900 border border-gray-800 rounded-lg p-6 sticky top-24">
                  <h3 className="text-lg font-semibold text-white mb-4">Campaign Summary</h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Audience</span>
                      <span className="text-white font-medium">
                        {marketingAudienceType === 'all_b2c' ? 'All B2C Users' :
                         marketingAudienceType === 'organizer_specific' ? 'Organizer Specific' :
                         'Category Interests'}
                      </span>
                    </div>
                    {marketingAudiencePreview && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Recipients</span>
                        <span className="text-green-400 font-bold">{marketingAudiencePreview.totalUsers}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Event</span>
                      <span className="text-white font-medium truncate ml-4 max-w-[160px]">
                        {marketingEvents.find(e => e._id === marketingEventId)?.title || 'Not selected'}
                      </span>
                    </div>
                    {marketingAudiencePreview && marketingAudiencePreview.totalUsers > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Est. Cost</span>
                        <span className="text-yellow-400 font-medium">
                          ~₹{(marketingAudiencePreview.totalUsers * MSG91_MARKETING_RATE).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {marketingAudiencePreview && marketingAudiencePreview.totalUsers > 0 && (
                      <p className="text-gray-500 text-xs mt-1">₹{MSG91_MARKETING_RATE}/msg — Marketing template rate</p>
                    )}
                    {/* Sub-filter summary */}
                    {(marketingAgeMin || marketingAgeMax || marketingGender || marketingCity) && (
                      <div className="pt-2 border-t border-gray-700">
                        <p className="text-gray-500 text-xs font-medium mb-1">Filters</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(marketingAgeMin || marketingAgeMax) && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-xs">{marketingAgeMin || '?'}–{marketingAgeMax || '?'}y</span>
                          )}
                          {marketingGender && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-xs">{marketingGender}</span>
                          )}
                          {marketingCity && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-xs">{marketingCity}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Event Preview */}
                  {marketingEventId && (() => {
                    const sel = marketingEvents.find(e => e._id === marketingEventId);
                    if (!sel) return null;
                    return (
                      <div className="mt-4 p-3 rounded-lg bg-white/5 border border-gray-700">
                        {sel.image && (
                          <img src={sel.image} alt="" className="w-full h-32 rounded-lg object-cover mb-3" />
                        )}
                        <p className="text-white text-sm font-semibold">{sel.title}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(sel.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-gray-400 text-xs">{sel.startTime} - {sel.endTime} • {sel.venue}</p>
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => setShowMarketingConfirm(true)}
                    disabled={!marketingEventId || !marketingAudiencePreview || marketingAudiencePreview.totalUsers === 0 || marketingSending}
                    className="mt-6 w-full py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-40 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                  >
                    {marketingSending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Sending...
                      </span>
                    ) : '📤 Send WhatsApp Campaign'}
                  </button>

                  {/* Result */}
                  {marketingResult && (
                    <div className={`mt-4 p-4 rounded-lg border ${
                      marketingResult.success
                        ? 'bg-green-900/20 border-green-700/40'
                        : 'bg-red-900/20 border-red-700/40'
                    }`}>
                      {marketingResult.success ? (
                        <>
                          <p className="text-green-400 font-semibold">✅ Campaign Sent!</p>
                          <p className="text-gray-300 text-sm mt-1">
                            {marketingResult.sent} sent, {marketingResult.failed} failed out of {marketingResult.total} users
                          </p>
                          <p className="text-gray-400 text-xs mt-1">Event: {marketingResult.eventTitle}</p>
                        </>
                      ) : (
                        <p className="text-red-400 font-semibold">❌ {marketingResult.error || 'Failed to send campaign'}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmation Modal */}
            {showMarketingConfirm && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-zinc-900 border border-gray-700 rounded-lg max-w-md w-full p-6">
                  <h3 className="text-lg font-bold text-white mb-3">Confirm WhatsApp Campaign</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    You are about to send a WhatsApp marketing message about{' '}
                    <strong className="text-white">{marketingEvents.find(e => e._id === marketingEventId)?.title}</strong>{' '}
                    to <strong className="text-green-400">{marketingAudiencePreview?.totalUsers}</strong> users.
                  </p>
                  <p className="text-yellow-400 text-xs mb-6">
                    ⚠️ Estimated cost: ~₹{((marketingAudiencePreview?.totalUsers || 0) * MSG91_MARKETING_RATE).toFixed(2)} ({marketingAudiencePreview?.totalUsers} × ₹{MSG91_MARKETING_RATE}/msg — Marketing template rate)
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowMarketingConfirm(false)}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendMarketing}
                      className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium"
                      style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                    >
                      📤 Send Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Proposal Details Modal */}
      {showDetailsModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-gray-800 rounded-lg max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Complete Collaboration Details
                  {selectedProposal.hasCounter && <span className="ml-2 text-sm text-purple-600 dark:text-purple-400">(with Counter)</span>}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {selectedProposal._id}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedProposal(null);
                  setSelectedCounter(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Status and Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusBadge(selectedProposal.status)}
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getCollabTypeLabel(selectedProposal.type)}
                  </span>
                </div>
                {selectedProposal.complianceFlags && selectedProposal.complianceFlags.length > 0 && (
                  <>
                    {getComplianceRiskBadge(selectedProposal.complianceFlags)}
                  </>
                )}
              </div>

              {/* Compliance Flags */}
              {selectedProposal.complianceFlags && selectedProposal.complianceFlags.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-800 dark:text-red-300 mb-2">⚠️ COMPLIANCE VIOLATIONS DETECTED</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProposal.complianceFlags.map((flag, idx) => (
                          <span key={idx} className="inline-block text-xs px-3 py-1.5 bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 rounded-full font-semibold">
                            {flag.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Proposer */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">PROPOSER</p>
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      src={selectedProposal.proposerId?.profilePicture || '/default-avatar.png'}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-lg text-gray-900 dark:text-white">
                        {selectedProposal.proposerId?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProposal.proposerType}</p>
                    </div>
                  </div>
                  {selectedProposal.proposerId?.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📧 {selectedProposal.proposerId.email}
                    </p>
                  )}
                  {selectedProposal.proposerId?.phoneNumber && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📱 {selectedProposal.proposerId.phoneNumber}
                    </p>
                  )}
                </div>

                {/* Recipient */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">RECIPIENT</p>
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      src={selectedProposal.recipientId?.profilePicture || '/default-avatar.png'}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-lg text-gray-900 dark:text-white">
                        {selectedProposal.recipientId?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProposal.recipientType}</p>
                    </div>
                  </div>
                  {selectedProposal.recipientId?.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📧 {selectedProposal.recipientId.email}
                    </p>
                  )}
                  {selectedProposal.recipientId?.phoneNumber && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📱 {selectedProposal.recipientId.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Proposal Data - Structured Sections */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">📋 Original Proposal Details</h4>
                {getProposalSections(selectedProposal).map((section, sIdx) => (
                  section.fields.length > 0 && (
                    <div key={sIdx} className="border border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-zinc-800 px-4 py-2 border-b border-gray-700">
                        <h5 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{section.title}</h5>
                      </div>
                      <div className="divide-y divide-gray-800">
                        {section.fields.map((field, fIdx) => (
                          <div key={fIdx} className="px-4 py-3">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium text-gray-300 min-w-[200px]">{field.label}</span>
                              <div className="text-right max-w-md">
                                {field.isImages ? (
                                  renderImageGallery(field.value)
                                ) : (
                                  <span className="text-sm text-white break-words">{formatFieldValue(field.value)}</span>
                                )}
                              </div>
                            </div>
                            {field.comment && (
                              <p className="text-xs text-gray-500 mt-1 italic">💬 {field.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Counter Response Section */}
              {selectedProposal.hasCounter && selectedCounter && (
                <div className="border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 text-lg">📋 Counter-Proposal Response</h4>
                    {getStatusBadge(selectedCounter.status)}
                  </div>

                  {/* Counter Responder Info */}
                  <div className="mb-4 p-3 bg-zinc-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Submitted by</p>
                    <div className="flex items-center space-x-3">
                      <img
                        src={selectedCounter.responderId?.profilePicture || '/default-avatar.png'}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedCounter.responderId?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedCounter.responderType} • {formatDate(selectedCounter.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Field-by-Field Responses - Structured Like Agreement Page */}
                  {selectedCounter.counterData?.fieldResponses && Object.keys(selectedCounter.counterData.fieldResponses).length > 0 && (
                    <div className="mb-4 space-y-2">
                      <h5 className="text-sm font-semibold text-gray-300 mb-3">📝 Field Responses:</h5>
                      {(() => {
                        const responses = selectedCounter.counterData.fieldResponses;
                        const proposalData = selectedProposal.communityToBrand || selectedProposal.communityToVenue || selectedProposal.brandToCommunity || selectedProposal.venueToCommunity || selectedProposal.formData || {};
                        const sections = getProposalSections(selectedProposal);
                        const fieldMap = {};
                        sections.forEach(s => s.fields.forEach(f => { if (f.label) fieldMap[f.label] = f; }));

                        return Object.entries(responses).map(([field, response]) => {
                          const fieldLabel = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                          const matchedField = fieldMap[fieldLabel];
                          const proposedValue = matchedField ? formatFieldValue(matchedField.value) : null;

                          return (
                            <div key={field} className={`p-3 rounded-lg border ${
                              response.action === 'accept' ? 'border-green-600/50 bg-green-900/20' :
                              response.action === 'modify' ? 'border-yellow-600/50 bg-yellow-900/20' :
                              'border-red-600/50 bg-red-900/20'
                            }`}>
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-medium text-white">{fieldLabel}</span>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                                  response.action === 'accept' ? 'bg-green-500 text-white' :
                                  response.action === 'modify' ? 'bg-yellow-500 text-black' :
                                  'bg-red-500 text-white'
                                }`}>
                                  {response.action === 'accept' ? 'ACCEPTED' : response.action === 'modify' ? 'MODIFIED' : 'DECLINED'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {proposedValue && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Proposed</p>
                                    <p className="text-gray-300">{proposedValue}</p>
                                  </div>
                                )}
                                {response.action === 'modify' && response.modifiedValue && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Modified To</p>
                                    <p className="text-yellow-300">{formatFieldValue(response.modifiedValue)}</p>
                                  </div>
                                )}
                                {response.action === 'accept' && proposedValue && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Response</p>
                                    <p className="text-green-400">Accepted as-is</p>
                                  </div>
                                )}
                              </div>
                              {response.note && (
                                <p className="text-xs text-gray-400 mt-2 italic">💬 "{response.note}"</p>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {/* House Rules */}
                  {selectedCounter.counterData?.houseRules && Object.keys(selectedCounter.counterData.houseRules).length > 0 && (
                    <div className="mb-4 border border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-zinc-800 px-4 py-2 border-b border-gray-700">
                        <h5 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">House Rules & Policies</h5>
                      </div>
                      <div className="divide-y divide-gray-800">
                        {Object.entries(selectedCounter.counterData.houseRules).map(([rule, value]) => (
                          <div key={rule} className="px-4 py-3 flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-300">{rule.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                            <span className="text-sm text-white font-medium">{typeof value === 'boolean' ? (value ? 'Allowed' : 'Not Allowed') : String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Commercial Counter */}
                  {selectedCounter.counterData?.commercialCounter && (
                    <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-700/50">
                      <h5 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">💰 Commercial Counter-Offer:</h5>
                      <p className="text-sm text-gray-300"><strong>Model:</strong> {selectedCounter.counterData.commercialCounter.model}</p>
                      <p className="text-sm text-gray-300"><strong>Value:</strong> {selectedCounter.counterData.commercialCounter.value}</p>
                      {selectedCounter.counterData.commercialCounter.note && (
                        <p className="text-sm mt-1 italic text-gray-400">Note: {selectedCounter.counterData.commercialCounter.note}</p>
                      )}
                    </div>
                  )}

                  {/* General Notes */}
                  {selectedCounter.counterData?.generalNotes && (
                    <div className="p-3 bg-zinc-800 rounded-lg">
                      <h5 className="text-sm font-semibold text-gray-300 mb-2">General Notes:</h5>
                      <p className="text-sm text-gray-400">{selectedCounter.counterData.generalNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Collaboration Timeline */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📅 Collaboration Timeline</h4>
                <div className="space-y-3">
                  {/* Proposal Submitted */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Proposal Submitted</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(selectedProposal.createdAt)}</p>
                      {getStatusBadge('pending_admin_review')}
                    </div>
                  </div>

                  {/* Admin Review */}
                  {selectedProposal.adminReview?.reviewedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Admin {selectedProposal.adminReview?.decision === 'rejected' ? 'Rejected' : 'Approved'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(selectedProposal.adminReview.reviewedAt)} by {selectedProposal.adminReview.reviewedBy?.name || 'Admin'}
                        </p>
                        {getStatusBadge(selectedProposal.adminReview.decision === 'rejected' ? 'admin_rejected' : 'admin_approved')}
                      </div>
                    </div>
                  )}

                  {/* Counter Submitted */}
                  {selectedCounter && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Counter-Proposal Submitted</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(selectedCounter.createdAt)} by {selectedCounter.responderId?.name}
                        </p>
                        {getStatusBadge(selectedCounter.status)}
                      </div>
                    </div>
                  )}

                  {/* Counter Admin Review */}
                  {selectedCounter?.adminReview?.counterReviewedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        4
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Counter {selectedCounter.adminReview.counterDecision === 'rejected' ? 'Rejected' : 'Approved'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(selectedCounter.adminReview.counterReviewedAt)} by {selectedCounter.adminReview.counterReviewedBy?.name || 'Admin'}
                        </p>
                        {getStatusBadge(selectedCounter.status)}
                      </div>
                    </div>
                  )}

                  {/* Final Status */}
                  {(selectedProposal.status === 'completed' || selectedProposal.status === 'confirmed' || selectedProposal.status === 'declined') && (
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                        selectedProposal.status === 'completed' || selectedProposal.status === 'confirmed' ? 'bg-green-500' : 'bg-red-500'
                      } flex items-center justify-center text-white text-sm font-bold`}>
                        5
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedProposal.status === 'completed' ? 'Counter Accepted - Collaboration Complete' : 
                           selectedProposal.status === 'confirmed' ? 'Collaboration Confirmed' : 'Collaboration Declined'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedProposal.acceptedAt ? formatDate(selectedProposal.acceptedAt) : formatDate(selectedProposal.updatedAt)}
                          {selectedProposal.status === 'completed' && ' by ' + (selectedProposal.initiator?.name || 'Initiator')}
                        </p>
                        {getStatusBadge(selectedProposal.status)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Final Agreed Terms (if completed with counter) */}
              {selectedProposal.status === 'completed' && selectedCounter?.counterData && (
                <div className="border-2 border-green-500 dark:border-green-600 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    Final Agreed Terms
                  </h4>
                  
                  {/* Commercial Terms */}
                  {selectedCounter.counterData.commercialCounter && (
                    <div className="mb-3 p-3 bg-zinc-800 rounded-lg">
                      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">💰 Commercial Terms:</h5>
                      <p className="text-sm"><strong>Model:</strong> {selectedCounter.counterData.commercialCounter.model || 'N/A'}</p>
                      {selectedCounter.counterData.commercialCounter.percentage && (
                        <p className="text-sm"><strong>Revenue Share:</strong> {selectedCounter.counterData.commercialCounter.percentage}%</p>
                      )}
                      {selectedCounter.counterData.commercialCounter.amount && (
                        <p className="text-sm"><strong>Amount:</strong> ₹{selectedCounter.counterData.commercialCounter.amount}</p>
                      )}
                      {selectedCounter.counterData.commercialCounter.note && (
                        <p className="text-sm mt-1 text-gray-600 dark:text-gray-400 italic">{selectedCounter.counterData.commercialCounter.note}</p>
                      )}
                    </div>
                  )}

                  {/* Key Modifications */}
                  {selectedCounter.counterData.fieldResponses && Object.entries(selectedCounter.counterData.fieldResponses).filter(([_, response]) => response.action === 'modify').length > 0 && (
                    <div className="mb-3 p-3 bg-zinc-800 rounded-lg">
                      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📝 Modified Terms:</h5>
                      <div className="space-y-1">
                        {Object.entries(selectedCounter.counterData.fieldResponses)
                          .filter(([_, response]) => response.action === 'modify')
                          .map(([field, response]) => {
                            // Format modified value properly
                            let displayValue = 'Modified';
                            if (response.modifiedValue !== undefined && response.modifiedValue !== null) {
                              if (typeof response.modifiedValue === 'object') {
                                // Handle nested objects like {revenueShare: {percentage: 40}}
                                if (response.modifiedValue.percentage) {
                                  displayValue = `${response.modifiedValue.percentage}%`;
                                } else if (response.modifiedValue.amount) {
                                  displayValue = `₹${response.modifiedValue.amount}`;
                                } else {
                                  displayValue = JSON.stringify(response.modifiedValue, null, 2);
                                }
                              } else if (Array.isArray(response.modifiedValue)) {
                                displayValue = response.modifiedValue.join(', ');
                              } else {
                                displayValue = String(response.modifiedValue);
                              }
                            } else if (response.note) {
                              displayValue = response.note;
                            }
                            
                            return (
                              <div key={field} className="text-sm">
                                <strong>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>{' '}
                                {displayValue}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Accepted Terms */}
                  {selectedCounter.counterData.fieldResponses && Object.entries(selectedCounter.counterData.fieldResponses).filter(([_, response]) => response.action === 'accept').length > 0 && (
                    <div className="mb-3 p-3 bg-zinc-800 rounded-lg">
                      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">✓ Accepted Terms (As-Is):</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedCounter.counterData.fieldResponses)
                          .filter(([_, response]) => response.action === 'accept')
                          .map(([field, _]) => (
                            <div key={field} className="text-sm text-gray-600 dark:text-gray-400">
                              • {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* General Notes */}
                  {selectedCounter.counterData.generalNotes && (
                    <div className="p-3 bg-zinc-800 rounded-lg">
                      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Additional Notes:</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCounter.counterData.generalNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Metadata</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                    <p className="text-gray-900 dark:text-white font-medium">{formatDate(selectedProposal.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                    <p className="text-gray-900 dark:text-white font-medium">{formatDate(selectedProposal.updatedAt)}</p>
                  </div>
                  {selectedProposal.adminReviewedAt && (
                    <>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Reviewed:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{formatDate(selectedProposal.adminReviewedAt)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Reviewed By:</span>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {selectedProposal.adminReviewedBy?.name || 'Unknown Admin'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Admin Notes (if any) */}
              {selectedProposal.adminNotes && (
                <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Admin Notes (Private)</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{selectedProposal.adminNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedProposal.status === 'pending_admin_review' && (
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowFlagModal(true)}
                    className="px-6 py-3 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 border border-yellow-300 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors font-medium"
                  >
                    🚩 Flag for Review
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    ✖ Reject
                  </button>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    ✓ Approve & Deliver
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Counter Details Modal */}
      {showCounterModal && selectedCounter && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-gray-800 rounded-lg max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Counter-Proposal Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {selectedCounter._id}</p>
              </div>
              <button
                onClick={() => {
                  setShowCounterModal(false);
                  setSelectedCounter(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Original Proposal Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Original Proposal</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Type:</strong> {getCollabTypeLabel(selectedCounter.type)}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>From:</strong> {selectedCounter.proposerId?.name || selectedCounter.initiator?.user?.name || 'Unknown'} ({selectedCounter.proposerType || selectedCounter.initiator?.userType || 'N/A'})
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>To:</strong> {selectedCounter.recipientId?.name || selectedCounter.recipient?.user?.name || 'Unknown'} ({selectedCounter.recipientType || selectedCounter.recipient?.userType || 'N/A'})
                </p>
              </div>

              {/* Original Proposal Data - Structured */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white text-lg">📋 Original Proposal Details</h4>
                {getProposalSections(selectedCounter).map((section, sIdx) => (
                  section.fields.length > 0 && (
                    <div key={sIdx} className="border border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-zinc-800 px-4 py-2 border-b border-gray-700">
                        <h5 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{section.title}</h5>
                      </div>
                      <div className="divide-y divide-gray-800">
                        {section.fields.map((field, fIdx) => (
                          <div key={fIdx} className="px-4 py-3">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium text-gray-300 min-w-[200px]">{field.label}</span>
                              <div className="text-right max-w-md">
                                {field.isImages ? (
                                  renderImageGallery(field.value)
                                ) : (
                                  <span className="text-sm text-white break-words">{formatFieldValue(field.value)}</span>
                                )}
                              </div>
                            </div>
                            {field.comment && (
                              <p className="text-xs text-gray-500 mt-1 italic">💬 {field.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Counter Responder */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">COUNTER SUBMITTED BY</p>
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedCounter.responderId?.profilePicture || '/default-avatar.png'}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">
                      {selectedCounter.responderId?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCounter.responderType}</p>
                  </div>
                </div>
              </div>

              {/* Field Responses - Structured */}
              {selectedCounter.counterData?.fieldResponses && Object.keys(selectedCounter.counterData.fieldResponses).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-white mb-3">📝 Field-by-Field Responses</h4>
                  {(() => {
                    const responses = selectedCounter.counterData.fieldResponses;
                    const sections = getProposalSections(selectedCounter);
                    const fieldMap = {};
                    sections.forEach(s => s.fields.forEach(f => { if (f.label) fieldMap[f.label] = f; }));

                    return Object.entries(responses).map(([field, response]) => {
                      const fieldLabel = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      const matchedField = fieldMap[fieldLabel];
                      const proposedValue = matchedField ? formatFieldValue(matchedField.value) : null;

                      return (
                        <div key={field} className={`p-3 rounded-lg border ${
                          response.action === 'accept' ? 'border-green-600/50 bg-green-900/20' :
                          response.action === 'modify' ? 'border-yellow-600/50 bg-yellow-900/20' :
                          'border-red-600/50 bg-red-900/20'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium text-white">{fieldLabel}</span>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                              response.action === 'accept' ? 'bg-green-500 text-white' :
                              response.action === 'modify' ? 'bg-yellow-500 text-black' :
                              'bg-red-500 text-white'
                            }`}>
                              {response.action === 'accept' ? 'ACCEPTED' : response.action === 'modify' ? 'MODIFIED' : 'DECLINED'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {proposedValue && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Proposed</p>
                                <p className="text-gray-300">{proposedValue}</p>
                              </div>
                            )}
                            {response.action === 'modify' && response.modifiedValue && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Modified To</p>
                                <p className="text-yellow-300">{formatFieldValue(response.modifiedValue)}</p>
                              </div>
                            )}
                            {response.action === 'accept' && proposedValue && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Response</p>
                                <p className="text-green-400">Accepted as-is</p>
                              </div>
                            )}
                          </div>
                          {response.note && (
                            <p className="text-xs text-gray-400 mt-2 italic">💬 "{response.note}"</p>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* House Rules (if applicable) */}
              {selectedCounter.counterData?.houseRules && Object.keys(selectedCounter.counterData.houseRules).length > 0 && (
                <div className="border border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-zinc-800 px-4 py-2 border-b border-gray-700">
                    <h5 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">House Rules & Policies</h5>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {Object.entries(selectedCounter.counterData.houseRules).map(([rule, value]) => (
                      <div key={rule} className="px-4 py-3 flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-300">{rule.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                        <span className="text-sm text-white font-medium">{typeof value === 'boolean' ? (value ? 'Allowed' : 'Not Allowed') : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commercial Counter (if applicable) */}
              {selectedCounter.counterData?.commercialCounter && (
                <div className="border border-yellow-700/50 rounded-lg p-4 bg-yellow-900/20">
                  <h4 className="font-semibold text-yellow-300 mb-3">💰 Commercial Counter-Offer</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">
                      <strong>Model:</strong> {selectedCounter.counterData.commercialCounter.model}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Value:</strong> {selectedCounter.counterData.commercialCounter.value}
                    </p>
                    {selectedCounter.counterData.commercialCounter.note && (
                      <p className="text-gray-600 dark:text-gray-400 italic">
                        💬 "{selectedCounter.counterData.commercialCounter.note}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* General Notes */}
              {selectedCounter.counterData?.generalNotes && (
                <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">General Notes</h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200">{selectedCounter.counterData.generalNotes}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Metadata</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                    <p className="text-gray-900 dark:text-white font-medium">{formatDate(selectedCounter.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedCounter.status)}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedCounter.status === 'pending_admin_review' && (
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    ✖ Reject Counter
                  </button>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    ✓ Approve & Deliver
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (selectedProposal || selectedCounter) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {selectedCounter ? 'Approve Counter-Proposal' : 'Approve Proposal'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedCounter 
                ? `Approve this counter-proposal? It will be delivered to the original proposer.`
                : `Approve this proposal? It will be delivered to ${selectedProposal?.recipientId?.name}.`
              }
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Notes (Optional - Private)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                rows="3"
                placeholder="Add any internal notes for admin records..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setAdminNotes('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={selectedCounter ? handleApproveCounter : handleApproveProposal}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Approving...' : 'Approve & Deliver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (selectedProposal || selectedCounter) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {selectedCounter ? 'Reject Counter-Proposal' : 'Reject Proposal'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedCounter
                ? "The counter will be rejected and the collaboration will reopen for the recipient to respond again."
                : "The user will be notified with a generic rejection message. The specific reason is for admin logs only."
              }
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                rows="3"
                placeholder="Provide a detailed reason (min 10 characters) - shown to user as generic message"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {rejectionReason.length}/10 minimum characters
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Internal Notes (Optional - Private)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                rows="2"
                placeholder="Add internal notes (not shown to users)..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setAdminNotes('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={selectedCounter ? handleRejectCounter : handleRejectProposal}
                disabled={actionLoading || rejectionReason.length < 10}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🚩 Flag Proposal for Review
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Flagging will mark this proposal for additional review. It will not be delivered until unflagged and approved.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Flag Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                rows="3"
                placeholder="Why is this being flagged? (min 5 characters)"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {flagReason.length}/5 minimum characters
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Internal Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                rows="2"
                placeholder="Additional context..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason('');
                  setAdminNotes('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagProposal}
                disabled={actionLoading || flagReason.length < 5}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {actionLoading ? 'Flagging...' : 'Flag for Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
