import React from 'react';
import { Flame, ShieldCheck, Eye } from 'lucide-react';

const PropertyAnalyticsBadge = ({ demand, locationAnalytics, viewsCount }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 my-2">
      {demand && (
        <span className={`badge ${demand.level === 'High Demand' ? 'badge-danger' : demand.level === 'Popular' ? 'badge-gold' : 'badge-neutral'}`}>
          <Flame className="w-3 h-3" />
          {demand.level}
        </span>
      )}

      {locationAnalytics && (
        <span className="badge badge-accent" title="Location & Amenities Score">
          <ShieldCheck className="w-3.5 h-3.5" />
          Area score {locationAnalytics.overallScore}/10
        </span>
      )}

      {viewsCount !== undefined && (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium ml-auto" style={{ color: 'var(--ink-faint)' }}>
          <Eye className="w-3 h-3" /> {viewsCount} views
        </span>
      )}
    </div>
  );
};

export default PropertyAnalyticsBadge;
