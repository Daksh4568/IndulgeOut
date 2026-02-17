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
import { api, API_URL } from "../config/api.js";
import { useAuth } from "../contexts/AuthContext";
import { ToastContext } from "../App";
import { COMMUNITIES } from "../constants/eventConstants";
import locationService from "../services/locationService";

// 6 Fixed Categories for consistency across the website
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
    time: "",
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
      currency: "USD",
    },
    community: "",
    coHosts: [],
    requirements: [],
    isPrivate: false,
    groupingOffers: {
      enabled: false,
      tiers: [
        { label: "Single", people: 1, price: 0 },
        { label: "", people: 0, price: 0 },
        { label: "", people: 0, price: 0 },
        { label: "", people: 0, price: 0 },
      ],
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [showCoHostDropdown, setShowCoHostDropdown] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
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

        // Populate form with existing event data
        setFormData({
          title: event.title || "",
          description: event.description || "",
          categories: event.categories || [],
          date: formattedDate,
          time: event.time || "",
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
          groupingOffers: event.groupingOffers || {
            enabled: false,
            tiers: [
              { label: "Single", people: 1, price: 0 },
              { label: "", people: 0, price: 0 },
              { label: "", people: 0, price: 0 },
              { label: "", people: 0, price: 0 },
            ],
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
        
        // Sync price.amount with Single tier price
        if (name === "price.amount" && prev.groupingOffers.enabled) {
          const newTiers = [...prev.groupingOffers.tiers];
          newTiers[0] = { ...newTiers[0], price: Number(value) };
          newFormData.groupingOffers = {
            ...prev.groupingOffers,
            tiers: newTiers,
          };
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
    setFormData((prev) => ({
      ...prev,
      groupingOffers: {
        ...prev.groupingOffers,
        enabled: checked,
      },
    }));
  };

  const handleGroupingTierChange = (index, field, value) => {
    setFormData((prev) => {
      const newTiers = [...prev.groupingOffers.tiers];
      newTiers[index] = {
        ...newTiers[index],
        [field]: field === 'price' || field === 'people' ? Number(value) : value,
      };
      
      // Auto-update label when people count changes (except for index 0 which is "Single")
      if (field === 'people' && index > 0 && value) {
        newTiers[index].label = `Group of ${value}`;
      }
      
      const newFormData = {
        ...prev,
        groupingOffers: {
          ...prev.groupingOffers,
          tiers: newTiers,
        },
      };
      
      // Sync Single tier price with main price.amount
      if (index === 0 && field === 'price') {
        newFormData.price = {
          ...prev.price,
          amount: Number(value),
        };
      }
      
      return newFormData;
    });
  };

  const handleCategoryToggle = (category) => {
    const categoryName = category.name;
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryName)
        ? prev.categories.filter((c) => c !== categoryName)
        : [...prev.categories, categoryName].slice(0, 3), // Max 3 categories
    }));
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

  const openCloudinaryWidget = () => {
    setIsUploading(true);

    // Create the Cloudinary upload widget
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: "dtxgkrfdn", // Your cloud name
        uploadPreset: "indulgeout_events", // Your upload preset name
        multiple: true,
        maxFiles: 5,
        resourceType: "image",
        clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
        maxFileSize: 5000000, // 5MB
        folder: "indulgeout/events", // Organize uploads in folders
        cropping: false, // Disable cropping for now
        showUploadMoreButton: true,
        styles: {
          palette: {
            window: "#000000",
            sourceBg: "#000000",
            windowBorder: "#8E9FBC",
            tabIcon: "#FFFFFF",
            inactiveTabIcon: "#8E9FBC",
            menuIcons: "#CCE8FF",
            link: "#408FC6",
            action: "#408FC6",
            inProgress: "#00BFFF",
            complete: "#20B832",
            error: "#EA2727",
            textDark: "#000000",
            textLight: "#FFFFFF",
          },
        },
        text: {
          en: {
            or: "or",
            back: "Back",
            advanced: "Advanced",
            close: "Close",
            no_results: "No Results",
          },
        },
      },
      (error, result) => {
        setIsUploading(false);

        if (error) {
          console.error("Upload error:", error);
          toast.error("Error uploading image. Please try again.");
          return;
        }

        if (result.event === "success") {
          setUploadedImages((prev) => [
            ...prev,
            {
              url: result.info.secure_url,
              public_id: result.info.public_id,
              id: result.info.public_id,
            },
          ]);
        }

        if (result.event === "close") {
          widget.destroy();
        }
      },
    );

    widget.open();
  };

  const removeImage = (publicId) => {
    setUploadedImages((prev) =>
      prev.filter((img) => img.public_id !== publicId),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Event data:", formData);

      // Prepare the event data for the API
      const eventData = {
        ...formData,
        maxParticipants: parseInt(formData.maxParticipants),
        date: formData.date,
        time: formData.time,
        images: uploadedImages.map((img) => img.url), // Send Cloudinary URLs
      };

      let response;
      if (isEditMode) {
        // Update existing event
        response = await api.put(`/events/${eventId}`, eventData);
        console.log("Event updated successfully:", response.data);
        toast.success("Event updated successfully!");
      } else {
        // Create new event
        response = await api.post("/events", eventData);
        console.log("Event created successfully:", response.data);
        toast.success("Event created successfully!");
      }

      // Navigate back to dashboard
      navigate("/organizer/dashboard");
    } catch (error) {
      console.error(
        `Failed to ${isEditMode ? "update" : "create"} event:`,
        error,
      );
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
      } else {
        toast.error(
          "Network error. Please check if the backend server is running.",
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
      <div className="relative z-10">
        <NavigationBar />
      </div>

      {/* Form Container */}
      <div className="relative z-10 flex items-center justify-center px-4 py-8 min-h-[calc(100vh-80px)]">
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
                  <div className="absolute z-50 mt-2 w-full bg-zinc-900 border border-white/10 rounded-lg shadow-xl max-h-64 overflow-y-auto">
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
                            {category.emoji} {category.name}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Date <span className="text-red-400">*</span>
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
                  <label className="block text-white text-sm font-medium mb-2">
                    Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
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
                      <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
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
                    Price
                  </label>
                  <input
                    type="number"
                    name="price.amount"
                    value={formData.price.amount}
                    onChange={handleInputChange}
                    placeholder="₹0"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Grouping Offers */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="groupingOffers"
                    checked={formData.groupingOffers.enabled}
                    onChange={(e) => handleGroupingOfferToggle(e.target.checked)}
                    className="h-4 w-4 rounded focus:ring-[#7878E9] border-white/10 bg-white/5"
                    style={{ accentColor: '#7878E9' }}
                  />
                  <label htmlFor="groupingOffers" className="text-white text-sm font-medium cursor-pointer">
                    Grouping Offers
                  </label>
                </div>

                {formData.groupingOffers.enabled && (
                  <div className="space-y-3 pl-6 border-l-2 border-white/10">
                    {formData.groupingOffers.tiers.map((tier, index) => (
                      <div key={index} className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-white text-xs font-medium mb-1">
                            {index === 0 ? 'Label (Fixed)' : (tier.people > 0 ? `Group of ${tier.people} - People` : `Group ${index + 1} - People`)}
                          </label>
                          {index === 0 ? (
                            <input
                              type="text"
                              value={tier.label}
                              disabled
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm opacity-50 cursor-not-allowed"
                            />
                          ) : (
                            <input
                              type="number"
                              value={tier.people}
                              onChange={(e) => handleGroupingTierChange(index, 'people', e.target.value)}
                              placeholder="No. of people"
                              min="2"
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-white text-xs font-medium mb-1">
                            Price (₹)
                          </label>
                          <input
                            type="number"
                            value={tier.price}
                            onChange={(e) => handleGroupingTierChange(index, 'price', e.target.value)}
                            placeholder="₹0"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent"
                          />
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-gray-400 italic mt-2">
                      💡 Set different prices for single tickets and group bookings
                    </p>
                  </div>
                )}
              </div>

              {/* Co-host */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Co-host (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setShowCoHostDropdown(!showCoHostDropdown)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-left text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7878E9] focus:border-transparent flex items-center justify-between"
                >
                  <span>Select Co-host</span>
                  <ChevronDown className="h-5 w-5" />
                </button>
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
                    JPEG, PNG, JPEG and MP4 formats, up to 50MB
                  </p>
                  <button
                    type="button"
                    onClick={openCloudinaryWidget}
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
                          src={image.url}
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
    </div>
  );
};
export default EventCreation;
