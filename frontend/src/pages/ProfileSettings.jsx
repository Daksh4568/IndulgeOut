import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Mail, Phone, MapPin, Briefcase, Save, X, Upload, Trash2, Edit, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';

export default function ProfileSettings() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    bio: '',
    location: {
      city: '',
      state: '',
      country: 'India'
    }
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
        location: {
          city: user.location?.city || '',
          state: user.location?.state || '',
          country: user.location?.country || 'India'
        }
      });
      setProfilePicture(user.profilePicture);
      setPreviewImage(user.profilePicture);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!previewImage || previewImage === profilePicture) {
      setMessage({ type: 'error', text: 'Please select a new image' });
      return;
    }

    setIsUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/users/upload-profile-picture', {
        imageData: previewImage
      });

      if (response.data.success) {
        setProfilePicture(response.data.profilePicture);
        await refreshUser();
        setMessage({ type: 'success', text: 'Profile picture uploaded successfully!' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to upload profile picture' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!profilePicture) return;

    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setIsUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.delete('/users/profile-picture');

      if (response.data.success) {
        setProfilePicture(null);
        setPreviewImage(null);
        await refreshUser();
        setMessage({ type: 'success', text: 'Profile picture removed successfully!' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to remove profile picture' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/users/profile', formData);

      if (response.data.user) {
        await refreshUser();
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false); // Exit edit mode after successful save
      }
    } catch (error) {
      console.error('Save profile error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getUserTypeLabel = () => {
    if (!user) return 'User';
    if (user.role === 'admin') return 'Admin';
    if (user.role === 'host_partner') {
      if (user.hostPartnerType === 'community_organizer') return 'Community Organizer';
      if (user.hostPartnerType === 'venue') return 'Venue Partner';
      if (user.hostPartnerType === 'brand_sponsor') return 'Brand Sponsor';
    }
    return 'Member';
  };

  const getInitials = () => {
    if (!user?.name) return '?';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
              Profile Settings
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your profile information and preferences
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-transparent text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border border-gray-300 dark:border-gray-700"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-transparent text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border border-gray-300 dark:border-gray-700"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })}>
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profile Picture
              </h2>
              
              <div className="flex flex-col items-center">
                {/* Profile Picture Display */}
                <div className="relative mb-4">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="h-32 w-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-200 dark:border-gray-700">
                      {getInitials()}
                    </div>
                  )}
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Change picture"
                  >
                    <Camera className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* User Type Badge */}
                <div className="mb-4 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                  {getUserTypeLabel()}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="w-full space-y-2">
                    {previewImage && previewImage !== profilePicture && (
                      <button
                        onClick={handleUploadProfilePicture}
                        disabled={isUploading}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{isUploading ? 'Uploading...' : 'Upload New Picture'}</span>
                      </button>
                    )}
                    
                    {profilePicture && (
                      <button
                        onClick={handleDeleteProfilePicture}
                        disabled={isUploading}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remove Picture</span>
                      </button>
                    )}
                  </div>
                )}

                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Recommended: Square image, at least 400x400px<br/>
                  Max file size: 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Profile Information Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSaveProfile} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Personal Information
              </h2>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Briefcase className="h-4 w-4 inline mr-2" />
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows="4"
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-white transition-colors resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  ></textarea>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Location
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      name="location.city"
                      value={formData.location.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="City"
                      className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <input
                      type="text"
                      name="location.state"
                      value={formData.location.state}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="State"
                      className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <input
                      type="text"
                      name="location.country"
                      value={formData.location.country}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Country"
                      className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-gray-900 dark:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Save Button */}
                {isEditing && (
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form data to original user data
                        setFormData({
                          name: user.name || '',
                          email: user.email || '',
                          phoneNumber: user.phoneNumber || '',
                          bio: user.bio || '',
                          location: {
                            city: user.location?.city || '',
                            state: user.location?.state || '',
                            country: user.location?.country || 'India'
                          }
                        });
                      }}
                      className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
