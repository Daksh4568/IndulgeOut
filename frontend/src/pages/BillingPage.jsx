import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import { api } from '../config/api';
import NavigationBar from '../components/NavigationBar';
import { ArrowLeft, Users, Ticket, CreditCard, CheckCircle2, UserPlus, X } from 'lucide-react';

const BillingPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useContext(ToastContext);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Ticket selection
  const [selectedTier, setSelectedTier] = useState(null); // For grouping offers
  const [quantity, setQuantity] = useState(1); // For non-grouping events

  // Additional person details (only 1 person allowed)
  const [addAnotherPerson, setAddAnotherPerson] = useState(false);
  const [additionalPerson, setAdditionalPerson] = useState({ name: '', email: '' });

  // Questionnaire state
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [questionnaireResponses, setQuestionnaireResponses] = useState([]);
  const [questionnaireAnswered, setQuestionnaireAnswered] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }
    fetchEventDetails();
  }, [eventId, user]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}`);
      const eventData = response.data.event || response.data;
      console.log('📊 Event Data:', eventData);
      console.log('📊 Grouping Offers:', eventData.groupingOffers);
      setEvent(eventData);

      // Set default selection
      if (eventData.groupingOffers?.enabled && eventData.groupingOffers.tiers.length > 0) {
        // Find first valid tier (people > 0)
        const firstValidTier = eventData.groupingOffers.tiers.find(tier => tier.people > 0);
        if (firstValidTier) {
          setSelectedTier(firstValidTier);
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

  const calculatePricing = () => {
    let basePrice = 0;
    let numberOfPeople = 1;

    if (event?.groupingOffers?.enabled && selectedTier) {
      basePrice = selectedTier.price;
      numberOfPeople = selectedTier.people;
    } else {
      basePrice = (event?.price?.amount || 0) * quantity;
      numberOfPeople = quantity;
    }

    const gstAndOtherCharges = basePrice * 0.026; // 2.6%
    const platformFees = basePrice * 0.03; // 3.0%
    const grandTotal = basePrice + gstAndOtherCharges + platformFees;

    // Round all values to 2 decimal places to avoid floating point precision issues
    return {
      basePrice: parseFloat(basePrice.toFixed(2)),
      numberOfPeople,
      gstAndOtherCharges: parseFloat(gstAndOtherCharges.toFixed(2)),
      platformFees: parseFloat(platformFees.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };
  };

  const handleQuestionnaireSubmit = () => {
    // Validate all questions are answered
    const allAnswered = questionnaireResponses.every(response => response.answer && response.answer.trim() !== '');
    
    if (!allAnswered) {
      toast.error('Please answer all questions');
      return;
    }

    setQuestionnaireAnswered(true);
    setShowQuestionnaireModal(false);
    toast.success('Questionnaire submitted successfully');
  };

  const handleProceedToPayment = async () => {
    try {
      // Check if questionnaire needs to be answered first
      if (event?.questionnaire?.enabled && event.questionnaire.questions?.length > 0 && !questionnaireAnswered) {
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

      setIsProcessing(true);

      const pricing = calculatePricing();
      
      // Prepare billing data
      const billingData = {
        quantity: pricing.numberOfPeople,
        totalAmount: pricing.grandTotal,
        basePrice: pricing.basePrice,
        gstAndOtherCharges: pricing.gstAndOtherCharges,
        platformFees: pricing.platformFees,
        additionalPersons: addAnotherPerson ? [additionalPerson] : [],
        questionnaireResponses: questionnaireAnswered ? questionnaireResponses : [],
      };

      // Add grouping offer details if applicable
      if (event?.groupingOffers?.enabled && selectedTier) {
        billingData.groupingOffer = {
          tierLabel: `${selectedTier.people} ${selectedTier.people === 1 ? 'Person' : 'People'}`,
          tierPeople: selectedTier.people,
          tierPrice: selectedTier.price
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
          additionalPersons: billingData.additionalPersons
        };

        if (billingData.groupingOffer) {
          registrationData.groupingOffer = billingData.groupingOffer;
        }

        const registerResponse = await api.post(`/events/${event._id}/register`, registrationData);
        
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
        amount: pricing.grandTotal
      });

      if (paymentResponse.data.success) {
        // Store billing data and event ID in session storage for payment callback
        sessionStorage.setItem('payment_event_id', event._id);
        sessionStorage.setItem('billing_data', JSON.stringify(billingData));

        // Check if Cashfree SDK is loaded
        if (!window.Cashfree) {
          throw new Error('Payment gateway not loaded. Please refresh the page.');
        }

        const cashfreeMode = import.meta.env.MODE === 'production' ? 'production' : 'sandbox';
        const cashfree = window.Cashfree({ mode: cashfreeMode });

        const checkoutOptions = {
          paymentSessionId: paymentResponse.data.payment_session_id,
          returnUrl: `${window.location.origin}/payment-callback?order_id=${paymentResponse.data.order_id}`
        };

        await cashfree.checkout(checkoutOptions);
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
          onClick={() => navigate(`/events/${eventId}`)}
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
                    src={event.images[0]}
                    alt={event.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-2">{event.title}</h4>
                  <p className="text-gray-400 text-sm">
                    {formatDate(event.date)} | {event.startTime && event.endTime 
                      ? `${event.startTime} - ${event.endTime}` 
                      : event.time}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">{event.location?.city}</p>
                </div>
              </div>

              {/* Ticket Selection */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white mb-4">Choose your Ticket</h4>

                {event.groupingOffers?.enabled && event.groupingOffers.tiers?.some(tier => tier.people > 0) ? (
                  // Show grouping offers
                  <div className="space-y-3">
                    {event.groupingOffers.tiers
                      .filter(tier => tier.people > 0) // Only show valid tiers
                      .map((tier, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedTier(tier)}
                          className={`rounded-xl p-4 cursor-pointer transition-all border-2 ${
                            selectedTier === tier
                              ? 'border-transparent'
                              : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                          }`}
                          style={selectedTier === tier ? {
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
                              <p className="text-2xl font-bold text-white">₹{tier.price}</p>
                              {tier.people > 1 && (
                                <p className={`text-xs ${selectedTier === tier ? 'text-white/70' : 'text-gray-400'}`}>
                                  ₹{(tier.price / tier.people).toFixed(2)} per person
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  // Show quantity selector for regular tickets
                  <div className="bg-gray-800/50 rounded-xl p-4 border-2 border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="text-white font-semibold mb-1">Regular Ticket</h5>
                        <p className="text-gray-400 text-sm">₹{event.price?.amount || 0} per person</p>
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
                  </div>
                )}
              </div>

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
              {questionnaireAnswered && questionnaireResponses.length > 0 && (
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
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>

              {/* Ticket Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Ticket Type</span>
                  <span className="text-white font-medium">
                    {event.groupingOffers?.enabled && selectedTier ? selectedTier.label : 'Regular'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Number of People</span>
                  <span className="text-white font-medium">{pricing.numberOfPeople}</span>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 mb-6">
                <h4 className="text-white font-semibold mb-4">Payment Summary</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Order amount</span>
                    <span className="text-white">₹{pricing.basePrice.toFixed(2)}</span>
                  </div>
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

              <div className="border-t border-gray-700 pt-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">Grand Total</span>
                  <span className="text-2xl font-bold text-white">₹{pricing.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
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
                    <span>Get your Tickets</span>
                  </>
                )}
              </button>

              {spotsLeft > 0 && spotsLeft <= 10 && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">{spotsLeft} spots available</span>
                </div>
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
    </div>
  );
};

export default BillingPage;
