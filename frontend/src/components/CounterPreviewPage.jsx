import React from 'react';
import { ArrowLeft, Check, X, Edit, Send, Eye } from 'lucide-react';

const CounterPreviewPage = ({
  sections,
  fieldResponses,
  onBack,
  onSubmit,
  submitting,
  submitLabel,
  proposerName,
  subtitle
}) => {
  // Count responses
  const counts = { accepted: 0, modified: 0, declined: 0 };
  Object.values(fieldResponses).forEach(r => {
    if (r.action === 'accept') counts.accepted++;
    else if (r.action === 'modify') counts.modified++;
    else if (r.action === 'decline') counts.declined++;
  });

  const formatValue = (value) => {
    if (!value) return 'Not specified';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      // Handle sub-option objects like {brand_awareness: true, product_trials: true}
      const selected = Object.entries(value)
        .filter(([, v]) => v === true || (v && v.selected === true))
        .map(([key]) => key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      if (selected.length > 0) return selected.join(', ');
      // Fallback: try to show as readable text
      return JSON.stringify(value);
    }
    return String(value);
  };

  const renderBadge = (action) => {
    if (action === 'accept') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-900/40 text-green-400 border border-green-700/50">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          ACCEPTED
        </span>
      );
    }
    if (action === 'modify') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-900/40 text-yellow-400 border border-yellow-700/50">
          <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
          MODIFIED
        </span>
      );
    }
    if (action === 'decline') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-900/40 text-red-400 border border-red-700/50">
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
          DECLINED
        </span>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back to edit */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Edit</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">REVIEW YOUR RESPONSE</h1>
        <p className="text-gray-400">{subtitle}</p>
      </div>

      {/* Response Summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
        <h3 className="font-bold text-lg mb-4 tracking-wide">RESPONSE SUMMARY</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
              <span className="text-xs font-bold text-green-400 tracking-wider">ACCEPTED</span>
            </div>
            <p className="text-4xl font-bold text-white">{counts.accepted}</p>
          </div>
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <span className="text-xs font-bold text-yellow-400 tracking-wider">MODIFIED</span>
            </div>
            <p className="text-4xl font-bold text-white">{counts.modified}</p>
          </div>
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="text-xs font-bold text-red-400 tracking-wider">DECLINED</span>
            </div>
            <p className="text-4xl font-bold text-white">{counts.declined}</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, sectionIndex) => {
        // Filter to only fields that have a response
        const respondedFields = section.fields.filter(f => fieldResponses[f.key]);
        if (respondedFields.length === 0) return null;

        return (
          <div key={sectionIndex} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
              >
                {sectionIndex + 1}
              </div>
              <h2 className="text-xl font-bold tracking-wide">{section.title}</h2>
            </div>

            {/* Fields */}
            {respondedFields.map((field) => {
              const response = fieldResponses[field.key];
              if (!response) return null;

              return (
                <div
                  key={field.key}
                  className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4 mb-4 last:mb-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white mb-1">{field.label}</h4>
                      <p className="text-sm text-gray-400">
                        {proposerName} proposed: {formatValue(field.originalValue)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {renderBadge(response.action)}
                    </div>
                  </div>

                  {/* Show counter offer for modified fields */}
                  {response.action === 'modify' && response.modifiedValue && (
                    <div className="mt-3 bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-3">
                      <p className="text-yellow-400 text-xs font-bold mb-1 tracking-wider">YOUR COUNTER OFFER</p>
                      <p className="text-yellow-300 text-sm">{formatValue(response.modifiedValue)}</p>
                    </div>
                  )}

                  {/* Show note if present */}
                  {response.note && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Note: {response.note}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Submit Button */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 text-center mb-8">
        <h3 className="font-bold text-lg mb-2">READY TO RESPOND?</h3>
        <p className="text-gray-400 text-sm mb-4">
          {subtitle}
        </p>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full py-4 hover:opacity-90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
        >
          <Send className="h-5 w-5" />
          {submitting ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </div>
  );
};

export default CounterPreviewPage;
