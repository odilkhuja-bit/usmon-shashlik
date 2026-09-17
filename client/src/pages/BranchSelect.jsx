// ============================================
// USMON SHASHLIK — Branch Select Page
// ============================================

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { t, getBranchName, getBranchAddress } from '../utils/i18n';
import { calculateDistance, formatDistance } from '../utils/helpers';
import { haptic } from '../utils/telegram';

export default function BranchSelect({ onSelect }) {
  const { branches, language } = useApp();
  const [userLocation, setUserLocation] = useState(null);
  const [sortedBranches, setSortedBranches] = useState([]);

  useEffect(() => {
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(null),
        { timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    if (branches.length === 0) return;

    if (userLocation) {
      const withDistance = branches.map((b) => ({
        ...b,
        distance: calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude),
      }));
      withDistance.sort((a, b) => a.distance - b.distance);
      setSortedBranches(withDistance);
    } else {
      setSortedBranches(branches.map((b) => ({ ...b, distance: null })));
    }
  }, [branches, userLocation]);

  const handleSelect = (branch) => {
    haptic('medium');
    onSelect(branch);
  };

  const openMap = (branch, e) => {
    e.stopPropagation();
    window.open(`https://maps.google.com/?q=${branch.latitude},${branch.longitude}`, '_blank');
  };

  return (
    <div className="branch-select-page">
      <h1 className="branch-select-title">{t('branch_select_title', language)}</h1>
      <p className="branch-select-subtitle">{t('branch_select_subtitle', language)}</p>

      <div style={{ flex: 1 }}>
        {sortedBranches.map((branch, index) => (
          <div
            key={branch.id}
            className={`branch-card ${index === 0 && branch.distance !== null ? 'nearest' : ''}`}
            onClick={() => handleSelect(branch)}
          >
            {index === 0 && branch.distance !== null && (
              <div className="branch-card-nearest-badge">
                {t('nearest_branch', language)}
              </div>
            )}

            <div className="branch-card-name">{getBranchName(branch, language)}</div>

            <div className="branch-card-info">
              📍 {getBranchAddress(branch, language)}
            </div>

            <div className="branch-card-info">
              🕐 {t('working_hours', language)}: {branch.workingHours}
            </div>

            {branch.phone && (
              <div className="branch-card-info">
                📞 {branch.phone}
              </div>
            )}

            {branch.distance !== null && (
              <div className="branch-card-distance">
                {formatDistance(branch.distance)}
              </div>
            )}

            <button className="branch-card-map" onClick={(e) => openMap(branch, e)}>
              {t('map_view', language)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
