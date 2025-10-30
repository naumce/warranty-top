import { useState, useEffect } from "react";
import { toast } from "sonner";

interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export const useUserLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(() => {
    // Try to load from localStorage
    const stored = localStorage.getItem("user_location");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if location is less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse stored location", e);
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      const err = "Geolocation is not supported by your browser";
      setError(err);
      toast.error(err);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        };
        
        setLocation(newLocation);
        localStorage.setItem("user_location", JSON.stringify(newLocation));
        setLoading(false);
        toast.success("📍 Location saved!");
      },
      (error) => {
        let errorMsg = "Failed to get location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMsg = "Location request timed out.";
            break;
        }
        
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Auto-request on mount if no location
  useEffect(() => {
    if (!location && !loading && !error) {
      // Don't auto-request, let user initiate
      // requestLocation();
    }
  }, []);

  return {
    location,
    loading,
    error,
    requestLocation,
    hasLocation: !!location,
  };
};

