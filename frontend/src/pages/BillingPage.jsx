import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import { api } from '../config/api';
import NavigationBar from '../components/NavigationBar';
import LoginPromptModal from '../components/LoginPromptModal';
import UserDetailsModal from '../components/UserDetailsModal';
import { ArrowLeft, Users, Ticket, CreditCard, CheckCircle2, UserPlus, X } from 'lucide-react';
import { getOptimizedCloudinaryUrl } from '../utils/cloudinaryHelper';
import { convert24To12Hour } from '../utils/timeUtils';
import { trackInitiateCheckout } from '../utils/metaPixel';

const BillingPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const toast = useContext(ToastContext);
  const profileJustSaved = useRef(false);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Ticket selection
  const [selectedTier, setSelectedTier] = useState(null); // For grouping offers
  const [quantity, setQuantity] = useState(1); // For non-grouping events
  const [customSpots, setCustomSpots] = useState(0); // Custom spots with group offers

  // Additional person details (only 1 person allowed)
  const [addAnotherPerson, setAddAnotherPerson] = useState(false);
  const [additionalPerson, setAdditionalPerson] = useState({ name: '', email: '' });

  // Questionnaire state
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [questionnaireResponses, setQuestionnaireResponses] = useState([]);
  const [questionnaireAnswered, setQuestionnaireAnswered] = useState(false);

  // Login prompt modal
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // User details modal (age, gender, city)
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);

  // Check if user is registered
  const [isRegistered, setIsRegistered] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isCouponValidating, setIsCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Gender-based pricing
  const [maleSpots, setMaleSpots] = useState(0);
  const [femaleSpots, setFemaleSpots] = useState(0);

  useEffect(() => {
    // Allow non-logged-in users to view billing page and select tickets
    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    // Check if user is already registered for this event
    if (user && event) {
      const userIsRegistered = event.participants?.some(
        (participant) => participant.user === user.id || participant.user?._id === user.id
      );
      setIsRegistered(userIsRegistered);
    }
  }, [user, event]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}`);
      const eventData = response.data.event || response.data;
      console.log('📊 Event Data:', eventData);
      console.log('📊 Grouping Offers:', eventData.groupingOffers);
      setEvent(eventData);

      // Check if there's saved ticket selection data (user returning after signup)
      const savedTicketData = sessionStorage.getItem('ticketSelection');
      
      if (savedTicketData) {
        const ticketData = JSON.parse(savedTicketData);
        console.log('🎫 Restoring saved ticket selection:', ticketData);
        
        // Restore tier selection by matching people count
        if (ticketData.selectedTierPeople && eventData.groupingOffers?.enabled) {
          const matchingTier = eventData.groupingOffers.tiers.find(
            tier => tier.people === ticketData.selectedTierPeople
          );
          if (matchingTier) {
            setSelectedTier(matchingTier);
            console.log('✅ Restored tier:', matchingTier);
          }
        }
        
        // Restore other selections
        if (ticketData.quantity) setQuantity(ticketData.quantity);
        if (ticketData.customSpots) { setCustomSpots(ticketData.customSpots); setSelectedTier(null); }
        if (ticketData.addAnotherPerson) setAddAnotherPerson(ticketData.addAnotherPerson);
        if (ticketData.additionalPerson) setAdditionalPerson(ticketData.additionalPerson);
        if (ticketData.couponCode) setCouponCode(ticketData.couponCode);
        if (ticketData.appliedCoupon) setAppliedCoupon(ticketData.appliedCoupon);
        if (ticketData.maleSpots) setMaleSpots(ticketData.maleSpots);
        if (ticketData.femaleSpots) setFemaleSpots(ticketData.femaleSpots);
        if (ticketData.questionnaireResponses && ticketData.questionnaireResponses.length > 0) {
          setQuestionnaireResponses(ticketData.questionnaireResponses);
          const allAnswered = ticketData.questionnaireResponses.every(r => r.answer && r.answer.trim() !== '');
          if (allAnswered) setQuestionnaireAnswered(true);
        }
        
        // Clear the saved data
        sessionStorage.removeItem('ticketSelection');
      } else {
        // Set default selection only if no saved data
        if (eventData.groupingOffers?.enabled && eventData.groupingOffers.tiers.length > 0) {
          // Find first valid tier (people > 0)
          const firstValidTier = eventData.groupingOffers.tiers.find(tier => tier.people > 0);
          if (firstValidTier) {
            setSelectedTier(firstValidTier);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
      navigate('/explore');
    } finally {
      setLoading(false);
    }
  };

  const updatePersonField = (field, value) => {
    setAdditionalPerson(prev => ({ ...prev, [field]: value }));
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsCouponValidating(true);
    setCouponError('');

    try {
      const pricing = calculatePricing();
      const response = await api.post(`/events/${eventId}/validate-coupon`, {
        couponCode: couponCode.trim(),
        basePrice: pricing.basePrice
      });

      if (response.data.valid) {
        setAppliedCoupon(response.data.coupon);
        toast.success(`Coupon applied! You saved ₹${response.data.coupon.discountApplied}`);
      } else {
        setCouponError(response.data.message || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      setCouponError(error.response?.data?.message || 'Failed to validate coupon');
      setAppliedCoupon(null);
    } finally {
      setIsCouponValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    toast.info('Coupon removed');
  };

  // Get effective price for a group offer tier, syncing 1-person tier with pricing timeline
  const getEffectiveTierPrice = (tier) => {
    if (!tier) return 0;
    if (tier.people === 1 && event?.pricingTimeline?.enabled) {
      return event.currentEffectivePrice ?? event.price?.amount ?? tier.price;
    }
    return tier.price;
  };

  // Calculate split-tier total for spots-based pricing
  // When a purchase spans multiple tiers, each spot is priced at its tier rate
  // Spots are 1-indexed: spot 1 is the first booking, currentParticipants=0 means next spot is #1
  const calculateSpotsPricingTotal = (spotsCount) => {
    if (!event?.spotsPricing?.enabled || !event.spotsPricing.tiers?.length) return null;
    const tiers = [...event.spotsPricing.tiers].sort((a, b) => a.minSpots - b.minSpots);
    const currentBooked = event.currentParticipants || 0;
    let total = 0;
    let remaining = spotsCount;

    for (const tier of tiers) {
      if (remaining <= 0) break;
      // The spot number being assigned (1-indexed)
      const nextSpotNumber = currentBooked + (spotsCount - remaining) + 1;
      if (nextSpotNumber > tier.maxSpots) continue; // past this tier
      if (nextSpotNumber < tier.minSpots) continue; // not yet in this tier
      const spotsInTier = Math.min(remaining, tier.maxSpots - nextSpotNumber + 1);
      total += spotsInTier * tier.price;
      remaining -= spotsInTier;
    }

    // If there are remaining spots not covered by any tier, use last tier price
    if (remaining > 0 && tiers.length > 0) {
      total += remaining * tiers[tiers.length - 1].price;
    }

    return total;
  };

  const calculatePricing = () => {
    let basePrice = 0;
    let numberOfPeople = 1;

    if (event?.genderPricing?.enabled) {
      // Gender-based pricing — use effective gender prices (resolved from timeline tier if active)
      const gp = event.currentEffectiveGenderPrices || event.genderPricing;
      const malePrice = gp.malePrice || 0;
      const femalePrice = gp.femalePrice || 0;
      basePrice = (maleSpots * malePrice) + (femaleSpots * femalePrice);
      numberOfPeople = maleSpots + femaleSpots;
    } else if (event?.groupingOffers?.enabled && selectedTier) {
      // Check if spots pricing can split the group offer tier price
      const spotsSplitTotal = calculateSpotsPricingTotal(selectedTier.people);
      basePrice = spotsSplitTotal != null ? spotsSplitTotal : getEffectiveTierPrice(selectedTier);
      numberOfPeople = selectedTier.people;
    } else if (event?.groupingOffers?.enabled && customSpots > 0) {
      // Custom spots: use split-tier if spots pricing enabled, else effective 1-person price
      const spotsSplitTotal = calculateSpotsPricingTotal(customSpots);
      if (spotsSplitTotal != null) {
        basePrice = spotsSplitTotal;
      } else {
        const singleTier = event.groupingOffers.tiers.find(t => t.people === 1);
        const perPersonPrice = singleTier ? getEffectiveTierPrice(singleTier) : (event.currentEffectivePrice ?? event.price?.amount ?? 0);
        basePrice = perPersonPrice * customSpots;
      }
      numberOfPeople = customSpots;
    } else {
      // Regular ticket: use split-tier if spots pricing enabled
      const spotsSplitTotal = calculateSpotsPricingTotal(quantity);
      if (spotsSplitTotal != null) {
        basePrice = spotsSplitTotal;
      } else {
        const effectivePrice = event?.currentEffectivePrice ?? event?.price?.amount ?? 0;
        basePrice = effectivePrice * quantity;
      }
      numberOfPeople = quantity;
    }

    // Apply coupon discount if available
    let discount = 0;
    if (appliedCoupon) {
      discount = appliedCoupon.discountApplied || 0;
    }

    const discountedBasePrice = Math.max(0, basePrice - discount);
    const gstAndOtherCharges = discountedBasePrice * 0.026; // 2.6%
    const platformFees = discountedBasePrice * 0.03; // 3.0%
    const grandTotal = discountedBasePrice + gstAndOtherCharges + platformFees;

    // Round all values to 2 decimal places to avoid floating point precision issues
    return {
      basePrice: parseFloat(basePrice.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      discountedBasePrice: parseFloat(discountedBasePrice.toFixed(2)),
      numberOfPeople,
      gstAndOtherCharges: parseFloat(gstAndOtherCharges.toFixed(2)),
      platformFees: parseFloat(platformFees.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };
  };

  const handleQuestionnaireSubmit = async () => {
    // Validate all questions are answered
    const allAnswered = questionnaireResponses.every(response => response.answer && response.answer.trim() !== '');
    
    if (!allAnswered) {
      toast.error('Please answer all questions');
      return;
    }

    try {
      // Save questionnaire responses immediately to database
      await api.post(`/events/${eventId}/submit-questionnaire`, {
        responses: questionnaireResponses
      });

      setQuestionnaireAnswered(true);
      setShowQuestionnaireModal(false);
      toast.success('Questionnaire submitted successfully');
    } catch (error) {
      console.error('❌ Failed to submit questionnaire:', error);
      toast.error('Failed to save questionnaire. Please try again.');
    }
  };

  const handleProceedToPayment = async () => {
    // Check if user is logged in
    if (!user) {
      // Store current URL for redirect after signup
      sessionStorage.setItem('redirectAfterSignup', window.location.pathname);
      // Store ticket selection data (store tier identifier, not the object)
      const ticketData = {
        selectedTierPeople: selectedTier?.people, // Store people count as identifier
        quantity,
        customSpots,
        addAnotherPerson,
        additionalPerson,
        couponCode: couponCode || '',
        appliedCoupon: appliedCoupon || null,
        questionnaireResponses: questionnaireResponses.length > 0 ? questionnaireResponses : [],
        maleSpots: maleSpots || 0,
        femaleSpots: femaleSpots || 0,
      };
      console.log('💾 Saving ticket selection:', ticketData);
      sessionStorage.setItem('ticketSelection', JSON.stringify(ticketData));
      setShowLoginPrompt(true);
      return;
    }

    // Check if returning user is missing age, gender, city, or interests
    const hasPreviousBooking = (user.registeredEvents?.length || 0) > 0;
    const missingAge = !user.age;
    const missingGender = !user.gender;
    const missingCity = !user.location?.city;
    const missingInterests = !user.interests || user.interests.length === 0;
    if (!profileJustSaved.current && hasPreviousBooking && (missingAge || missingGender || missingCity || missingInterests)) {
      setShowUserDetailsModal(true);
      return;
    }
    profileJustSaved.current = false;

    try {
      // Check if questionnaire needs to be answered first
      // Validate based on actual responses, not just the flag
      const needsQuestionnaire = event?.questionnaire?.enabled && 
                                 event.questionnaire.questions?.length > 0;
      const hasValidResponses = questionnaireResponses.length > 0 && 
                                questionnaireResponses.every(r => r.answer && r.answer.trim() !== '');
      
      if (needsQuestionnaire && !hasValidResponses) {
        // Initialize questionnaire responses if not already done
        if (questionnaireResponses.length === 0) {
          const initialResponses = event.questionnaire.questions.map((q) => ({
            question: q.question,
            answer: ''
          }));
          setQuestionnaireResponses(initialResponses);
        }
        setShowQuestionnaireModal(true);
        return;
      }

      // Validate additional person if checkbox is checked
      if (addAnotherPerson) {
        if (!additionalPerson.name.trim() || !additionalPerson.email.trim()) {
          toast.error('Please fill in additional person details');
          return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(additionalPerson.email)) {
          toast.error('Please enter a valid email address');
          return;
        }
      }

      // Validate gender pricing requires at least 1 spot
      if (event?.genderPricing?.enabled && (maleSpots + femaleSpots) < 1) {
        toast.error('Please select at least 1 spot');
        return;
      }

      // Validate group offers: either a tier or custom spots must be selected
      if (event?.groupingOffers?.enabled && !event?.genderPricing?.enabled && !selectedTier && customSpots < 1) {
        toast.error('Please select a ticket option or add custom spots');
        return;
      }

      setIsProcessing(true);

      // Re-fetch event to get latest currentParticipants before pricing
      // This prevents stale data if another user booked between page load and payment
      if (event?.spotsPricing?.enabled) {
        try {
          const freshRes = await api.get(`/events/${eventId}`);
          const freshEvent = freshRes.data.event || freshRes.data;
          const freshBooked = freshEvent.currentParticipants || 0;
          const staleBooked = event.currentParticipants || 0;
          if (freshBooked !== staleBooked) {
            console.log(`🔄 [Spots] currentParticipants changed: ${staleBooked} → ${freshBooked}`);
            // Update event state so calculatePricing uses fresh data
            // We must update synchronously before calling calculatePricing
            event.currentParticipants = freshBooked;
            setEvent({ ...freshEvent });
          }
          // Also check if spots are still available
          const spotsAvail = freshEvent.maxParticipants - freshBooked;
          const needed = event?.genderPricing?.enabled ? (maleSpots + femaleSpots)
            : event?.groupingOffers?.enabled ? (selectedTier ? selectedTier.people : customSpots)
            : quantity;
          if (needed > spotsAvail) {
            toast.error(`Only ${spotsAvail} spot(s) available now. Please reduce quantity.`);
            setIsProcessing(false);
            return;
          }
        } catch (err) {
          console.warn('⚠️ Failed to refresh event spots, proceeding with cached data:', err.message);
        }
      }

      const pricing = calculatePricing();
      
      // Prepare billing data
      // Include questionnaire responses if they exist and have been filled out
      const validResponses = questionnaireResponses.filter(r => r.answer && r.answer.trim() !== '');
      
      const billingData = {
        quantity: pricing.numberOfPeople,
        totalAmount: pricing.grandTotal,
        basePrice: pricing.basePrice,
        gstAndOtherCharges: pricing.gstAndOtherCharges,
        platformFees: pricing.platformFees,
        additionalPersons: addAnotherPerson ? [additionalPerson] : [],
        questionnaireResponses: validResponses, // Always include if responses exist
       couponCode: appliedCoupon ? appliedCoupon.code : null, // Include coupon if applied        // Add user data for Meta tracking
        userEmail: user?.email,
        userPhone: user?.phone,
        userId: user?._id,
        eventName: event?.title,
        eventCategory: event?.categories?.[0] || 'Events',
        eventCity: event?.location?.city || 'Unknown',
        eventDate: event?.date,
      };

      // Add gender breakdown if applicable
      if (event?.genderPricing?.enabled) {
        billingData.genderBreakdown = {
          male: maleSpots,
          female: femaleSpots
        };
      }

      // Add grouping offer details if applicable
      if (event?.groupingOffers?.enabled && selectedTier) {
        billingData.groupingOffer = {
          tierLabel: `${selectedTier.people} ${selectedTier.people === 1 ? 'Person' : 'People'}`,
          tierPeople: selectedTier.people,
          tierPrice: getEffectiveTierPrice(selectedTier)
        };
      } else if (event?.groupingOffers?.enabled && customSpots > 0) {
        const singleTier = event.groupingOffers.tiers.find(t => t.people === 1);
        const perPersonPrice = singleTier ? getEffectiveTierPrice(singleTier) : (event.currentEffectivePrice ?? event.price?.amount ?? 0);
        billingData.groupingOffer = {
          tierLabel: `${customSpots} ${customSpots === 1 ? 'Person' : 'People'} (Custom)`,
          tierPeople: customSpots,
          tierPrice: perPersonPrice * customSpots
        };
      }

      // Handle free events - register directly without payment
      if (pricing.grandTotal === 0) {
        console.log('Free event detected, registering directly without payment');
        
        const registrationData = {
          quantity: billingData.quantity,
          basePrice: 0,
          gstAndOtherCharges: 0,
          platformFees: 0,
          totalAmount: 0,
          additionalPersons: billingData.additionalPersons,
          questionnaireResponses: billingData.questionnaireResponses || [],
          couponCode: billingData.couponCode || null
        };

        if (billingData.groupingOffer) {
          registrationData.groupingOffer = billingData.groupingOffer;
        }

        if (billingData.genderBreakdown) {
          registrationData.genderBreakdown = billingData.genderBreakdown;
        }

        const registerResponse = await api.post(`/events/${event.slug || event._id}/register`, registrationData);
        
        if (registerResponse.data.success || registerResponse.status === 200) {
          toast.success('Successfully registered for the event! Check your email for tickets.');
          navigate('/profile');
        }
        return;
      }

      // Handle paid events - proceed with payment gateway
      const paymentResponse = await api.post('/payments/create-order', {
        eventId: event._id,
        quantity: pricing.numberOfPeople,
        amount: pricing.grandTotal,
        basePrice: pricing.basePrice,              // ✅ Add base price
        gstAndOtherCharges: pricing.gstAndOtherCharges, // ✅ Add GST
        platformFees: pricing.platformFees,        // ✅ Add platform fees
        questionnaireResponses: billingData.questionnaireResponses || [],
        groupingOffer: billingData.groupingOffer || null,
        additionalPersons: billingData.additionalPersons || [],
        couponCode: billingData.couponCode || null, // ✅ Add coupon code
        genderBreakdown: billingData.genderBreakdown || null // ✅ Add gender breakdown
      });

      if (paymentResponse.data.success) {
        // Store billing data and event ID in session storage for payment callback
        sessionStorage.setItem('payment_event_id', event._id);
        sessionStorage.setItem('billing_data', JSON.stringify(billingData));

        // Check if Cashfree SDK is loaded
        if (!window.Cashfree) {
          throw new Error('Payment gateway not loaded. Please refresh the page.');
        }

        // Use explicit Cashfree mode from environment variable, fallback to 'sandbox' for safety
        const cashfreeMode = import.meta.env.VITE_CASHFREE_MODE || 'sandbox';
        console.log('Initializing Cashfree in mode:', cashfreeMode);
        console.log('Payment session ID:', paymentResponse.data.payment_session_id);
        console.log('Order ID:', paymentResponse.data.order_id);
        
        // Validate session ID
        if (!paymentResponse.data.payment_session_id || paymentResponse.data.payment_session_id.length < 20) {
          console.error('Invalid payment session ID received:', paymentResponse.data.payment_session_id);
          throw new Error('Invalid payment session. Please try again.');
        }
        
        const cashfree = window.Cashfree({ mode: cashfreeMode });

        // Track Meta Pixel InitiateCheckout event
        trackInitiateCheckout({
          eventId: event._id,
          amount: pricing.grandTotal,
          quantity: pricing.numberOfPeople,
          category: event.categories?.[0] || 'Events',
          city: event.location?.city || 'Unknown',
          date: event.date,
        });

        const checkoutOptions = {
          paymentSessionId: paymentResponse.data.payment_session_id,
          returnUrl: `${window.location.origin}/payment-callback?order_id=${paymentResponse.data.order_id}`
        };

        console.log('Checkout options:', checkoutOptions);
        
        try {
          const result = await cashfree.checkout(checkoutOptions);
          console.log('Cashfree checkout result:', result);
        } catch (cashfreeError) {
          console.error('Cashfree checkout error:', cashfreeError);
          throw new Error('Payment gateway error. Please try again or contact support.');
        }
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to initialize payment';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatDateRange = (startDate, endDate) => {
    if (!endDate) return formatDate(startDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${start.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })} - ${end.getDate()}`;
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <NavigationBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const pricing = calculatePricing();
  const spotsLeft = event.maxParticipants - (event.currentParticipants || 0);

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/events/${event?.slug || eventId}`)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Event</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Ticket Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Invoice Details */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Step 1</h2>
                <div className="h-3 w-3 rounded-full bg-purple-500"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Invoice Details</h3>

              {/* Event Info */}
              <div className="flex items-start space-x-4 mb-6">
                {event.images && event.images[0] && (
                  <img
                    src={getOptimizedCloudinaryUrl(event.images[0])}
                    alt={event.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-2">{event.title}</h4>
                  <p className="text-gray-400 text-sm">
                    {formatDateRange(event.date, event.endDate)} | {event.startTime && event.endTime 
                      ? `${convert24To12Hour(event.startTime)} - ${convert24To12Hour(event.endTime)}` 
                      : event.time}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">{event.location?.city}</p>
                </div>
              </div>

              {isRegistered ? (
                /* Already Registered Message */
                <div className="bg-green-500/10 border border-green-500 rounded-xl p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">You're Already Registered!</h4>
                  <p className="text-gray-300 mb-4">
                    You have successfully registered for this event. Your ticket has been sent to your email.
                  </p>
                  <button
                    onClick={() => navigate('/user/dashboard')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                  >
                    <Ticket className="h-5 w-5" />
                    View Your Ticket
                  </button>
                </div>
              ) : (
                <>
                  {/* Ticket Selection */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Choose your Ticket</h4>

                {event.genderPricing?.enabled ? (
                  // Gender-based pricing
                  (() => {
                    const gp = event.currentEffectiveGenderPrices || event.genderPricing;
                    return (
                  <div className="space-y-4">
                    <p className="text-gray-400 text-sm mb-2">Select the number of spots per gender</p>
                    
                    {/* Male Spots */}
                    <div className="bg-gray-800/50 rounded-xl p-4 border-2 border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="text-white font-semibold mb-1">Male Ticket</h5>
                          <p className="text-gray-400 text-sm">₹{gp.malePrice} per person</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Spots</span>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => setMaleSpots(Math.max(0, maleSpots - 1))}
                            disabled={maleSpots <= 0}
                            className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                          >
                            -
                          </button>
                          <span className="text-2xl font-bold text-white w-12 text-center">{maleSpots}</span>
                          <button
                            onClick={() => setMaleSpots(Math.min(spotsLeft - femaleSpots, maleSpots + 1))}
                            disabled={maleSpots + femaleSpots >= spotsLeft}
                            className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Female Spots */}
                    <div className="bg-gray-800/50 rounded-xl p-4 border-2 border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="text-white font-semibold mb-1">Female Ticket</h5>
                          <p className="text-gray-400 text-sm">₹{gp.femalePrice} per person</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Spots</span>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => setFemaleSpots(Math.max(0, femaleSpots - 1))}
                            disabled={femaleSpots <= 0}
                            className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                          >
                            -
                          </button>
                          <span className="text-2xl font-bold text-white w-12 text-center">{femaleSpots}</span>
                          <button
                            onClick={() => setFemaleSpots(Math.min(spotsLeft - maleSpots, femaleSpots + 1))}
                            disabled={maleSpots + femaleSpots >= spotsLeft}
                            className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                    );
                  })()
                ) : event.groupingOffers?.enabled && event.groupingOffers.tiers?.some(tier => tier.people > 0) ? (
                  // Show grouping offers + custom spots
                  <div className="space-y-3">
                    {event.groupingOffers.tiers
                      .filter(tier => tier.people > 0) // Only show valid tiers
                      .map((tier, index) => (
                        <div
                          key={index}
                          onClick={() => { setSelectedTier(tier); setCustomSpots(0); }}
                          className={`rounded-xl p-4 cursor-pointer transition-all border-2 ${
                            selectedTier === tier && customSpots === 0
                              ? 'border-transparent'
                              : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                          }`}
                          style={selectedTier === tier && customSpots === 0 ? {
                            background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                            backgroundClip: 'padding-box'
                          } : {}}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Users className="h-5 w-5 text-purple-400" />
                                <span className="text-white font-semibold">
                                  {tier.people} {tier.people === 1 ? 'Person' : 'People'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-white">₹{getEffectiveTierPrice(tier)}</p>
                              {tier.people > 1 && (
                                <p className={`text-xs ${selectedTier === tier && customSpots === 0 ? 'text-white/70' : 'text-gray-400'}`}>
                                  ₹{(getEffectiveTierPrice(tier) / tier.people).toFixed(2)} per person
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* Custom Spots Selector */}
                    {(() => {
                      const singleTier = event.groupingOffers.tiers.find(t => t.people === 1);
                      const perPersonPrice = singleTier ? getEffectiveTierPrice(singleTier) : (event.currentEffectivePrice ?? event.price?.amount ?? 0);
                      return (
                        <div
                          onClick={() => { if (customSpots === 0) { setCustomSpots(1); setSelectedTier(null); } }}
                          className={`rounded-xl p-4 cursor-pointer transition-all border-2 ${
                            customSpots > 0
                              ? 'border-purple-500 bg-gray-800/80'
                              : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Users className="h-5 w-5 text-purple-400" />
                                <span className="text-white font-semibold">Custom Spots</span>
                              </div>
                              <p className="text-xs text-gray-400">₹{perPersonPrice} per person</p>
                            </div>
                            {customSpots > 0 ? (
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); const newVal = customSpots - 1; if (newVal === 0) { setCustomSpots(0); const firstTier = event.groupingOffers.tiers.find(t => t.people > 0); if (firstTier) setSelectedTier(firstTier); } else { setCustomSpots(newVal); } }}
                                  className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-colors"
                                >
                                  -
                                </button>
                                <span className="text-xl font-bold text-white w-10 text-center">{customSpots}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setCustomSpots(Math.min(spotsLeft, customSpots + 1)); }}
                                  disabled={customSpots >= spotsLeft}
                                  className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">Select</p>
                            )}
                          </div>
                          {customSpots > 0 && (
                            <div className="mt-2 text-right">
                              <p className="text-lg font-bold text-white">₹{perPersonPrice * customSpots}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  // Show quantity selector for regular tickets
                  <div className="bg-gray-800/50 rounded-xl p-4 border-2 border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="text-white font-semibold mb-1">Regular Ticket</h5>
                        <p className="text-gray-400 text-sm">₹{event.currentEffectivePrice ?? event.price?.amount ?? 0} per person</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Number of Spots</span>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                        >
                          -
                        </button>
                        <span className="text-2xl font-bold text-white w-12 text-center">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(spotsLeft, quantity + 1))}
                          disabled={quantity >= spotsLeft}
                          className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {/* Split-tier pricing breakdown */}
                    {event?.spotsPricing?.enabled && (() => {
                      const tiers = [...(event.spotsPricing.tiers || [])].sort((a, b) => a.minSpots - b.minSpots);
                      const currentBooked = event.currentParticipants || 0;
                      const breakdown = [];
                      let remaining = quantity;
                      for (const tier of tiers) {
                        if (remaining <= 0) break;
                        const nextSpotNumber = currentBooked + (quantity - remaining) + 1;
                        if (nextSpotNumber > tier.maxSpots || nextSpotNumber < tier.minSpots) continue;
                        const spotsInTier = Math.min(remaining, tier.maxSpots - nextSpotNumber + 1);
                        if (spotsInTier > 0) breakdown.push({ label: tier.label || `Spots ${tier.minSpots}-${tier.maxSpots}`, count: spotsInTier, price: tier.price });
                        remaining -= spotsInTier;
                      }
                      if (breakdown.length >= 1) {
                        return (
                          <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
                            <div className="text-xs text-gray-500 mb-1">Current tier: {breakdown[0].label} (spot #{currentBooked + 1})</div>
                            {breakdown.map((b, i) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="text-gray-400">{b.count} spot{b.count > 1 ? 's' : ''} × ₹{b.price} <span className="text-gray-500">({b.label})</span></span>
                                <span className="text-white">₹{b.count * b.price}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* Upcoming Pricing Info */}
              {(event?.pricingTimeline?.enabled || event?.spotsPricing?.enabled) && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-700/30">
                  <h5 className="text-white font-semibold text-sm mb-3 flex items-center">
                    <svg className="h-4 w-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Pricing Schedule
                  </h5>
                  
                  {event.pricingTimeline?.enabled && event.pricingTimeline.tiers?.length > 0 && (
                    <div className="space-y-2">
                      {event.pricingTimeline.tiers
                        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                        .map((tier, idx) => {
                          const now = new Date();
                          const start = new Date(tier.startDate);
                          const end = new Date(tier.endDate);
                          const isActive = now >= start && now <= end;
                          const isUpcoming = now < start;
                          return (
                            <div key={idx} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${isActive ? 'bg-green-500/10 border border-green-500/30' : isUpcoming ? 'bg-gray-800/50' : 'bg-gray-800/30 opacity-60'}`}>
                              <div>
                                <span className={`font-medium ${isActive ? 'text-green-400' : 'text-gray-300'}`}>{tier.label || `Tier ${idx + 1}`}</span>
                                <span className="text-gray-500 ml-2">
                                  {new Date(tier.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(tier.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${isActive ? 'text-green-400' : 'text-white'}`}>₹{tier.price}</span>
                                {isActive && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Now</span>}
                                {isUpcoming && <span className="text-[10px] bg-gray-600/30 text-gray-400 px-1.5 py-0.5 rounded">Upcoming</span>}
                              </div>
                            </div>
                          );
                        })}
                      <p className="text-[10px] text-gray-500 mt-1">Book early to get the best price!</p>
                    </div>
                  )}

                  {event.spotsPricing?.enabled && event.spotsPricing.tiers?.length > 0 && (
                    <div className="space-y-2">
                      {event.spotsPricing.tiers.map((tier, idx) => {
                        const booked = event.currentParticipants || 0;
                        const nextSpot = booked + 1;
                        const isActive = nextSpot >= tier.minSpots && nextSpot <= tier.maxSpots;
                        const isCompleted = nextSpot > tier.maxSpots;
                        const isUpcoming = nextSpot < tier.minSpots;
                        return (
                          <div key={idx} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${isActive ? 'bg-green-500/10 border border-green-500/30' : isCompleted ? 'bg-gray-800/30 opacity-60' : 'bg-gray-800/50'}`}>
                            <div>
                              <span className={`font-medium ${isActive ? 'text-green-400' : 'text-gray-300'}`}>{tier.label || `Spots ${tier.minSpots}-${tier.maxSpots}`}</span>
                              <span className="text-gray-500 ml-2">({tier.minSpots}-{tier.maxSpots} spots)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isActive ? 'text-green-400' : 'text-white'}`}>₹{tier.price}</span>
                              {isActive && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Current</span>}
                              {isUpcoming && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">₹{tier.price - (event.currentEffectivePrice || 0) > 0 ? '+' : ''}{tier.price - (event.currentEffectivePrice || 0)}</span>}
                            </div>
                          </div>
                        );
                      })}
                      <p className="text-[10px] text-gray-500 mt-1">Price increases as more spots get booked. Book now for the best price!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Person Details */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="addPerson"
                    checked={addAnotherPerson}
                    onChange={(e) => {
                      setAddAnotherPerson(e.target.checked);
                      if (!e.target.checked) {
                        setAdditionalPerson({ name: '', email: '' });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                  />
                  <label htmlFor="addPerson" className="text-white text-sm cursor-pointer">
                    Add another person's details (We'll send ticket to them too)
                  </label>
                </div>

                {addAnotherPerson && (
                  <div className="space-y-3 pl-7">
                    <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
                      <div className="mb-2">
                        <span className="text-sm text-gray-400">Additional Recipient</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={additionalPerson.name}
                        onChange={(e) => updatePersonField('name', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={additionalPerson.email}
                        onChange={(e) => updatePersonField('email', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Questionnaire Responses Display */}
              {!isRegistered && questionnaireAnswered && questionnaireResponses.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    Your Questionnaire Responses
                  </h4>
                  <div className="space-y-3">
                    {questionnaireResponses.map((response, index) => (
                      <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <p className="text-sm font-medium mb-1" style={{ color: '#7878E9' }}>
                          Q{index + 1}: {response.question}
                        </p>
                        <p className="text-white text-sm">{response.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 sticky top-24">
              {isRegistered ? (
                <>
                  <h3 className="text-xl font-bold text-white mb-6">Registration Confirmed</h3>
                  
                  <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
                    <p className="text-white text-center font-semibold mb-2">You're all set!</p>
                    <p className="text-gray-300 text-sm text-center">
                      Your ticket has been sent to your email
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/user/dashboard')}
                    className="w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center space-x-2"
                    style={{
                      background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                    }}
                  >
                    <Ticket className="h-5 w-5" />
                    <span>View Your Ticket</span>
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>

              {/* Ticket Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Ticket Type</span>
                  <span className="text-white font-medium">
                    {event.genderPricing?.enabled ? 'Gender-Based' : (event.groupingOffers?.enabled && selectedTier ? selectedTier.label : (event.groupingOffers?.enabled && customSpots > 0 ? 'Custom Spots' : 'Regular'))}
                  </span>
                </div>
                {event.genderPricing?.enabled ? (
                  <>
                    {maleSpots > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Male Spots</span>
                        <span className="text-white font-medium">{maleSpots} × ₹{(event.currentEffectiveGenderPrices || event.genderPricing).malePrice}</span>
                      </div>
                    )}
                    {femaleSpots > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Female Spots</span>
                        <span className="text-white font-medium">{femaleSpots} × ₹{(event.currentEffectiveGenderPrices || event.genderPricing).femalePrice}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Total People</span>
                      <span className="text-white font-medium">{pricing.numberOfPeople}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Number of People</span>
                    <span className="text-white font-medium">{pricing.numberOfPeople}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-700 pt-4 mb-6">
                <h4 className="text-white font-semibold mb-4">Payment Summary</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Order amount</span>
                    <span className="text-white">₹{pricing.basePrice.toFixed(2)}</span>
                  </div>
                  
                  {/* Show discount if coupon applied */}
                  {appliedCoupon && pricing.discount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-400">Coupon Discount ({appliedCoupon.code})</span>
                      <span className="text-green-400">-₹{pricing.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">GST & Other charges</span>
                    <span className="text-white">₹{pricing.gstAndOtherCharges.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Platform Fees</span>
                    <span className="text-white">₹{pricing.platformFees.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Coupon Code Section */}
              {!appliedCoupon ? (
                <div className="mb-6">
                  <label className="block text-white text-sm font-medium mb-2">
                    Have a coupon code?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      placeholder="Enter coupon code"
                      className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                      disabled={isCouponValidating}
                    />
                    <button
                      onClick={validateCoupon}
                      disabled={isCouponValidating || !couponCode.trim()}
                      className="px-6 py-2 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[70px]"
                      style={{
                        background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                      }}
                    >
                      {isCouponValidating ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-red-400 text-xs mt-2">{couponError}</p>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium text-sm">{appliedCoupon.code}</p>
                        <p className="text-green-400 text-xs">
                          {appliedCoupon.discountType === 'percentage' 
                            ? `${appliedCoupon.discountValue}% off` 
                            : `₹${appliedCoupon.discountValue} off`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-700 pt-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">Grand Total</span>
                  <span className="text-2xl font-bold text-white">₹{pricing.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                id="checkout-btn"
                onClick={handleProceedToPayment}
                disabled={isProcessing || spotsLeft <= 0}
                className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                style={{
                  background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                }}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Ticket className="h-5 w-5" />
                    <span>Book Tickets</span>
                  </>
                )}
              </button>

              </>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Questionnaire Modal */}
      {showQuestionnaireModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-zinc-900 border-b border-gray-700 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white">Questionnaire</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Please answer the following questions before proceeding
                </p>
              </div>
              <button
                onClick={() => setShowQuestionnaireModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {questionnaireResponses.map((response, index) => (
                <div key={index} className="space-y-2">
                  <label className="text-white font-medium flex items-start gap-2">
                    <span className="font-semibold" style={{ color: '#7878E9' }}>Q{index + 1}.</span>
                    <span className="flex-1">{response.question}</span>
                  </label>
                  <textarea
                    value={response.answer}
                    onChange={(e) => {
                      const updatedResponses = [...questionnaireResponses];
                      updatedResponses[index].answer = e.target.value;
                      setQuestionnaireResponses(updatedResponses);
                    }}
                    placeholder="Type your answer here..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none resize-none"
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderImage = 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%) 1';
                      e.target.style.borderWidth = '2px';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderImage = 'none';
                      e.target.style.borderWidth = '1px';
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-zinc-900 border-t border-gray-700 p-6">
              <button
                onClick={handleQuestionnaireSubmit}
                className="w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center space-x-2"
                style={{
                  background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                }}
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Submit & Continue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        eventTitle={event?.title}
        message="Sign in to book your tickets"
      />

      {/* User Details Modal (age, gender, city) */}
      <UserDetailsModal
        isOpen={showUserDetailsModal}
        onClose={() => setShowUserDetailsModal(false)}
        onSave={async () => {
          setShowUserDetailsModal(false);
          await refreshUser();
          profileJustSaved.current = true;
          toast.success('Details saved! Proceeding to checkout...');
          // Auto-proceed to checkout after a brief delay
          setTimeout(() => {
            document.getElementById('checkout-btn')?.click();
          }, 300);
        }}
        existingAge={user?.age}
        existingGender={user?.gender}
        existingCity={user?.location?.city}
        existingInterests={user?.interests}
      />
    </div>
  );
};

export default BillingPage;
