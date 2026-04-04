import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  UserPlus,
  ChevronDown,
  Upload,
  X,
  Image,
  Search,
} from "lucide-react";
import NavigationBar from "../components/NavigationBar";
import TimeInput from "../components/TimeInput";
// import ImageCropper from "../components/ImageCropper";
import { api, API_URL } from "../config/api.js";
import { useAuth } from "../contexts/AuthContext";
import { ToastContext } from "../App";
import { COMMUNITIES } from "../constants/eventConstants";
import locationService from "../services/locationService";
import { getOptimizedCloudinaryUrl } from "../utils/cloudinaryHelper";

// Hidden file input ref for image upload
// (used by the "Browse File" button below)
const EVENT_CATEGORIES = [
  { id: "social-mixers", name: "Social Mixers", emoji: "🎉" },
  {
    id: "wellness-fitness-sports",
    name: "Wellness, Fitness & Sports",
    emoji: "⚽",
  },
  { id: "art-music-dance", name: "Art, Music & Dance", emoji: "🎨" },
  { id: "immersive", name: "Immersive", emoji: "🎭" },
  { id: "food-beverage", name: "Food & Beverage", emoji: "🍷" },
  { id: "games", name: "Games", emoji: "🎲" },
];

const EventCreation = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const isEditMode = Boolean(eventId);
  const { user } = useAuth();
  const toast = useContext(ToastContext);
  const locationSearchRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categories: [],
    date: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      coordinates: {
        latitude: null,
        longitude: null,
      },
    },
    maxParticipants: "",
    price: {
      amount: 0,
      currency: "INR",
    },
    community: "",
    coHosts: [],
    requirements: [],
    isPrivate: false,
    groupingOffers: {
      enabled: false,
      tiers: [
        { people: 1, price: 0 },
        { people: 0, price: "" },
      ],
    },
    questionnaire: {
      enabled: false,
      questions: [
        { question: "" },
      ],
    },
    coupons: {
      enabled: false,
      codes: [],
    },
    pricingTimeline: {
      enabled: false,
      tiers: [],
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [showCoHostDropdown, setShowCoHostDropdown] = useState(false);
  const [coHostEnabled, setCoHostEnabled] = useState(false);
  const [coHostSearchQuery, setCoHostSearchQuery] = useState("");
  const [coHostSearchResults, setCoHostSearchResults] = useState([]);
  const [isSearchingCoHosts, setIsSearchingCoHosts] = useState(false);
  const [selectedCoHosts, setSelectedCoHosts] = useState([]);
  const coHostSearchTimerRef = useRef(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  // const [cropperFile, setCropperFile] = useState(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  const communities = COMMUNITIES;

  // Indian cities and states for fallback
  const indianCities = [
    "Mumbai",
    "Delhi",
    "Bengaluru",
    "Hyderabad",
    "Ahmedabad",
    "Chennai",
    "Kolkata",
    "Surat",
    "Pune",
    "Jaipur",
    "Lucknow",
    "Kanpur",
    "Nagpur",
    "Indore",
    "Thane",
    "Bhopal",
    "Visakhapatnam",
    "Pimpri-Chinchwad",
    "Patna",
    "Vadodara",
    "Ghaziabad",
    "Ludhiana",
    "Agra",
    "Nashik",
    "Faridabad",
    "Meerut",
    "Rajkot",
    "Kalyan-Dombivli",
    "Vasai-Virar",
    "Varanasi",
  ];

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
  ];

  // Fetch event data if in edit mode
  useEffect(() => {
    const fetchEventData = async () => {
      if (!isEditMode || !eventId) return;

      try {
        setIsLoading(true);
        const response = await api.get(`/events/${eventId}`);

        const event = response.data.event || response.data;
        console.log("Loaded event data:", event);

        // Check if event is in the past - prevent editing past events
        const eventDate = new Date(event.date);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Reset time to start of today

        if (eventDate < now) {
          toast.error(
            "❌ Cannot edit past events. This event has already occurred.",
          );
          navigate("/organizer/dashboard");
          return;
        }

        // Format date for input (YYYY-MM-DD)
        let formattedDate = "";
        if (event.date) {
          try {
            if (!isNaN(eventDate.getTime())) {
              formattedDate = eventDate.toISOString().split("T")[0];
            }
          } catch (err) {
            console.error("Error formatting date:", err);
          }
        }

        let formattedEndDate = "";
        if (event.endDate) {
          try {
            const endDateObj = new Date(event.endDate);
            if (!isNaN(endDateObj.getTime())) {
              formattedEndDate = endDateObj.toISOString().split("T")[0];
            }
          } catch (err) {
            console.error("Error formatting end date:", err);
          }
        }

        // Populate form with existing event data
        setFormData({
          title: event.title || "",
          description: event.description || "",
          categories: event.categories || [],
          date: formattedDate,
          endDate: formattedEndDate,
          startTime: event.startTime || "",
          endTime: event.endTime || "",
          location: {
            address: event.location?.address || "",
            city: event.location?.city || "",
            state: event.location?.state || "",
            zipCode: event.location?.zipCode || "",
            coordinates: {
              latitude: event.location?.coordinates?.latitude || null,
              longitude: event.location?.coordinates?.longitude || null,
            },
          },
          maxParticipants: event.maxParticipants || "",
          price: {
            amount: event.price?.amount || 0,
            currency: event.price?.currency || "USD",
          },
          community: event.community || "",
          coHosts: event.coHosts || [],
          requirements: event.requirements || [],
          isPrivate: event.isPrivate || false,
          groupingOffers: event.groupingOffers ? {
            enabled: event.groupingOffers.enabled || false,
            tiers: event.groupingOffers.tiers?.length > 0 
              ? event.groupingOffers.tiers.map((tier, idx) => ({
                  people: idx === 0 ? 1 : (tier.people || 0),
                  price: tier.price || 0
                }))
              : [
                  { people: 1, price: 0 },
                  { people: 0, price: 0 },
                  { people: 0, price: 0 },
                  { people: 0, price: 0 },
                ]
          } : {
            enabled: false,
            tiers: [
              { people: 1, price: 0 },
              { people: 0, price: 0 },
              { people: 0, price: 0 },
              { people: 0, price: 0 },
            ],
          },
          questionnaire: event.questionnaire ? {
            enabled: event.questionnaire.enabled || false,
            questions: event.questionnaire.questions?.length > 0 
              ? event.questionnaire.questions 
              : [{ question: "" }]
          } : {
            enabled: false,
            questions: [
              { question: "" },
            ],
          },
          coupons: event.coupons ? {
            enabled: event.coupons.enabled || false,
            codes: event.coupons.codes?.length > 0 
              ? event.coupons.codes.map(coupon => ({
                  code: coupon.code || "",
                  discountType: coupon.discountType || "percentage",
                  discountValue: coupon.discountValue || 0,
                  maxUses: coupon.maxUses || null,
                  maxUsesPerUser: coupon.maxUsesPerUser || 1,
                  expiryDate: coupon.expiryDate || null,
                  isActive: coupon.isActive !== undefined ? coupon.isActive : true,
                }))
              : []
          } : {
            enabled: false,
            codes: [],
          },
          pricingTimeline: event.pricingTimeline ? {
            enabled: event.pricingTimeline.enabled || false,
            tiers: event.pricingTimeline.tiers?.length > 0
              ? event.pricingTimeline.tiers.map(tier => ({
                  startDate: tier.startDate ? new Date(tier.startDate).toISOString().split('T')[0] : '',
                  endDate: tier.endDate ? new Date(tier.endDate).toISOString().split('T')[0] : '',
                  price: tier.price || 0,
                  label: tier.label || '',
                }))
              : []
          } : {
            enabled: false,
            tiers: [],
          },
        });

        // Set location query for display
        if (event.location?.address) {
          setLocationQuery(event.location.address);
        }

        // Set uploaded images if they exist
        if (event.images && event.images.length > 0) {
          const imageObjects = event.images.map((url, index) => ({
            url,
            public_id: `existing_${index}`,
            resource_type: "image",
          }));
          setUploadedImages(imageObjects);
        }

        // Show end date input if event has an end date
        if (event.endDate) {
          setShowEndDate(true);
        }

        toast.success("Event loaded for editing");
      } catch (error) {
        console.error("Error fetching event:", error);
        toast.error("Failed to load event data");
        navigate("/organizer/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [isEditMode, eventId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => {
        const newFormData = {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === "checkbox" ? checked : value,
          },
        };
        
        // Sync price.amount with first tier price (1 people tier)
        if (name === "price.amount" && prev.groupingOffers.enabled) {
          const newTiers = [...prev.groupingOffers.tiers];
          if (newTiers.length > 0) {
            newTiers[0] = { ...newTiers[0], people: 1, price: Number(value) };
          }
          newFormData.groupingOffers = {
            ...prev.groupingOffers,
            tiers: newTiers,
          };
        }
        
        // Also sync when grouping offers is not enabled yet but price changes
        if (name === "price.amount" && !prev.groupingOffers.enabled) {
          const newTiers = [...prev.groupingOffers.tiers];
          if (newTiers.length > 0) {
            newTiers[0] = { ...newTiers[0], people: 1, price: Number(value) };
            newFormData.groupingOffers = {
              ...prev.groupingOffers,
              tiers: newTiers,
            };
          }
        }
        
        return newFormData;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleGroupingOfferToggle = (checked) => {
    setFormData((prev) => {
      const tiers = [...prev.groupingOffers.tiers];
      // Ensure first tier always has people: 1 and price synced with main price
      if (tiers.length > 0) {
        tiers[0] = { ...tiers[0], people: 1, price: Number(prev.price.amount) };
      }
      
      return {
        ...prev,
        groupingOffers: {
          ...prev.groupingOffers,
          enabled: checked,
          tiers: tiers,
        },
      };
    });
  };

  const handleGroupingTierChange = (index, field, value) => {
    setFormData((prev) => {
      const newTiers = [...prev.groupingOffers.tiers];
      
      // Handle price and people as numbers
      if (field === 'price' || field === 'people') {
        newTiers[index] = {
          ...newTiers[index],
          [field]: value === '' ? (field === 'people' ? 0 : '') : Number(value),
        };
      } else {
        newTiers[index] = {
          ...newTiers[index],
          [field]: value,
        };
      }
      
      // Ensure first tier always has people: 1
      if (index === 0) {
        newTiers[0] = { ...newTiers[0], people: 1 };
      }
      
      return {
        ...prev,
        groupingOffers: {
          ...prev.groupingOffers,
          tiers: newTiers,
        },
      };
    });
  };

  const addGroupingTier = () => {
    setFormData((prev) => ({
      ...prev,
      groupingOffers: {
        ...prev.groupingOffers,
        tiers: [
          ...prev.groupingOffers.tiers,
          { people: 0, price: "" },
        ],
      },
    }));
  };

  const removeGroupingTier = (index) => {
    setFormData((prev) => ({
      ...prev,
      groupingOffers: {
        ...prev.groupingOffers,
        tiers: prev.groupingOffers.tiers.filter((_, i) => i !== index),
      },
    }));
  };

  // Questionnaire handlers
  const handleQuestionnaireToggle = (checked) => {
    setFormData((prev) => ({
      ...prev,
      questionnaire: {
        ...prev.questionnaire,
        enabled: checked,
      },
    }));
  };

  const handleQuestionChange = (index, value) => {
    setFormData((prev) => {
      const newQuestions = [...prev.questionnaire.questions];
      newQuestions[index] = { question: value };
      return {
        ...prev,
        questionnaire: {
          ...prev.questionnaire,
          questions: newQuestions,
        },
      };
    });
  };

  const addQuestion = () => {
    if (formData.questionnaire.questions.length < 3) {
      setFormData((prev) => ({
        ...prev,
        questionnaire: {
          ...prev.questionnaire,
          questions: [...prev.questionnaire.questions, { question: "" }],
        },
      }));
    }
  };

  const removeQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      questionnaire: {
        ...prev.questionnaire,
        questions: prev.questionnaire.questions.filter((_, i) => i !== index),
      },
    }));
  };

  // Coupon handlers
  const handleCouponToggle = (checked) => {
    setFormData((prev) => ({
      ...prev,
      coupons: {
        ...prev.coupons,
        enabled: checked,
        codes: checked ? prev.coupons.codes : [],
      },
    }));
  };

  const addCoupon = () => {
    setFormData((prev) => ({
      ...prev,
      coupons: {
        ...prev.coupons,
        codes: [
          ...prev.coupons.codes,
          {
            code: "",
            discountType: "percentage",
            discountValue: 0,
            maxUses: null,
            maxUsesPerUser: 1,
            expiryDate: null,
            isActive: true,
          },
        ],
      },
    }));
  };

  const updateCoupon = (index, field, value) => {
    setFormData((prev) => {
      const newCodes = [...prev.coupons.codes];
      newCodes[index] = {
        ...newCodes[index],
        [field]: value,
      };
      return {
        ...prev,
        coupons: {
          ...prev.coupons,
          codes: newCodes,
        },
      };
    });
  };

  const removeCoupon = (index) => {
    setFormData((prev) => ({
      ...prev,
      coupons: {
        ...prev.coupons,
        codes: prev.coupons.codes.filter((_, i) => i !== index),
      },
    }));
  };

  // Pricing Timeline handlers
  const handlePricingTimelineToggle = (checked) => {
    setFormData((prev) => ({
      ...prev,
      pricingTimeline: {
        ...prev.pricingTimeline,
        enabled: checked,
        tiers: checked ? prev.pricingTimeline.tiers : [],
      },
    }));
  };

  const addPricingTier = () => {
    setFormData((prev) => ({
      ...prev,
      pricingTimeline: {
        ...prev.pricingTimeline,
        tiers: [
          ...prev.pricingTimeline.tiers,
          {
            startDate: "",
            endDate: "",
            price: "",
            label: "",
          },
        ],
      },
    }));
  };

  const updatePricingTier = (index, field, value) => {
    setFormData((prev) => {
      const newTiers = [...prev.pricingTimeline.tiers];
      newTiers[index] = {
        ...newTiers[index],
        [field]: value,
      };
      // Sync price.amount with the first tier's price so backend always has a valid price
      const updates = {
        ...prev,
        pricingTimeline: {
          ...prev.pricingTimeline,
          tiers: newTiers,
        },
      };
      if (field === 'price' && index === 0) {
        updates.price = { ...prev.price, amount: Number(value) || 0 };
      }
      return updates;
    });
  };

  const removePricingTier = (index) => {
    setFormData((prev) => ({
      ...prev,
      pricingTimeline: {
        ...prev.pricingTimeline,
        tiers: prev.pricingTimeline.tiers.filter((_, i) => i !== index),
      },
    }));
  };

  const handleCategoryToggle = (category) => {
    const categoryName = category.name;
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryName)
        ? prev.categories.filter((c) => c !== categoryName)
        : [...prev.categories, categoryName].slice(0, 3), // Max 3 categories
    }));
    // Close dropdown after selection
    setShowCategoryDropdown(false);
  };

  // Location search functions
  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearchingLocation(true);
    try {
      const results = await locationService.searchLocations(query);
      setLocationSuggestions(results.slice(0, 5)); // Limit to 5 suggestions
    } catch (error) {
      console.error("Error searching locations:", error);
      setLocationSuggestions([]);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleLocationSearch = (e) => {
    const query = e.target.value;
    setLocationQuery(query);
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        address: query,
      },
    }));

    if (query.length >= 3) {
      setShowLocationSuggestions(true);
      searchLocations(query);
    } else {
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
    }
  };

  const selectLocation = async (suggestion) => {
    try {
      // Extract detailed address components
      const road =
        suggestion.address?.road ||
        suggestion.address?.street ||
        suggestion.address?.building ||
        "";
      const neighbourhood =
        suggestion.address?.neighbourhood || suggestion.address?.suburb || "";
      const city =
        suggestion.address?.city ||
        suggestion.address?.town ||
        suggestion.address?.village ||
        suggestion.address?.municipality ||
        "";
      const state =
        suggestion.address?.state ||
        suggestion.address?.province ||
        suggestion.address?.region ||
        "";
      const zipCode = suggestion.address?.postcode || "";
      const country = suggestion.address?.country || "India";

      // Build precise address from components
      const addressParts = [
        road,
        neighbourhood,
        city,
        state,
        zipCode,
        country,
      ].filter(Boolean);
      const preciseAddress = addressParts.join(", ") || suggestion.display_name;

      // Get coordinates
      let coords = {
        latitude: parseFloat(suggestion.lat),
        longitude: parseFloat(suggestion.lon),
      };

      // Try to get more precise coordinates if available
      try {
        const detailedCoords = await locationService.geocodeAddress(
          suggestion.display_name,
        );
        coords = {
          latitude: detailedCoords.lat,
          longitude: detailedCoords.lng,
        };
      } catch (coordError) {
        console.warn("Using suggestion coordinates directly:", coordError);
      }

      setFormData((prev) => ({
        ...prev,
        location: {
          address: preciseAddress,
          city: city,
          state: state,
          zipCode: zipCode,
          coordinates: coords,
        },
      }));

      // Update the search field with the precise address
      setLocationQuery(preciseAddress);
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
    } catch (error) {
      console.error("Error processing location:", error);
      // Fallback to basic suggestion data
      setFormData((prev) => ({
        ...prev,
        location: {
          address: suggestion.display_name,
          city: suggestion.address?.city || suggestion.address?.town || "",
          state: suggestion.address?.state || "",
          zipCode: suggestion.address?.postcode || "",
          coordinates: {
            latitude: parseFloat(suggestion.lat),
            longitude: parseFloat(suggestion.lon),
          },
        },
      }));

      setLocationQuery(suggestion.display_name);
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsSearchingLocation(true);
      const location = await locationService.getCurrentLocation();

      // Check if we have valid coordinates
      if (!location.latitude || !location.longitude) {
        throw new Error("Could not get valid coordinates");
      }

      // Try to get address, but don't fail if reverse geocoding fails
      let address = null;
      try {
        address = await locationService.reverseGeocode(
          location.latitude,
          location.longitude,
        );
      } catch (geocodeError) {
        console.warn("Reverse geocoding failed:", geocodeError);
        address = {
          display_name: "Address not available",
          address: {},
        };
      }

      setFormData((prev) => ({
        ...prev,
        location: {
          address: address.display_name || "Address not available",
          city:
            address.address?.city ||
            address.address?.town ||
            address.address?.village ||
            "",
          state: address.address?.state || address.address?.province || "",
          zipCode: address.address?.postcode || "",
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        },
      }));

      setLocationQuery(address.display_name || "Current Location");
    } catch (error) {
      console.error("Error getting current location:", error);
      toast.warning(
        "Could not get your current location. Please search manually.",
      );
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Handle current location selection
  const useCurrentLocation = async () => {
    console.log("useCurrentLocation called");
    try {
      setIsSearchingLocation(true);
      console.log("Getting current location...");

      // Show initial feedback to user
      toast.info("Getting your location... Please allow access if prompted.");

      const location = await locationService.getCurrentLocation();
      console.log("Got location:", location);

      if (!location.latitude || !location.longitude) {
        throw new Error("Could not get valid coordinates");
      }

      setCurrentUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      console.log("Set current user location");

      // Try to get address and auto-populate city/state/zipcode
      try {
        console.log("Starting reverse geocoding...");
        const address = await locationService.reverseGeocode(
          location.latitude,
          location.longitude,
        );
        console.log("Reverse geocode result:", address);

        const road = address.address?.road || address.address?.street || "";
        const neighbourhood =
          address.address?.neighbourhood || address.address?.suburb || "";
        const city =
          address.city ||
          address.address?.city ||
          address.address?.town ||
          address.address?.village ||
          "";
        const state =
          address.state ||
          address.address?.state ||
          address.address?.province ||
          "";
        const zipCode = address.address?.postcode || "";
        const country = address.address?.country || "India";

        // Build precise address
        const addressParts = [road, neighbourhood, city, state, zipCode].filter(
          Boolean,
        );
        const fullAddress = addressParts.join(", ");

        console.log(
          "Extracted - Road:",
          road,
          "City:",
          city,
          "State:",
          state,
          "Zip:",
          zipCode,
        );

        setFormData((prev) => ({
          ...prev,
          location: {
            address: fullAddress || address.display_name || "Current Location",
            city: city,
            state: state,
            zipCode: zipCode,
            coordinates: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          },
        }));
        console.log("Updated form data with complete address");

        // Update location query - user can still edit this
        setLocationQuery(
          fullAddress || address.display_name || "Current Location",
        );

        toast.success("Location detected successfully!");
      } catch (geocodeError) {
        console.warn("Reverse geocoding failed:", geocodeError);
        // Still set coordinates even if reverse geocoding fails
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            address: "Current Location",
            coordinates: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          },
        }));

        setLocationQuery("Current Location");
        toast.warning(
          "Location detected but address lookup failed. Please enter city and state manually.",
        );
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      toast.error(
        error.message ||
          "Could not get your location. Please search manually or enter location details.",
      );
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Search cities based on input
  const searchCities = async (query) => {
    console.log("searchCities called with query:", query);
    if (!query || query.length < 2) {
      setFilteredCities([]);
      return;
    }

    try {
      // First, search in our predefined Indian cities
      const localMatches = indianCities
        .filter((city) => city.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map((city) => ({
          name: city,
          full_name: `${city}, India`,
          coordinates: null, // Will be geocoded if selected
        }));

      console.log("Local city matches:", localMatches);

      // If we have local matches, use them
      if (localMatches.length > 0) {
        setFilteredCities(localMatches);
        return;
      }

      // Otherwise, search using location service
      console.log("Searching cities via location service for:", query);
      const suggestions = await locationService.searchLocations(
        query + " city India",
      );
      console.log("City search results:", suggestions);

      const cityResults = suggestions
        .filter((item) => {
          // More flexible filtering for cities
          const isPlace = item.class === "place";
          const isCity = [
            "city",
            "town",
            "village",
            "municipality",
            "suburb",
          ].includes(item.type);
          return isPlace && isCity;
        })
        .slice(0, 10)
        .map((item) => ({
          name: item.display_name.split(",")[0],
          full_name: item.display_name,
          coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
        }));

      console.log("Filtered city results:", cityResults);
      setFilteredCities(cityResults);
    } catch (error) {
      console.error("Error searching cities:", error);
    }
  };

  // Search states based on input
  const searchStates = async (query) => {
    console.log("searchStates called with query:", query);
    if (!query || query.length < 2) {
      setFilteredStates([]);
      return;
    }

    try {
      // First, search in our predefined Indian states
      const localMatches = indianStates
        .filter((state) => state.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
        .map((state) => ({
          name: state,
          full_name: `${state}, India`,
        }));

      console.log("Local state matches:", localMatches);

      // Always use local matches for states as they're more reliable
      setFilteredStates(localMatches);
    } catch (error) {
      console.error("Error searching states:", error);
    }
  };

  // Handle city selection
  const selectCity = (city) => {
    console.log("Selecting city:", city);
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        city: city.name,
        coordinates: city.coordinates,
      },
    }));
    setShowCityDropdown(false);
    setFilteredCities([]);

    // Show success feedback
    toast.success(`City selected: ${city.name}`);
  };

  // Handle state selection
  const selectState = (state) => {
    console.log("Selecting state:", state);
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        state: state.name,
      },
    }));
    setShowStateDropdown(false);
    setFilteredStates([]);

    // Show success feedback
    toast.success(`State selected: ${state.name}`);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        locationSearchRef.current &&
        !locationSearchRef.current.contains(event.target)
      ) {
        setShowLocationSuggestions(false);
        setShowCityDropdown(false);
        setShowStateDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        locationSearchRef.current &&
        !locationSearchRef.current.contains(event.target)
      ) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - uploadedImages.length;
    if (files.length > remainingSlots) {
      toast.error(`You can only upload upto 5 images`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check total combined size (5MB limit)
    const MAX_TOTAL_SIZE = 5 * 1024 * 1024;
    let totalSize = 0;
    for (let i = 0; i < files.length; i++) {
      totalSize += files[i].size;
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      toast.error('All the images combined should not exceed 5MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      const response = await api.post('/events/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const newImages = response.data.images.map((img) => ({
          url: img.url,
          public_id: img.key,
          id: img.key,
        }));
        setUploadedImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (publicId) => {
    setUploadedImages((prev) =>
      prev.filter((img) => img.public_id !== publicId),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate images are uploaded
    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one image for your event");
      return;
    }
    
    // Validate categories are selected
    if (formData.categories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    // Validate multi-day end date
    if (showEndDate && !formData.endDate) {
      toast.error("Multi-day event is enabled but End Date is not set. Please add an End Date or uncheck the option.");
      return;
    }
    if (showEndDate && formData.endDate && formData.date && new Date(formData.endDate) < new Date(formData.date)) {
      toast.error("End Date cannot be before the Start Date");
      return;
    }

    // Validate pricing timeline (Early Bird)
    if (formData.pricingTimeline?.enabled) {
      const tiers = formData.pricingTimeline.tiers || [];
      if (tiers.length === 0) {
        toast.error("Early Bird is enabled but no price tiers added. Please add at least one tier or disable Early Bird.");
        return;
      }
      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        if (!tier.startDate) {
          toast.error(`Early Bird Tier ${i + 1}: Start Date is required`);
          return;
        }
        if (!tier.endDate) {
          toast.error(`Early Bird Tier ${i + 1}: End Date is required`);
          return;
        }
        if (new Date(tier.endDate) < new Date(tier.startDate)) {
          toast.error(`Early Bird Tier ${i + 1}: End Date cannot be before Start Date`);
          return;
        }
        if (!tier.price && tier.price !== 0) {
          toast.error(`Early Bird Tier ${i + 1}: Price is required`);
          return;
        }
        if (Number(tier.price) < 0) {
          toast.error(`Early Bird Tier ${i + 1}: Price cannot be negative`);
          return;
        }
      }
      // Check for overlapping date ranges
      for (let i = 0; i < tiers.length; i++) {
        for (let j = i + 1; j < tiers.length; j++) {
          const a = tiers[i], b = tiers[j];
          if (a.startDate && a.endDate && b.startDate && b.endDate) {
            if (a.startDate <= b.endDate && b.startDate <= a.endDate) {
              toast.error(`Early Bird Tier ${i + 1} and Tier ${j + 1} have overlapping date ranges`);
              return;
            }
          }
        }
      }
    }

    // Validate grouping offers
    if (formData.groupingOffers?.enabled) {
      const tiers = formData.groupingOffers.tiers || [];
      for (let i = 1; i < tiers.length; i++) {
        if (!tiers[i].people || tiers[i].people < 2) {
          toast.error(`Group Offer Tier ${i + 1}: Number of people must be at least 2`);
          return;
        }
        if (!tiers[i].price && tiers[i].price !== 0) {
          toast.error(`Group Offer Tier ${i + 1}: Price is required`);
          return;
        }
        if (Number(tiers[i].price) < 0) {
          toast.error(`Group Offer Tier ${i + 1}: Price cannot be negative`);
          return;
        }
      }
    }

    // Validate coupons
    if (formData.coupons?.enabled) {
      const codes = formData.coupons.codes || [];
      if (codes.length === 0) {
        toast.error("Coupon section is enabled but no coupons added. Please add a coupon or disable it.");
        return;
      }
      for (let i = 0; i < codes.length; i++) {
        if (!codes[i].code || !codes[i].code.trim()) {
          toast.error(`Coupon ${i + 1}: Coupon code is required`);
          return;
        }
        if (!codes[i].discountValue || codes[i].discountValue <= 0) {
          toast.error(`Coupon ${i + 1}: Discount value must be greater than 0`);
          return;
        }
        if (codes[i].discountType === 'percentage' && codes[i].discountValue > 100) {
          toast.error(`Coupon ${i + 1}: Percentage discount cannot exceed 100%`);
          return;
        }
      }
      // Check for duplicate coupon codes
      const codeSet = new Set();
      for (const c of codes) {
        const upper = c.code?.trim().toUpperCase();
        if (upper && codeSet.has(upper)) {
          toast.error(`Duplicate coupon code: ${upper}`);
          return;
        }
        codeSet.add(upper);
      }
    }

    // Validate questionnaire
    if (formData.questionnaire?.enabled) {
      const questions = formData.questionnaire.questions || [];
      if (questions.length === 0) {
        toast.error("Questionnaire is enabled but no questions added. Please add a question or disable it.");
        return;
      }
      for (let i = 0; i < questions.length; i++) {
        if (!questions[i].question || !questions[i].question.trim()) {
          toast.error(`Question ${i + 1}: Question text is required`);
          return;
        }
      }
    }
    
    setIsLoading(true);

    try {
      console.log("Event data:", formData);

      // Prepare the event data for the API
      const eventData = {
        ...formData,
        maxParticipants: parseInt(formData.maxParticipants),
        date: formData.date,
        endDate: formData.endDate || null,
        startTime: formData.startTime,
        endTime: formData.endTime,
        images: uploadedImages.map((img) => img.url), // Send image URLs
      };
      
      // Ensure first tier always has people: 1 if grouping offers enabled
      if (eventData.groupingOffers?.enabled && eventData.groupingOffers.tiers?.length > 0) {
        eventData.groupingOffers.tiers[0] = {
          ...eventData.groupingOffers.tiers[0],
          people: 1
        };
      }

      // Convert pricing timeline tier prices to numbers, default empty to 0
      if (eventData.pricingTimeline?.enabled && eventData.pricingTimeline.tiers?.length > 0) {
        eventData.pricingTimeline.tiers = eventData.pricingTimeline.tiers.map(tier => ({
          ...tier,
          price: tier.price !== '' && tier.price != null ? Number(tier.price) : 0
        }));
      }

      let response;
      if (isEditMode) {
        // Update existing event
        response = await api.put(`/events/${eventId}`, eventData);
        console.log("Event updated successfully:", response.data);
        toast.success("Event updated successfully!");
        
        // Small delay to ensure toast is visible before navigation
        setTimeout(() => {
          navigate("/organizer/dashboard");
        }, 500);
      } else {
        // Create new event
        response = await api.post("/events", eventData);
        console.log("Event created successfully:", response.data);

        // Send co-host requests if any selected
        const createdEventId = response.data.event?._id;
        if (createdEventId && selectedCoHosts.length > 0) {
          for (const coHost of selectedCoHosts) {
            try {
              await api.post('/organizer/co-host-request', {
                eventId: createdEventId,
                coHostUserId: coHost._id
              });
            } catch (coHostErr) {
              console.error(`Failed to send co-host request to ${coHost.name}:`, coHostErr);
            }
          }
          toast.success("Event created and co-host requests sent!");
        } else {
          toast.success("Event created successfully!");
        }
        
        // Small delay to ensure toast is visible before navigation
        setTimeout(() => {
          navigate("/organizer/dashboard");
        }, 500);
      }
    } catch (error) {
      console.error(
        `Failed to ${isEditMode ? "update" : "create"} event:`,
        error,
      );
      console.error("Error details:", error.response?.data || error.message);
      
      if (error.response) {
        // Server responded with error status
        const errorMessage =
          error.response.data.message ||
          `Failed to ${isEditMode ? "update" : "create"} event`;
        const errors = error.response.data.errors;

        if (errors && errors.length > 0) {
          toast.error(
            `Validation errors: ${errors.map((err) => err.msg).join(", ")}`,
          );
        } else {
          toast.error(errorMessage);
        }
      } else if (error.request) {
        // Request was made but no response received
        toast.error(
          "No response from server. Please check if the backend is running.",
        );
      } else {
        // Something else went wrong
        toast.error(
          error.message || "An unexpected error occurred. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: "#000000",
      }}
    >
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: "url(/images/BackgroundLogin.jpg)",
          filter: "blur(2px)",
        }}
      />

      {/* Navigation Bar */}
      <div className="relative z-50">
        <NavigationBar />
      </div>

      {/* Form Container */}
      <div className="relative z-0 flex items-center justify-center px-4 py-8 min-h-[calc(100vh-80px)]">
        {/* Glass Morphism Card */}
        <div
          className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          }}
        >
          {/* Header inside card */}
          <div className="p-6 text-center border-b border-white/10">
            <h1
              className="text-3xl font-bold text-white tracking-wide"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              {isEditMode ? "EDIT EVENT" : "CREATE EVENT"}
            </h1>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Event Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter event title"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                  required
                />
              </div>

              {/* Event Description */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Event Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your event..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent resize-none"
                  required
                />
              </div>

              {/* Categories */}
              <div className="relative">
                <label className="block text-white text-sm font-medium mb-2">
                  Event Category <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-left text-white focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent flex items-center justify-between"
                >
                  <span
                    className={
                      formData.categories.length > 0
                        ? "text-white"
                        : "text-gray-400"
                    }
                  >
                    {formData.categories.length > 0
                      ? `${formData.categories.length} selected`
                      : "Select"}
                  </span>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>

                {showCategoryDropdown && (
                  <div className="absolute z-40 mt-2 w-full bg-zinc-900 border border-white/10 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    <div className="p-4 space-y-2">
                      {EVENT_CATEGORIES.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center cursor-pointer hover:bg-white/5 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.categories.includes(
                              category.name,
                            )}
                            onChange={() => handleCategoryToggle(category)}
                            disabled={
                              formData.categories.length >= 3 &&
                              !formData.categories.includes(category.name)
                            }
                            className="h-4 w-4 rounded focus:ring-[#7878E9] border-gray-600 bg-white/5"
                            style={{ accentColor: '#7878E9' }}
                          />
                          <span className="ml-3 text-sm text-white">
                            {category.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.categories.map((category) => (
                      <span
                        key={category}
                        className="px-3 py-1 text-white rounded-full text-xs"
                        style={{
                          background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                          border: '1px solid rgba(120, 120, 233, 0.3)'
                        }}
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Date and Time */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {showEndDate ? 'Start Date' : 'Date'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      id="hasEndDate"
                      checked={showEndDate}
                      onChange={(e) => {
                        setShowEndDate(e.target.checked);
                        if (!e.target.checked) {
                          setFormData(prev => ({ ...prev, endDate: '' }));
                        }
                      }}
                      className="h-4 w-4 rounded focus:ring-[#7878E9] border-white/10 bg-white/5"
                      style={{ accentColor: '#7878E9' }}
                    />
                    <label htmlFor="hasEndDate" className="text-white text-sm font-medium cursor-pointer">
                      Multi-day event (Add End Date)
                    </label>
                  </div>
                  {showEndDate && (
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        End Date <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        min={formData.date || undefined}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <TimeInput
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    label="Start Time"
                    required
                  />
                  <TimeInput
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    label="End Time"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <label className="block text-white text-sm font-medium">
                  Location
                </label>
                <div className="relative" ref={locationSearchRef}>
                  <input
                    type="text"
                    value={locationQuery || formData.location.address || ""}
                    onChange={handleLocationSearch}
                    placeholder="Search cafe, venue, or area in Bangalore... (e.g., 'Third Wave Coffee' or 'Indiranagar')"
                    className="w-full px-4 py-3 pr-32 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={isSearchingLocation}
                    className="absolute right-3 top-3 text-xs hover:opacity-80 disabled:opacity-50 flex items-center gap-1"
                    style={{ color: '#7878E9' }}
                  >
                    {isSearchingLocation ? (
                      <>
                        <div 
                          className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: '#7878E9' }}
                        ></div>
                        <span>Locating...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3 w-3" />
                        <span>Use Current</span>
                      </>
                    )}
                  </button>

                  {showLocationSuggestions &&
                    locationSuggestions.length > 0 && (
                      <div className="absolute z-40 w-full mt-2 bg-zinc-900 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {locationSuggestions.map((suggestion, index) => (
                          <button
                            key={suggestion.place_id || index}
                            type="button"
                            onClick={() => selectLocation(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                          >
                            <div className="flex items-start gap-3">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#7878E9' }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium text-white truncate">
                                    {suggestion.name ||
                                      suggestion.address?.road ||
                                      suggestion.display_name?.split(",")[0] ||
                                      "Unknown Location"}
                                  </p>
                                  {suggestion.isBangalore && (
                                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                                      📍 Bangalore
                                    </span>
                                  )}
                                  {suggestion.venueType && (
                                    <span 
                                      className="text-xs text-white px-2 py-0.5 rounded-full whitespace-nowrap"
                                      style={{
                                        background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                                      }}
                                    >
                                      {suggestion.venueType}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 truncate">
                                  {suggestion.display_name}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                <input
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  placeholder="Complete address (Street, Area, Landmark)"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleInputChange}
                    placeholder="City *"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                  />
                  <input
                    type="text"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleInputChange}
                    placeholder="State *"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                  />
                </div>

                <input
                  type="text"
                  name="location.zipCode"
                  value={formData.location.zipCode}
                  onChange={handleInputChange}
                  placeholder="Zip/Postal Code (Optional)"
                  maxLength="10"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                />
              </div>

              {/* Participants and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Participants <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    placeholder="10"
                    min="1"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Price <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="price.amount"
                    value={formData.price.amount}
                    onChange={(e) => {
                      // Prevent removing the value entirely, default to 0
                      const value = e.target.value === '' ? '0' : e.target.value;
                      handleInputChange({ target: { name: 'price.amount', value } });
                    }}
                    placeholder="₹0"
                    min="0"
                    step="0.01"
                    disabled={formData.pricingTimeline?.enabled}
                    className={`w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${formData.pricingTimeline?.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required
                  />
                  {formData.pricingTimeline?.enabled && (
                    <p className="text-[10px] text-yellow-400/80 mt-1 italic">Price is set by Early Bird tiers</p>
                  )}
                </div>
              </div>

              {/* Grouping Offers */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="groupingOffers"
                    checked={formData.groupingOffers?.enabled || false}
                    onChange={(e) => handleGroupingOfferToggle(e.target.checked)}
                    className="h-4 w-4 rounded focus:ring-[#7878E9] border-white/10 bg-white/5"
                    style={{ accentColor: '#7878E9' }}
                  />
                  <label htmlFor="groupingOffers" className="text-white text-sm font-medium cursor-pointer">
                    Group Offers
                  </label>
                </div>

                {formData.groupingOffers?.enabled && (
                  <div className="space-y-3 pl-6 border-l-2 border-white/10">
                    {formData.groupingOffers.tiers?.map((tier, index) => (
                      <div key={index} className="space-y-2">
                        {index > 0 && (
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => removeGroupingTier(index)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">
                              People{index > 0 && <span className="text-red-400"> *</span>}
                            </label>
                            {index === 0 ? (
                              <input
                                type="number"
                                value={1}
                                disabled
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm opacity-50 cursor-not-allowed"
                              />
                            ) : (
                              <input
                                type="number"
                                value={tier.people || ''}
                                onChange={(e) => handleGroupingTierChange(index, 'people', e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">
                              Price (₹){index > 0 && <span className="text-red-400"> *</span>}
                            </label>
                            {index === 0 ? (
                              <div>
                                <input
                                  type="number"
                                  value={tier.price}
                                  disabled
                                  placeholder="₹0"
                                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm opacity-50 cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <p className="text-[10px] text-gray-500 mt-1 italic">Auto-synced with main price</p>
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={tier.price}
                                onChange={(e) => handleGroupingTierChange(index, 'price', e.target.value)}
                                placeholder="₹0"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add More Button - Show if less than 4 tiers */}
                    {(formData.groupingOffers.tiers?.length || 0) < 4 && (
                      <button
                        type="button"
                        onClick={addGroupingTier}
                        className="flex items-center space-x-2 text-[#7878E9] hover:text-[#5a5abf] text-sm font-medium transition-colors"
                      >
                        <span className="text-lg">+</span>
                        <span>Add More</span>
                      </button>
                    )}
                    
                    <p className="text-xs text-gray-400 italic mt-2">
                      💡 Set number of people and price for each tier (e.g., 1 people - ₹100, 2 people - ₹180 , 3 people - ₹250)
                    </p>
                  </div>
                )}
              </div>

              {/* Pricing Timeline */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pricingTimeline"
                    checked={formData.pricingTimeline?.enabled || false}
                    onChange={(e) => handlePricingTimelineToggle(e.target.checked)}
                    className="h-4 w-4 rounded focus:ring-[#7878E9] border-white/10 bg-white/5"
                    style={{ accentColor: '#7878E9' }}
                  />
                  <label htmlFor="pricingTimeline" className="text-white text-sm font-medium cursor-pointer">
                    Early Bird
                  </label>
                </div>

                {formData.pricingTimeline?.enabled && (
                  <div className="space-y-4 pl-6 border-l-2 border-white/10">
                    <p className="text-xs text-gray-400">
                      Set different prices for different date ranges leading up to your event. The ticket price will automatically change based on the current date.
                    </p>
                    
                    {formData.pricingTimeline.tiers?.map((tier, index) => (
                      <div key={index} className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm font-medium">
                            Price Tier {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removePricingTier(index)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Label */}
                        <div>
                          <label className="block text-white text-xs font-medium mb-1">
                            Label (Optional)
                          </label>
                          <input
                            type="text"
                            value={tier.label}
                            onChange={(e) => updatePricingTier(index, 'label', e.target.value)}
                            placeholder="e.g., Early Bird, Regular, Last Minute"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                          />
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-white text-xs font-medium mb-1">
                              Start Date <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="date"
                              value={tier.startDate ? tier.startDate.split('T')[0] : ''}
                              onChange={(e) => updatePricingTier(index, 'startDate', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-white text-xs font-medium mb-1">
                              End Date <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="date"
                              value={tier.endDate ? tier.endDate.split('T')[0] : ''}
                              onChange={(e) => updatePricingTier(index, 'endDate', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Price */}
                        <div>
                          <label className="block text-white text-xs font-medium mb-1">
                            Price (₹) <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            value={tier.price}
                            onChange={(e) => updatePricingTier(index, 'price', e.target.value)}
                            placeholder="₹0"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Tier Button */}
                    {(formData.pricingTimeline.tiers?.length || 0) < 5 && (
                      <button
                        type="button"
                        onClick={addPricingTier}
                        className="flex items-center space-x-2 text-[#7878E9] hover:text-[#5a5abf] text-sm font-medium transition-colors"
                      >
                        <span className="text-lg">+</span>
                        <span>Add Price Tier</span>
                      </button>
                    )}
                    
                    <p className="text-xs text-gray-400 italic mt-2">
                      💡 Example: Early Bird tickets till March 25 at ₹500, Regular tickets till March 31 at ₹700, Last Minute tickets till event day at ₹1000.
                    </p>
                  </div>
                )}
              </div>

              {/* Coupon Codes */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="coupons"
                    checked={formData.coupons?.enabled || false}
                    onChange={(e) => handleCouponToggle(e.target.checked)}
                    className="h-4 w-4 rounded focus:ring-[#7878E9] border-white/10 bg-white/5"
                    style={{ accentColor: '#7878E9' }}
                  />
                  <label htmlFor="coupons" className="text-white text-sm font-medium cursor-pointer">
                    Create Coupon Codes
                  </label>
                </div>

                {formData.coupons?.enabled && (
                  <div className="space-y-4 pl-6 border-l-2 border-white/10">
                    {formData.coupons.codes?.map((coupon, index) => (
                      <div key={index} className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm font-medium">
                            Coupon {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCoupon(index)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Coupon Code */}
                        <div>
                          <label className="block text-white text-xs font-medium mb-1">
                            Coupon Code <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={coupon.code}
                            onChange={(e) => updateCoupon(index, 'code', e.target.value.toUpperCase())}
                            placeholder="e.g., INDULGE100"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent uppercase"
                          />
                        </div>

                        {/* Discount Type */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-white text-xs font-medium mb-1">
                              Discount Type
                            </label>
                            <select
                              value={coupon.discountType}
                              onChange={(e) => updateCoupon(index, 'discountType', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-white text-xs font-medium mb-1">
                              Discount Value <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                {coupon.discountType === 'percentage' ? '%' : '₹'}
                              </span>
                              <input
                                type="number"
                                value={coupon.discountValue}
                                onChange={(e) => updateCoupon(index, 'discountValue', Math.max(0, parseFloat(e.target.value) || 0))}
                                placeholder="0"
                                min="0"
                                max={coupon.discountType === 'percentage' ? 100 : undefined}
                                className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Usage Limits */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-white text-xs font-medium mb-1">
                              Max Total Uses
                            </label>
                            <input
                              type="number"
                              value={coupon.maxUses === null ? '' : coupon.maxUses}
                              onChange={(e) => updateCoupon(index, 'maxUses', e.target.value === '' ? null : Math.max(1, parseInt(e.target.value) || 1))}
                              placeholder="Unlimited"
                              min="1"
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                            />
                            <p className="text-xs text-gray-400 mt-1">Leave empty for unlimited</p>
                          </div>

                          <div>
                            <label className="block text-white text-xs font-medium mb-1">
                              Max Uses Per User
                            </label>
                            <input
                              type="number"
                              value={coupon.maxUsesPerUser}
                              onChange={(e) => updateCoupon(index, 'maxUsesPerUser', Math.max(1, parseInt(e.target.value) || 1))}
                              placeholder="1"
                              min="1"
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Expiry Date */}
                        <div>
                          <label className="block text-white text-xs font-medium mb-1">
                            Expiry Date (Optional)
                          </label>
                          <input
                            type="datetime-local"
                            value={coupon.expiryDate ? (() => {
                              // Convert ISO string to local datetime-local format
                              const date = new Date(coupon.expiryDate);
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const hours = String(date.getHours()).padStart(2, '0');
                              const minutes = String(date.getMinutes()).padStart(2, '0');
                              return `${year}-${month}-${day}T${hours}:${minutes}`;
                            })() : ''}
                            onChange={(e) => {
                              // Convert local datetime to ISO string preserving the local time as UTC
                              if (e.target.value) {
                                const localDate = new Date(e.target.value);
                                updateCoupon(index, 'expiryDate', localDate.toISOString());
                              } else {
                                updateCoupon(index, 'expiryDate', null);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                          />
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`coupon-active-${index}`}
                            checked={coupon.isActive}
                            onChange={(e) => updateCoupon(index, 'isActive', e.target.checked)}
                            className="h-4 w-4 rounded focus:ring-[#7878E9] border-white/10 bg-white/5"
                            style={{ accentColor: '#7878E9' }}
                          />
                          <label htmlFor={`coupon-active-${index}`} className="text-white text-xs cursor-pointer">
                            Coupon is active
                          </label>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Coupon Button */}
                    <button
                      type="button"
                      onClick={addCoupon}
                      className="flex items-center space-x-2 text-[#7878E9] hover:text-[#5a5abf] text-sm font-medium transition-colors"
                    >
                      <span className="text-lg">+</span>
                      <span>Add Coupon Code</span>
                    </button>
                    
                    <p className="text-xs text-gray-400 italic mt-2">
                      💡 Create discount codes for special offers (e.g., Giving 10% discount to first 20 users)
                    </p>
                    {(() => {
                      const ticketPrice = Number(formData.price?.amount) || 0;
                      const firstCoupon = formData.coupons.codes?.[0];
                      const discountType = firstCoupon?.discountType || 'percentage';
                      const discountValue = Number(firstCoupon?.discountValue) || 0;
                      if (ticketPrice <= 0 || discountValue <= 0) return (
                        <p className="text-xs text-gray-400 italic mt-1">
                          💡 Eg: You are giving ₹200 off on a ticket of ₹300 per user — user pays ₹100 per ticket
                        </p>
                      );
                      const discountAmt = discountType === 'percentage'
                        ? Math.round(ticketPrice * discountValue / 100)
                        : Math.round(discountValue);
                      const discountPct = discountType === 'percentage'
                        ? discountValue
                        : ticketPrice > 0 ? Math.round((discountValue / ticketPrice) * 100) : 0;
                      const finalPrice = Math.max(0, ticketPrice - discountAmt);
                      return (
                        <p className="text-xs text-gray-400 italic mt-1">
                          💡 Eg: You are giving {discountPct}% (₹{discountAmt}) off on a ticket of ₹{ticketPrice} per user — user pays ₹{finalPrice} per ticket
                        </p>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Questionnaire */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="questionnaire"
                    checked={formData.questionnaire?.enabled || false}
                    onChange={(e) => handleQuestionnaireToggle(e.target.checked)}
                    className="h-4 w-4 rounded focus:ring-[#7878E9] border-white/10 bg-white/5"
                    style={{ accentColor: '#7878E9' }}
                  />
                  <label htmlFor="questionnaire" className="text-white text-sm font-medium cursor-pointer">
                    Questionnaire for Participants
                  </label>
                </div>

                {formData.questionnaire?.enabled && (
                  <div className="space-y-3 pl-6 border-l-2 border-white/10">
                    {formData.questionnaire.questions?.map((item, index) => (
                      <div key={index} className="space-y-2">
                        {formData.questionnaire.questions.length > 1 && (
                          <div className="flex items-center justify-between">
                            <span className="text-white text-xs font-medium">
                              Question {index + 1} <span className="text-red-400">*</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        <div>
                          {formData.questionnaire.questions.length === 1 && (
                            <label className="block text-white text-xs font-medium mb-1">
                              Question 1 <span className="text-red-400">*</span>
                            </label>
                          )}
                          <textarea
                            value={item.question}
                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                            placeholder="Enter your question here..."
                            rows="2"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                          />
                        </div>
                      </div>
                    ))}
                    
                    {/* Add More Button - Show if less than 3 questions */}
                    {(formData.questionnaire.questions?.length || 0) < 3 && (
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="flex items-center space-x-2 text-[#7878E9] hover:text-[#5a5abf] text-sm font-medium transition-colors"
                      >
                        <span className="text-lg">+</span>
                        <span>Add Question</span>
                      </button>
                    )}
                    
                    <p className="text-xs text-gray-400 italic mt-2">
                      💡 Ask participants questions before booking (max 3 questions)
                    </p>
                  </div>
                )}
              </div>

              {/* Co-host */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={coHostEnabled}
                    onChange={(e) => {
                      setCoHostEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedCoHosts([]);
                        setCoHostSearchQuery("");
                        setCoHostSearchResults([]);
                        setShowCoHostDropdown(false);
                      }
                    }}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#7878E9] focus:ring-[#7878E9] focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-white text-sm font-medium">Add a Co-Host</span>
                </label>

                {coHostEnabled && (
                  <div className="space-y-3">
                    {/* Selected Co-Hosts */}
                    {selectedCoHosts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedCoHosts.map((coHost) => (
                          <div
                            key={coHost._id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7878E9]/20 border border-[#7878E9]/30"
                          >
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                              {coHost.profilePicture ? (
                                <img src={coHost.profilePicture} alt={coHost.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-white font-bold">{coHost.name?.charAt(0)}</span>
                              )}
                            </div>
                            <span className="text-white text-xs font-medium">{coHost.name}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedCoHosts(prev => prev.filter(c => c._id !== coHost._id))}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Search Input - hide when max reached */}
                    {selectedCoHosts.length < 2 && (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={coHostSearchQuery}
                          onChange={(e) => {
                            const query = e.target.value;
                            setCoHostSearchQuery(query);
                            setShowCoHostDropdown(true);
                            if (coHostSearchTimerRef.current) clearTimeout(coHostSearchTimerRef.current);
                            if (query.trim().length >= 2) {
                              setIsSearchingCoHosts(true);
                              coHostSearchTimerRef.current = setTimeout(async () => {
                                try {
                                  const response = await api.get(`/organizer/search-organizers?q=${encodeURIComponent(query.trim())}`);
                                  setCoHostSearchResults(response.data.data || []);
                                } catch (err) {
                                  console.error('Error searching organizers:', err);
                                  setCoHostSearchResults([]);
                                } finally {
                                  setIsSearchingCoHosts(false);
                                }
                              }, 300);
                            } else {
                              setCoHostSearchResults([]);
                              setIsSearchingCoHosts(false);
                            }
                          }}
                          onFocus={() => setShowCoHostDropdown(true)}
                          placeholder="Search community organizers..."
                          className="w-full pl-9 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Dropdown Results */}
                      {showCoHostDropdown && coHostSearchQuery.trim().length >= 2 && (
                        <div className="absolute z-50 w-full mt-1 rounded-lg bg-zinc-900/95 border border-white/10 backdrop-blur-xl shadow-2xl max-h-60 overflow-y-auto">
                          {isSearchingCoHosts ? (
                            <div className="px-4 py-3 text-gray-400 text-sm text-center">Searching...</div>
                          ) : coHostSearchResults.length === 0 ? (
                            <div className="px-4 py-3 text-gray-400 text-sm text-center">No organizers found</div>
                          ) : (
                            coHostSearchResults
                              .filter(org => !selectedCoHosts.some(s => s._id === org._id))
                              .map((organizer) => (
                                <button
                                  key={organizer._id}
                                  type="button"
                                  onClick={() => {
                                    if (selectedCoHosts.length >= 2) {
                                      toast.error('Maximum 2 co-hosts allowed per event');
                                      return;
                                    }
                                    setSelectedCoHosts(prev => [...prev, organizer]);
                                    setCoHostSearchQuery("");
                                    setCoHostSearchResults([]);
                                    setShowCoHostDropdown(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    {organizer.profilePicture ? (
                                      <img src={organizer.profilePicture} alt={organizer.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      <span className="text-xs text-white font-bold">{organizer.name?.charAt(0)}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{organizer.name}</p>
                                    <p className="text-gray-400 text-xs truncate">
                                      {organizer.communityProfile?.communityName || organizer.email}
                                    </p>
                                  </div>
                                  <UserPlus className="h-4 w-4 text-[#7878E9] flex-shrink-0" />
                                </button>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                    )}

                    <p className="text-xs text-gray-400 italic">
                      💡 Co-hosts will receive a request and can accept or decline from their dashboard (max 2)
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Photo - Moved to last */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Upload photo <span className="text-red-400">*</span>
                </label>
                <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-white text-sm font-medium mb-2">
                    Choose a file or drag & drop it here
                  </h3>
                  <p className="text-gray-400 text-xs mb-4">
                    JPEG, PNG, GIF and WebP formats, up to 5MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || uploadedImages.length >= 5}
                    className="px-6 py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background:
                        "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                    }}
                  >
                    {isUploading ? "Uploading..." : "Browse File"}
                  </button>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {uploadedImages.map((image) => (
                      <div key={image.public_id} className="relative group">
                        <img
                          src={getOptimizedCloudinaryUrl(image.url)}
                          alt="Event preview"
                          className="w-full h-20 object-cover rounded-lg border border-white/10"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.public_id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg text-white font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                style={{
                  background:
                    "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isEditMode ? "Updating Event..." : "Creating Event..."}
                  </div>
                ) : isEditMode ? (
                  "Update Event"
                ) : (
                  "Create Event"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal - disabled for now */}
      {/* {cropperFile && (
        <ImageCropper
          file={cropperFile}
          onComplete={(blob) => {
            setCropperFile(null);
            uploadEventImages(blob);
          }}
          onCancel={() => setCropperFile(null)}
        />
      )} */}
    </div>
  );
};
export default EventCreation;
