import React from 'react';
import { Info, Users, TrendingUp, RefreshCw, Award } from 'lucide-react';

const AudienceProofCard = ({ audienceProof, initiatorName }) => {
  if (!audienceProof) return null;

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'Not provided';
    }
    // Handle {selected: true/false, value: 'xxx'} objects
    if (typeof value === 'object' && value !== null) {
      if ('value' in value) {
        return value.selected ? String(value.value || 'Not provided') : 'Not provided';
      }
      if ('selected' in value) {
        return value.selected ? 'Yes' : 'No';
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800" style={{ background: 'linear-gradient(to right, rgba(120,120,233,0.05), rgba(61,61,212,0.05))' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Audience Proof</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Reference information from {initiatorName}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400 flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>This information is provided as reference only and cannot be edited in the workspace.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Past Sponsor Brands */}
          {audienceProof.pastSponsorBrands !== null && (
            <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4" style={{ color: '#7878E9' }} />
                <span className="text-sm font-medium text-gray-400">Past Sponsor Brands</span>
              </div>
              <p className="text-white text-sm break-words whitespace-pre-wrap">
                {formatValue(audienceProof.pastSponsorBrands)}
              </p>
            </div>
          )}

          {/* Average Attendance */}
          {audienceProof.averageAttendance !== null && (
            <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-400">Average Attendance</span>
              </div>
              <p className="text-white text-2xl font-bold">
                {formatValue(audienceProof.averageAttendance)}
              </p>
            </div>
          )}

          {/* Community Size */}
          {audienceProof.communitySize !== null && (
            <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" style={{ color: '#7878E9' }} />
                <span className="text-sm font-medium text-gray-400">Community Size</span>
              </div>
              <p className="text-white text-2xl font-bold">
                {formatValue(audienceProof.communitySize)}
              </p>
            </div>
          )}

          {/* Repeat Event Rate */}
          {audienceProof.repeatEventRate !== null && (
            <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-gray-400">Repeat Event Rate</span>
              </div>
              <p className="text-white text-sm">
                {formatValue(audienceProof.repeatEventRate)}
              </p>
            </div>
          )}
        </div>

        {/* No data message */}
        {!audienceProof.pastSponsorBrands && 
         !audienceProof.averageAttendance && 
         !audienceProof.communitySize && 
         !audienceProof.repeatEventRate && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No audience proof data provided</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudienceProofCard;
