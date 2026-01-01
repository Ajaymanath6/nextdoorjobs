"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import themeClasses from "../../theme-utility-classes.json";
import {
  EarthFilled,
  List,
  Filter,
  Return,
  SendFilled,
  IbmWatsonDiscovery,
} from "@carbon/icons-react";
import { RiArrowDownSLine, RiSearchLine } from "@remixicon/react";
import FilterDropdown from "./FilterDropdown";
import LocalityAutocomplete from "./LocalityAutocomplete";
import JobTitleAutocomplete from "./JobTitleAutocomplete";

// Import CSS files (Next.js handles these)
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Dynamic import of Leaflet to avoid SSR issues
const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGlobeView, setIsGlobeView] = useState(true);
  const [selectedFilterOption, setSelectedFilterOption] = useState(null);
  const [isHomeFilterActive, setIsHomeFilterActive] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showHomeLocationDropdown, setShowHomeLocationDropdown] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showJobAutocomplete, setShowJobAutocomplete] = useState(false);
  const [localities, setLocalities] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [homeLocation, setHomeLocation] = useState("");
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [isFindingJobs, setIsFindingJobs] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const autocompleteRef = useRef(null);
  const jobAutocompleteRef = useRef(null);
  const searchInputRef = useRef(null);
  const userLocationMarkerRef = useRef(null);

  const searchBar = themeClasses.components.searchBar;
  const brand = themeClasses.brand;
  const markers = themeClasses.components.markers;
  const homeMarkerRef = useRef(null);
  const companyMarkersRef = useRef([]);
  const straightLinesRef = useRef([]);
  const clusterGroupRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const filterButtonRef = useRef(null);
  const [locationsData, setLocationsData] = useState(null);
  const [companyDistances, setCompanyDistances] = useState({});

  // Load locations data (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/data/locations.json")
        .then((response) => response.json())
        .then((data) => {
          setLocationsData(data);
        })
        .catch((error) => {
          console.error("Error loading locations data:", error);
        });
    }
  }, []);

  // Load localities for autocomplete
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/api/localities")
        .then((response) => response.json())
        .then((data) => {
          setLocalities(data);
          console.log(`✅ Loaded ${data.length} localities for autocomplete`);
        })
        .catch((error) => {
          console.error("Error loading localities:", error);
        });
    }
  }, []);

  // Load job titles for autocomplete
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/api/job-titles")
        .then((response) => response.json())
        .then((data) => {
          setJobTitles(data);
          console.log(`✅ Loaded ${data.length} job titles for autocomplete`);
        })
        .catch((error) => {
          console.error("Error loading job titles:", error);
        });
    }
  }, []);

  // Cleanup markers and lines on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        // Remove home marker
        if (homeMarkerRef.current) {
          mapInstanceRef.current.removeLayer(homeMarkerRef.current);
        }
        // Remove user location marker
        if (userLocationMarkerRef.current) {
          mapInstanceRef.current.removeLayer(userLocationMarkerRef.current);
        }
        // Remove company markers
        if (clusterGroupRef.current) {
          mapInstanceRef.current.removeLayer(clusterGroupRef.current);
        }
        // Remove lines
        straightLinesRef.current.forEach((line) => {
          mapInstanceRef.current.removeLayer(line);
        });
        straightLinesRef.current = [];
      }
    };
  }, []);

  // Calculate optimal padding based on pin count
  const calculateOptimalPadding = (pinCount) => {
    if (pinCount <= 3) return 80;   // 80px padding for 1-3 pins
    if (pinCount <= 10) return 120;  // 120px padding for 4-10 pins
    return 150;                      // 150px padding for 11+ pins
  };

  // Distance calculation function using OSRM API
  const fetchRoadDistance = async (start, end) => {
    try {
      // OSRM API: lon,lat format, overview=false to get only distance
      const url = `http://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=false`;
      
      const response = await fetch(url, {
        headers: { "User-Agent": "NextDoorJobs/1.0" },
      });

      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        // Return distance in meters
        return data.routes[0].distance;
      }

      return null;
    } catch (error) {
      console.error("Error fetching road distance:", error);
      return null;
    }
  };

  // Calculate distances for all companies
  const calculateDistances = async (homeLoc, companies, map) => {
    if (!homeLoc || !homeLoc.lat || !homeLoc.lon || !map) return {};

    const distances = {};
    const homeCoords = [homeLoc.lat, homeLoc.lon];

    await Promise.all(
      companies.map(async (company) => {
        const companyCoords = [company.lat, company.lon];
        const roadDistanceMeters = await fetchRoadDistance(
          homeCoords,
          companyCoords
        );

        if (roadDistanceMeters !== null) {
          distances[company.name] = (roadDistanceMeters / 1000).toFixed(1);
        } else {
          // Fallback to straight-line distance
          const straightDistance = map.distance(homeCoords, companyCoords);
          distances[company.name] = (straightDistance / 1000).toFixed(1);
        }
      })
    );

    return distances;
  };

  // Create home icon function
  const createHomeIcon = (L) => {
    return L.divIcon({
      html: `<div style="background-color:#FFFFFF;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #E5E5E5;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏠</div>`,
      className: "home-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  // Render company markers with popups
  const renderCompanyMarkers = (companies) => {
    if (!mapInstanceRef.current || !window.L) return;

    const L = window.L;

    // Clear existing company markers
    if (clusterGroupRef.current) {
      mapInstanceRef.current.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    companyMarkersRef.current = [];

    // Create new cluster group
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 15,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="background-color:#7c00ff;color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
          className: 'marker-cluster-custom',
          iconSize: L.point(40, 40),
        });
      },
    });
    clusterGroupRef.current = clusterGroup;

    // Create markers for each company
    companies.forEach((company, index) => {
      const logoUrl = company.logoUrl || null;
      const customIcon = createCustomTeardropIcon(L, logoUrl, 50, null);

      const marker = L.marker([company.latitude, company.longitude], {
        icon: customIcon,
        zIndexOffset: 1000 + index,
        opacity: 1,
      });

      // Store company data on marker
      marker.companyData = company;

      // Create popup content
      const popupContent = `
        <div style="font-family: 'Open Sans', sans-serif; padding: 4px;">
          <div style="font-weight: 600; font-size: 14px; color: #0A0A0A; margin-bottom: 4px;">
            ${company.company_name}
          </div>
          <div style="font-size: 12px; color: #1A1A1A;">
            ${company.type}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: "company-popup",
      });

      clusterGroup.addLayer(marker);
      companyMarkersRef.current.push(marker);
    });

    // Add cluster group to map
    mapInstanceRef.current.addLayer(clusterGroup);
  };

  // Perform district-level zoom (state → district, stops at district)
  const performDistrictZoom = (dbData, showNoCompaniesMessage = false) => {
    if (!mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const state = dbData.state; // "Kerala"
    const district = dbData.district; // "Thrissur"

    // Use database coordinates if available, otherwise use default
    const hasCoordinates = dbData.latitude && dbData.longitude;
    const districtCenter = hasCoordinates 
      ? [dbData.latitude, dbData.longitude]
      : [10.5276, 76.2144]; // Default Thrissur center

    // Calculate state center (Kerala center - Thrissur area)
    const stateCenter = [10.5276, 76.2144]; // Kerala center (Thrissur area)

    // Stage 1: Fly to State (zoom 8)
    mapInstanceRef.current.flyTo(stateCenter, 8, {
      duration: 1.5,
      easeLinearity: 0.25,
    });

    // Stage 2: After Stage 1 completes, fly to District (zoom 11) and stop here
    mapInstanceRef.current.once("moveend", () => {
      setTimeout(() => {
        mapInstanceRef.current.flyTo(districtCenter, 11, {
          duration: 1.5,
          easeLinearity: 0.25,
        });

        // After district zoom completes, show "No companies found" message if needed
        mapInstanceRef.current.once("moveend", () => {
          if (showNoCompaniesMessage) {
            // Show a temporary message on the map
            const noCompaniesMessage = L.popup({
              className: "no-companies-message",
              closeButton: true,
              autoClose: false,
              closeOnClick: false,
            })
              .setLatLng(districtCenter)
              .setContent(`
                <div style="font-family: 'Open Sans', sans-serif; padding: 12px; text-align: center;">
                  <div style="font-weight: 600; font-size: 16px; color: #0A0A0A; margin-bottom: 8px;">
                    No Companies Found
                  </div>
                  <div style="font-size: 14px; color: #1A1A1A;">
                    No companies available for ${dbData.localityName || district} at this time.
                  </div>
                </div>
              `)
              .openOn(mapInstanceRef.current);

            // Auto-close after 5 seconds
            setTimeout(() => {
              if (noCompaniesMessage && mapInstanceRef.current) {
                mapInstanceRef.current.closePopup(noCompaniesMessage);
              }
            }, 5000);
          }
          
          // Hide loading after zoom completes
          setTimeout(() => {
            setIsFindingJobs(false);
            setIsMapLoading(false);
          }, 300);
        });
      }, 500); // Small delay between stages
    });
  };

  // Perform multi-stage zoom animation for locality search with database data
  const performLocalitySearchWithDBData = (dbData, localityData) => {
    if (!mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const companies = localityData.companies;
    const state = dbData.state; // "Kerala"
    const district = dbData.district; // "Thrissur"

    // Use database coordinates if available, otherwise fall back to locations.json
    const hasCoordinates = dbData.latitude && dbData.longitude;
    const localityCenter = hasCoordinates
      ? [dbData.latitude, dbData.longitude]
      : [localityData.center.lat, localityData.center.lon];

    // Calculate state center (Kerala center - Thrissur area)
    const stateCenter = [10.5276, 76.2144]; // Kerala center (Thrissur area)
    
    // Use database coordinates for district center if available
    const districtCenter = hasCoordinates
      ? [dbData.latitude, dbData.longitude]
      : [10.5276, 76.2144]; // Default Thrissur center

    // Stage 1: Fly to State (zoom 8)
    mapInstanceRef.current.flyTo(stateCenter, 8, {
      duration: 1.5,
      easeLinearity: 0.25,
    });

    // Stage 2: After Stage 1 completes, fly to District (zoom 11)
    mapInstanceRef.current.once("moveend", () => {
      setTimeout(() => {
        mapInstanceRef.current.flyTo(districtCenter, 11, {
          duration: 1.5,
          easeLinearity: 0.25,
        });

        // Stage 3: After Stage 2 completes, fly to Locality (zoom 15)
        mapInstanceRef.current.once("moveend", () => {
          mapInstanceRef.current.flyTo(localityCenter, 15, {
            duration: 1.5,
            easeLinearity: 0.25,
          });

          // After final zoom, render company markers
          mapInstanceRef.current.once("moveend", () => {
            renderCompanyMarkers(companies);
            
            // Hide loading after markers are added
            setTimeout(() => {
              setIsFindingJobs(false);
              setIsMapLoading(false);
            }, 300); // Small delay to ensure markers are visible
          });
        });
      }, 500); // Small delay between stages
    });
  };

  // Create company marker icon function
  const createCustomTeardropIcon = (L, logoUrl = null, size = 50, distanceKm = null) => {
    const boxSize = size;
    const lightBlueBorder = "#87CEEB";

    // Distance badge HTML
    const badgeHtml =
      distanceKm !== null
        ? `<div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);background-color:#0A0A0A;color:white;border-radius:4px;padding:2px 6px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.3);pointer-events:none;z-index:1000;">${distanceKm} km</div>`
        : "";

    // Main marker HTML
    const html = `<div class="company-marker" style="position:relative;width:${boxSize}px;height:${boxSize}px;background-color:#FFFFFF;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 2px 8px rgba(0,0,0,0.12),0 1px 3px rgba(0,0,0,0.08);border:2px solid ${lightBlueBorder};cursor:pointer;transition:transform 0.2s ease,box-shadow 0.2s ease;overflow:visible;">${
      logoUrl
        ? `<img src="${logoUrl}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" />`
        : `<div style="width:100%;height:100%;background:#7c00ff;border-radius:6px;"></div>`
    }${badgeHtml}</div>`;

    return L.divIcon({
      html: html,
      className: "custom-pindrop-marker",
      iconSize: [boxSize, boxSize + (distanceKm !== null ? 20 : 0)],
      iconAnchor: [
        boxSize / 2,
        (boxSize + (distanceKm !== null ? 20 : 0)) / 2,
      ],
      popupAnchor: [0, -(boxSize + (distanceKm !== null ? 20 : 0)) - 10],
    });
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (!isClient || !mapRef.current || mapInstanceRef.current) return;

    // Dynamic import of Leaflet to avoid SSR issues
    import("leaflet").then((LModule) => {
      const L = LModule.default;
      
      // Make L available globally for markercluster
      window.L = L;

      // Import markercluster after L is available
      return import("leaflet.markercluster").then(() => {
        // Fix for default marker icon issue in React
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Set initial view to home location (Thrissur, Kerala)
        // Will be adjusted by fitBounds when markers are added
        const initialLat = 10.5276;
        const initialLon = 76.2144;
        const zoom = 10; // Default zoom, will be adjusted by fitBounds

        // Map initialization with exact configuration
        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
          zoomAnimation: true,
          zoomAnimationThreshold: 4,
        }).setView([initialLat, initialLon], zoom);

        // Tile layer with OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      });
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        // Remove all markers and lines
        if (homeMarkerRef.current) {
          mapInstanceRef.current.removeLayer(homeMarkerRef.current);
        }
        if (clusterGroupRef.current) {
          mapInstanceRef.current.removeLayer(clusterGroupRef.current);
        }
        straightLinesRef.current.forEach((line) => {
          mapInstanceRef.current.removeLayer(line);
        });
        straightLinesRef.current = [];
        
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // Clean up global L
      if (typeof window !== "undefined") {
        delete window.L;
      }
    };
  }, [isClient]);

  // Add markers when locations data and map are ready
  useEffect(() => {
    if (!mapInstanceRef.current || !locationsData) {
      return;
    }

    // Don't add markers if they already exist
    if (homeMarkerRef.current !== null) {
      return;
    }

    const addMarkersToMap = async () => {
      const L = window.L;
      if (!L || !mapInstanceRef.current) {
        // Retry after a short delay if L is not available yet
        setTimeout(() => {
          if (window.L && mapInstanceRef.current && locationsData) {
            addMarkersToMap();
          }
        }, 100);
        return;
      }

      const homeLoc = locationsData.homeLocation;
      const companies = locationsData.companies;

      if (!homeLoc || !homeLoc.lat || !homeLoc.lon) {
        return;
      }

      // Create home marker
      const homeIcon = createHomeIcon(L);
      const homeMarker = L.marker([homeLoc.lat, homeLoc.lon], {
        icon: homeIcon,
        zIndexOffset: 2000,
        interactive: true,
      }).addTo(mapInstanceRef.current);

      homeMarkerRef.current = homeMarker;

      // Simple tooltip for home marker
      homeMarker.bindTooltip(
        `<div style="font-weight:bold;color:#1A1A1A;font-size:14px;">${homeLoc.name || "Home"}</div>`,
        {
          permanent: false,
          direction: "right",
          offset: [10, 0],
          className: "home-panel-tooltip",
          interactive: true,
        }
      );

      // Click handler for home marker
      homeMarker.on("click", function () {
        if (homeMarker.isTooltipOpen()) {
          homeMarker.closeTooltip();
        } else {
          homeMarker.openTooltip();
        }
      });

      // Close tooltip on map click
      mapInstanceRef.current.on("click", function () {
        if (homeMarker.isTooltipOpen()) {
          homeMarker.closeTooltip();
        }
      });

      // Create company markers if companies exist
      if (companies && companies.length > 0) {
        // Create marker cluster group for companies
        const clusterGroup = L.markerClusterGroup();
        clusterGroupRef.current = clusterGroup;

        // Create company markers
        companies.forEach((company, index) => {
          const logoUrl = company.logoUrl || null;
          const customIcon = createCustomTeardropIcon(L, logoUrl, 50, null);

          const marker = L.marker([company.lat, company.lon], {
            icon: customIcon,
            zIndexOffset: 1000 + index,
            opacity: 1,
          });

          // Store company data on marker
          marker.companyData = company;

          // Click handler for company marker
          marker.on("click", function () {
            console.log("Company clicked:", company.name);
          });

          clusterGroup.addLayer(marker);
          companyMarkersRef.current.push(marker);
        });

        // Add cluster group to map
        mapInstanceRef.current.addLayer(clusterGroup);

        // Calculate bounds from all coordinates (home + companies)
        const allCoords = [
          [homeLoc.lat, homeLoc.lon],
          ...companies.map(c => [c.lat, c.lon])
        ];
        const lats = allCoords.map(c => c[0]);
        const lons = allCoords.map(c => c[1]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);

        // Add 10% coordinate padding
        const latPadding = (maxLat - minLat) * 0.1;
        const lonPadding = (maxLon - minLon) * 0.1;
        const bounds = L.latLngBounds(
          [minLat - latPadding, minLon - lonPadding],
          [maxLat + latPadding, maxLon + lonPadding]
        );

        // Calculate optimal pixel padding based on pin count
        const totalPinCount = 1 + companies.length; // home + companies
        const padding = calculateOptimalPadding(totalPinCount);

        // Determine max zoom level: 12 for Thrissur with 5+ companies, 14 for others
        // Check if location is Thrissur (based on coordinates or name)
        const isThrissur = 
          (homeLoc.lat >= 10.4 && homeLoc.lat <= 10.6 && homeLoc.lon >= 76.1 && homeLoc.lon <= 76.3) ||
          (homeLoc.name && homeLoc.name.toLowerCase().includes('thrissur'));
        const maxZoomLevel = isThrissur && companies.length >= 5 ? 12 : 14;

        // Use setTimeout to ensure markers are fully added before fitting bounds
        setTimeout(() => {
          // Create feature group from all markers
          const group = new L.featureGroup([
            homeMarker,
            ...companyMarkersRef.current,
          ]);
          
          // Get bounds
          const groupBounds = group.getBounds();
          
          // Pad the bounds (10% coordinate padding is already in bounds calculation)
          // Add additional pixel padding by expanding bounds
          const paddedBounds = groupBounds.pad(0.1);
          
          // Fit bounds with maxZoom limit
          // Note: Leaflet's fitBounds doesn't support padding option directly in older versions
          // So we use pad() on bounds and then fitBounds
          mapInstanceRef.current.fitBounds(paddedBounds, {
            maxZoom: maxZoomLevel,
          });
        }, 200);
      } else {
        // If no companies, center on home location
        mapInstanceRef.current.setView([homeLoc.lat, homeLoc.lon], 13);
      }
    };

    addMarkersToMap();
  }, [locationsData, isClient]);

  // Check if search query contains job-related keywords
  const isJobSearchQuery = (query) => {
    if (!query || !query.trim()) return false;
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // Phrases that indicate job search
    const jobPhrases = [
      'near me',
      'companies near me',
      'jobs near me',
      'hiring near me',
    ];
    
    // Check for exact phrases
    if (jobPhrases.some(phrase => normalizedQuery.includes(phrase))) {
      return true;
    }
    
    // Job-related keywords
    const jobKeywords = [
      'jobs', 'job', 'hiring', 'vacancy', 'vacancies', 'opening', 'openings',
      'engineer', 'developer', 'designer', 'analyst', 'manager', 'consultant',
      'specialist', 'coordinator', 'administrator', 'technician', 'assistant',
      'director', 'executive', 'officer', 'lead', 'senior', 'junior',
      'teacher', 'professor', 'tutor', 'lecturer', 'instructor',
      'doctor', 'nurse', 'pharmacist', 'therapist',
      'accountant', 'auditor', 'advisor',
      'architect', 'chef', 'lawyer', 'journalist', 'writer',
      'scientist', 'researcher', 'chemist', 'biologist', 'physicist',
    ];
    
    // Check if query contains any job keyword (exact or partial match)
    return jobKeywords.some(keyword => {
      // Check if keyword is in the query (for exact matches like "designer")
      if (normalizedQuery.includes(keyword)) {
        return true;
      }
      // Check if query is a partial match of keyword (for "des" matching "designer")
      if (keyword.includes(normalizedQuery) && normalizedQuery.length >= 3) {
        return true;
      }
      return false;
    });
  };

  // Parse locality from search query
  const parseLocalityFromQuery = (query) => {
    if (!query || !query.trim()) return null;

    const normalizedQuery = query.toLowerCase().trim();
    
    // Pattern 1: "companies in [Locality]"
    const pattern1 = /companies\s+in\s+(.+)/i;
    const match1 = normalizedQuery.match(pattern1);
    if (match1) {
      return match1[1].trim();
    }

    // Pattern 2: Just the locality name - return the query itself
    // The database API will handle the search matching
    // This allows searching for any locality, not just those in locations.json
    return query.trim();
  };

  // Get locality data from locations.json by pincode or locality name
  const getLocalityDataByPincode = (pincode, localityName) => {
    if (!locationsData || !locationsData.localities) return null;
    
    // Try to find by locality name first
    if (locationsData.localities[localityName]) {
      return locationsData.localities[localityName];
    }
    
    // Try to find by pincode
    for (const [key, value] of Object.entries(locationsData.localities)) {
      if (value.pincode === pincode) {
        return value;
      }
    }
    
    return null;
  };

  // Fetch location using IP-based geolocation (fallback)
  const fetchLocationByIP = async () => {
    try {
      const response = await fetch('https://ip-api.com/json/');
      const data = await response.json();
      
      if (data.status === 'success' && data.lat && data.lon) {
        return { lat: data.lat, lng: data.lon };
      }
      return null;
    } catch (error) {
      console.error('Error fetching location by IP:', error);
      return null;
    }
  };

  // Detect user location using browser geolocation with IP fallback
  const detectUserLocation = async () => {
    if (!mapInstanceRef.current) {
      console.error('Map instance not available');
      return null;
    }

    setIsDetectingLocation(true);
    setLocationError(null);

    return new Promise((resolve) => {
      const L = window.L;
      if (!L) {
        setIsDetectingLocation(false);
        resolve(null);
        return;
      }

      // Try browser geolocation first
      mapInstanceRef.current.locate({
        setView: false, // We'll handle zoom manually
        maxZoom: 16,
        timeout: 10000,
        enableHighAccuracy: true,
      });

      // Handle successful location detection
      const handleLocationFound = (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        console.log('✅ Browser geolocation successful:', { lat, lng });
        
        // Remove event listeners
        mapInstanceRef.current.off('locationfound', handleLocationFound);
        mapInstanceRef.current.off('locationerror', handleLocationError);
        
        setIsDetectingLocation(false);
        resolve({ lat, lng, source: 'browser' });
      };

      // Handle location error (fallback to IP)
      const handleLocationError = async (e) => {
        console.log('⚠️ Browser geolocation failed, trying IP fallback...');
        
        // Remove event listeners
        mapInstanceRef.current.off('locationfound', handleLocationFound);
        mapInstanceRef.current.off('locationerror', handleLocationError);
        
        // Try IP-based geolocation
        const ipLocation = await fetchLocationByIP();
        
        if (ipLocation) {
          console.log('✅ IP geolocation successful:', ipLocation);
          setIsDetectingLocation(false);
          resolve({ ...ipLocation, source: 'ip' });
        } else {
          console.error('❌ Both geolocation methods failed');
          setIsDetectingLocation(false);
          setLocationError('Unable to detect your location');
          resolve(null);
        }
      };

      // Attach event listeners
      mapInstanceRef.current.on('locationfound', handleLocationFound);
      mapInstanceRef.current.on('locationerror', handleLocationError);
    });
  };

  // Store location in sessionStorage
  const storeLocationInSession = (location) => {
    if (typeof window !== 'undefined' && location) {
      const locationData = {
        lat: location.lat,
        lng: location.lng,
        source: location.source || 'unknown',
        timestamp: Date.now(),
      };
      sessionStorage.setItem('userCurrentLocation', JSON.stringify(locationData));
      console.log('💾 Location stored in sessionStorage:', locationData);
    }
  };

  // Get location from sessionStorage
  const getLocationFromSession = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('userCurrentLocation');
        if (stored) {
          const locationData = JSON.parse(stored);
          // Check if location is less than 1 hour old
          const oneHour = 60 * 60 * 1000;
          if (Date.now() - locationData.timestamp < oneHour) {
            return locationData;
          }
        }
      } catch (error) {
        console.error('Error reading location from sessionStorage:', error);
      }
    }
    return null;
  };

  // Zoom map to user location and add marker
  const zoomToUserLocation = (location) => {
    if (!mapInstanceRef.current || !location) return;

    const L = window.L;
    if (!L) return;

    const { lat, lng } = location;

    // Remove existing user location marker if any
    if (userLocationMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userLocationMarkerRef.current);
      userLocationMarkerRef.current = null;
    }

    // Create user location marker (distinct from home marker)
    const userLocationIcon = L.divIcon({
      html: `<div style="background-color:#9333EA;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #FFFFFF;box-shadow:0 2px 8px rgba(147,51,234,0.4);">📍</div>`,
      className: 'user-location-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // Add marker to map
    const marker = L.marker([lat, lng], {
      icon: userLocationIcon,
      zIndexOffset: 2500, // Higher than home marker (2000)
      interactive: true,
    }).addTo(mapInstanceRef.current);

    marker.bindTooltip('Your current location', {
      permanent: false,
      direction: 'top',
      className: 'user-location-tooltip',
    });

    userLocationMarkerRef.current = marker;

    // Zoom to location with smooth animation
    mapInstanceRef.current.flyTo([lat, lng], 14, {
      duration: 1.5,
    });

    console.log('📍 Zoomed to user location:', { lat, lng });
  };

  const handleSearch = async (overrideQuery = null) => {
    const queryToSearch = overrideQuery || searchQuery;
    console.log("🔍 handleSearch called:", { queryToSearch, searchQuery, overrideQuery });
    if (queryToSearch.trim()) {
      console.log("✅ Setting loading states");
      setIsMapLoading(true);  // Show "Loading map..." immediately
      setHasSearched(true);
      
      // Check if this is a job search query
      if (isJobSearchQuery(queryToSearch)) {
        console.log("🔍 Job search detected, triggering location detection...");
        
        // Check sessionStorage first
        const cachedLocation = getLocationFromSession();
        if (cachedLocation) {
          console.log("✅ Using cached location from sessionStorage");
          setUserLocation(cachedLocation);
          storeLocationInSession(cachedLocation);
          zoomToUserLocation(cachedLocation);
          setIsMapLoading(false);
          setIsFindingJobs(false);
          return;
        }

        // Detect user location
        const location = await detectUserLocation();
        
        if (location) {
          setUserLocation(location);
          storeLocationInSession(location);
          zoomToUserLocation(location);
          setIsMapLoading(false);
          setIsFindingJobs(false);
        } else {
          // Location detection failed
          setIsMapLoading(false);
          setIsFindingJobs(false);
          if (locationError) {
            alert(locationError);
          } else {
            alert("Unable to detect your location. Please try again or search for a specific locality.");
          }
        }
        return;
      }
      
      // Parse locality from search query
      const localityName = parseLocalityFromQuery(queryToSearch);
      
      if (localityName) {
        try {
          // Step 1: Query database to find locality, pincode, district, state
          const response = await fetch(
            `/api/search-locality?locality=${encodeURIComponent(localityName)}`
          );
          
          if (!response.ok) {
            setIsMapLoading(false);
            setIsFindingJobs(false);
            const errorData = await response.json().catch(() => ({}));
            console.error("Locality not found in database:", errorData.error || "Unknown error");
            // Show user-friendly error message
            alert(`Locality "${localityName}" not found. Please try searching with the full locality name.`);
            return;
          }

          const dbData = await response.json();
          console.log("Found locality in database:", dbData);

          // Step 2: Get company data from locations.json using pincode/locality
          const localityData = getLocalityDataByPincode(
            dbData.pincode,
            dbData.localityName
          );
          
          if (!localityData) {
            console.log(`No company data found for locality: ${dbData.localityName} (pincode: ${dbData.pincode})`);
            setIsMapLoading(false);
            setIsFindingJobs(true);  // Change to "Finding jobs..." before zoom
            // Still zoom to district level and show "No companies found" message
            performDistrictZoom(dbData, true);
            return;
          }

          if (localityData.companies && localityData.companies.length > 0) {
            setIsMapLoading(false);
            setIsFindingJobs(true);  // Change to "Finding jobs..." before zoom
            // Step 3: Perform multi-stage zoom with database info and show companies
            performLocalitySearchWithDBData(dbData, localityData);
          } else {
            console.log(`No companies found for locality: ${dbData.localityName}`);
            setIsMapLoading(false);
            setIsFindingJobs(true);  // Change to "Finding jobs..." before zoom
            // Still zoom to district level and show "No companies found" message
            performDistrictZoom(dbData, true);
          }
        } catch (error) {
          setIsMapLoading(false);
          setIsFindingJobs(false);
          console.error("Error searching locality:", error);
          alert("An error occurred while searching. Please try again.");
        }
      }
    }
  };

  const handleReturn = () => {
    setHasSearched(false);
    // Preserve searchQuery, selectedFilterOption, etc.
  };

  const handleDistanceToggle = () => {
    setIsHomeFilterActive(!isHomeFilterActive);
  };

  const handleHomeLocationRightClick = (e) => {
    e.preventDefault();
    setShowHomeLocationDropdown(!showHomeLocationDropdown);
  };

  // Function to show road distance on line hover
  const showRoadDistanceOnHover = async (line, company, home) => {
    if (!mapInstanceRef.current || !home || !company || !line) return;
    const homeCoords = [home.lat, home.lon];
    const companyCoords = [company.lat, company.lon];
    const roadDistanceMeters = await fetchRoadDistance(homeCoords, companyCoords);

    if (roadDistanceMeters !== null) {
      const roadDistanceKm = (roadDistanceMeters / 1000).toFixed(1);
      line.bindTooltip(
        `${company.name || "Location"}: ${roadDistanceKm} km by road`,
        {
          permanent: false,
          direction: "top",
          className: "road-distance-tooltip",
        }
      );
    }
  };

  // Handle connecting lines when distance toggle is active
  useEffect(() => {
    if (!mapInstanceRef.current || !locationsData) {
      // Remove lines if map is not ready
      if (straightLinesRef.current.length > 0 && mapInstanceRef.current) {
        straightLinesRef.current.forEach((line) => {
          mapInstanceRef.current.removeLayer(line);
        });
        straightLinesRef.current = [];
      }
      return;
    }

    const L = window.L;
    if (!L) return;

    const homeLoc = locationsData.homeLocation;
    const companies = locationsData.companies;

    if (!homeLoc || !homeLoc.lat || !homeLoc.lon || !companies || companies.length === 0) {
      // Remove lines if no valid data
      if (straightLinesRef.current.length > 0) {
        straightLinesRef.current.forEach((line) => {
          mapInstanceRef.current.removeLayer(line);
        });
        straightLinesRef.current = [];
      }
      return;
    }

    // Remove existing lines
    straightLinesRef.current.forEach((line) => {
      mapInstanceRef.current.removeLayer(line);
    });
    straightLinesRef.current = [];

    // Only create lines if distance toggle is active
    if (isHomeFilterActive && homeMarkerRef.current) {
      // Create new lines
      companies.forEach(async (company) => {
        const home = [homeLoc.lat, homeLoc.lon];
        const companyLoc = [company.lat, company.lon];

        // Create dashed line
        const straightLine = L.polyline([home, companyLoc], {
          color: "#0A0A0A",
          weight: 2,
          opacity: 0.6,
          dashArray: "5, 5",
          interactive: true,
        }).addTo(mapInstanceRef.current);

        // Add hover handler to show road distance
        straightLine.on("mouseover", async function () {
          await showRoadDistanceOnHover(straightLine, company, homeLoc);
        });

        straightLine.on("mouseout", function () {
          straightLine.closeTooltip();
        });

        straightLinesRef.current.push(straightLine);
      });
    }
  }, [isHomeFilterActive, locationsData]);

  // Handle click outside filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target)
      ) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowAutocomplete(false);
      }
      
      if (
        jobAutocompleteRef.current &&
        !jobAutocompleteRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowJobAutocomplete(false);
      }
    };

    if (showAutocomplete || showJobAutocomplete) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAutocomplete, showJobAutocomplete]);

  // Show autocomplete when user types
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Show autocomplete if query is at least 2 characters
    if (value.trim().length >= 2) {
      // Check if this is a job-related query
      const isJobQuery = isJobSearchQuery(value);
      console.log("🔍 Search input change:", { value, isJobQuery, jobTitlesCount: jobTitles.length });
      
      if (isJobQuery) {
        console.log("✅ Showing job autocomplete");
        setShowJobAutocomplete(true);
        setShowAutocomplete(false);
      } else {
        console.log("✅ Showing locality autocomplete");
        setShowAutocomplete(true);
        setShowJobAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
      setShowJobAutocomplete(false);
    }
  };

  // Handle locality selection from autocomplete
  const handleLocalitySelect = (locality) => {
    const selectedLocalityName = locality.localityName;
    console.log("📍 Locality selected:", selectedLocalityName);
    setSearchQuery(selectedLocalityName);
    setShowAutocomplete(false);
    
    // Automatically trigger search with the selected locality
    // Use setTimeout to ensure state update is reflected in UI
    setTimeout(() => {
      handleSearch(selectedLocalityName);
    }, 200);
  };

  // Handle job title selection from autocomplete
  const handleJobTitleSelect = async (jobTitle) => {
    const selectedJobTitle = `${jobTitle.title} near me`;
    console.log("💼 Job title selected:", selectedJobTitle);
    setSearchQuery(selectedJobTitle);
    setShowJobAutocomplete(false);
    
    // Trigger location detection
    setIsMapLoading(true);
    setHasSearched(true);
    
    // Check sessionStorage first
    const cachedLocation = getLocationFromSession();
    if (cachedLocation) {
      console.log("✅ Using cached location from sessionStorage");
      setUserLocation(cachedLocation);
      storeLocationInSession(cachedLocation);
      zoomToUserLocation(cachedLocation);
      setIsMapLoading(false);
      setIsFindingJobs(false);
      return;
    }

    // Detect user location
    const location = await detectUserLocation();
    
    if (location) {
      setUserLocation(location);
      storeLocationInSession(location);
      zoomToUserLocation(location);
      setIsMapLoading(false);
      setIsFindingJobs(false);
    } else {
      // Location detection failed
      setIsMapLoading(false);
      setIsFindingJobs(false);
      if (locationError) {
        alert(locationError);
      } else {
        alert("Unable to detect your location. Please try again or search for a specific locality.");
      }
    }
  };

  if (!isClient) {
    return (
      <div className="flex-1 h-screen bg-gray-50 dark:bg-gray-950 relative flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🗺️</div>
          <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full absolute inset-0" />

      {/* Collapsed Search Bar - Shows in Globe view by default */}
      {isGlobeView && (
        <div
          className={`${searchBar.container} ${searchBar["container-width"]}`}
          style={{ gap: "24px" }}
        >
          {/* Search Bar Card */}
          <div className={searchBar.card}>
            <div className={searchBar["inner-flex"]}>
              {/* View Selector Button - Hidden for now, will add in later stages */}
              {/* <div className="relative flex-shrink-0">
                <button
                  className={`${searchBar["view-selector-button"]} ${searchBar["view-selector-text-default"]} ${searchBar["view-selector-text-hover"]}`}
                  onClick={() => setShowViewDropdown(!showViewDropdown)}
                >
                  <EarthFilled size={18} className={searchBar["view-icon"]} />
                  <span
                    style={{
                      fontFamily: "Open Sans",
                      fontSize: "14px",
                      color: "#1A1A1A",
                    }}
                  >
                    Globe view
                  </span>
                  <RiArrowDownSLine size={16} style={{ color: "#1A1A1A" }} />
                </button>
                {showViewDropdown && (
                  <div className="absolute top-full mt-2 left-0 w-[200px] bg-brand-bg-white border border-brand-stroke-border rounded-lg shadow-lg z-50">
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-brand-stroke-weak transition-colors flex items-center gap-2"
                      onClick={() => {
                        setIsGlobeView(true);
                        setShowViewDropdown(false);
                      }}
                    >
                      <EarthFilled size={18} className={searchBar["view-icon"]} />
                      <span style={{ fontFamily: "Open Sans", fontSize: "14px" }}>
                        Globe view
                      </span>
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-brand-stroke-weak transition-colors flex items-center gap-2"
                      onClick={() => {
                        setIsGlobeView(false);
                        setShowViewDropdown(false);
                      }}
                    >
                      <List size={18} style={{ color: "#575757" }} />
                      <span style={{ fontFamily: "Open Sans", fontSize: "14px" }}>
                        List view
                      </span>
                    </button>
                  </div>
                )}
              </div> */}

              {/* Search Input with Autocomplete - Expanded width */}
              <div className="relative flex-1" style={{ minWidth: 0 }}>
                {/* Search Icon - Left side inside input */}
                <IbmWatsonDiscovery
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10"
                  style={{
                    color: "var(--brand-stroke-strong)",
                    pointerEvents: "none",
                  }}
                />
                
                {/* Search Input */}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyDown={(e) => {
                    // Don't handle arrow keys here - let autocomplete handle them
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      // Let autocomplete handle these - don't prevent default
                      return;
                    }
                    if (e.key === "Enter" && searchQuery.trim()) {
                      // Only search if autocomplete is closed or no item is selected
                      if (!showAutocomplete && !showJobAutocomplete) {
                        setShowAutocomplete(false);
                        setShowJobAutocomplete(false);
                        handleSearch();
                      }
                    } else if (e.key === "Escape") {
                      setShowAutocomplete(false);
                      setShowJobAutocomplete(false);
                    }
                  }}
                  onFocus={(e) => {
                    if (searchQuery.trim().length >= 2) {
                      // Check if this is a job-related query
                      if (isJobSearchQuery(searchQuery)) {
                        setShowJobAutocomplete(true);
                      } else {
                        setShowAutocomplete(true);
                      }
                    }
                  }}
                  className={`${searchBar["search-input"]} ${searchBar["search-input-hover"]} ${searchBar["search-input-text"]} ${searchBar["search-input-placeholder"]} search-input-focus-active`}
                  style={{
                    fontFamily: "Open Sans",
                    fontSize: "14px",
                    boxShadow: "0 1px 6px rgba(32,33,36,0.08)",
                    width: "100%",
                    paddingLeft: "44px", // Space for search icon
                    paddingRight: "44px", // Space for send button
                  }}
                  placeholder="Search for locality, pincode, job"
                />
                
                {/* Send Button - Right side inside input */}
                <button
                  onClick={() => handleSearch()}
                  disabled={!searchQuery || !searchQuery.trim()}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center p-1.5 rounded transition-colors ${
                    !searchQuery || !searchQuery.trim() 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:bg-brand-stroke-weak cursor-pointer"
                  }`}
                  style={{
                    border: "none",
                    background: "transparent",
                  }}
                >
                  <SendFilled
                    size={18}
                    style={{
                      color: (searchQuery && searchQuery.trim()) 
                        ? "#7c00ff" 
                        : "var(--brand-text-tertiary)",
                    }}
                  />
                </button>
                
                {/* Autocomplete Dropdown */}
                <LocalityAutocomplete
                  isOpen={showAutocomplete}
                  onClose={() => setShowAutocomplete(false)}
                  dropdownRef={autocompleteRef}
                  position={{
                    top: "100%",
                    left: "0",
                    right: "auto",
                    marginTop: "8px",
                  }}
                  width="100%"
                  localities={localities}
                  searchQuery={searchQuery}
                  onSelect={handleLocalitySelect}
                />
                
                {/* Job Title Autocomplete Dropdown */}
                <JobTitleAutocomplete
                  isOpen={showJobAutocomplete}
                  onClose={() => setShowJobAutocomplete(false)}
                  dropdownRef={jobAutocompleteRef}
                  position={{
                    top: "100%",
                    left: "0",
                    right: "auto",
                    marginTop: "8px",
                  }}
                  width="100%"
                  jobTitles={jobTitles}
                  searchQuery={searchQuery}
                  onSelect={handleJobTitleSelect}
                />
              </div>

              {/* Filter Button */}
              <div className="relative flex-shrink-0">
                <button
                  ref={filterButtonRef}
                  className={`${searchBar["filter-button"]} ${searchBar["filter-button-text-default"]} ${searchBar["filter-button-text-hover"]}`}
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  style={{ border: "none" }}
                  aria-label="Filter"
                >
                  <span style={{ fontSize: "16px" }}>🇮🇳</span>
                  <Filter size={16} style={{ color: "#575757" }} />
                  <span
                    style={{
                      color: "#1A1A1A",
                      fontFamily: "Open Sans",
                      fontSize: "12px",
                    }}
                  >
                    {selectedFilterOption
                      ? selectedFilterOption.state
                        ? selectedFilterOption.state
                        : "India"
                      : "India"}
                  </span>
                </button>

                <FilterDropdown
                  isOpen={showFilterDropdown}
                  onClose={() => setShowFilterDropdown(false)}
                  dropdownRef={filterDropdownRef}
                  selectedOption={selectedFilterOption}
                  onSelect={(option) => setSelectedFilterOption(option)}
                  position={
                    isGlobeView
                      ? {
                          top: "100%",
                          bottom: "auto",
                          right: "0",
                          left: "auto",
                          marginTop: "8px",
                        }
                      : {
                          top: "auto",
                          bottom: "100%",
                          right: "0",
                          left: "auto",
                          marginBottom: "8px",
                        }
                  }
                  width="300px"
                />
              </div>

              {/* Return Button - Hidden for now, will add in later stages */}
              {/* <button
                onClick={handleReturn}
                className={searchBar["return-button"]}
              >
                <Return size={20} className={searchBar["return-button-icon"]} />
              </button> */}
            </div>
          </div>

          {/* Distance Button */}
          <div className="relative">
            <button
              className={`${searchBar["distance-button"]} ${searchBar["distance-button-height"]} ${searchBar["distance-button-nowrap"]} ${
                isHomeFilterActive ? searchBar["distance-button-active"] : ""
              }`}
              onClick={handleDistanceToggle}
              onContextMenu={handleHomeLocationRightClick}
              style={{ fontFamily: "Open Sans", fontSize: "14px" }}
            >
              <span style={{ fontSize: "16px" }}>🏠</span>
              <span style={{ fontFamily: "Open Sans", fontSize: "14px" }}>
                {isHomeFilterActive ? "Hide Distance" : "Show Distance"}
              </span>
            </button>

            {/* Home Location Dropdown */}
            {showHomeLocationDropdown && (
              <div className="absolute top-full mt-2 right-0 w-[300px] bg-brand-bg-white border border-brand-stroke-border rounded-lg shadow-lg z-50 p-3 flex flex-col gap-3">
                <div
                  style={{
                    fontFamily: "Open Sans",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                  }}
                >
                  Home Location
                </div>
                <div className="relative">
                  <RiSearchLine
                    size={18}
                    style={{
                      color: "#A5A5A5",
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    type="text"
                    value={homeLocation}
                    onChange={(e) => setHomeLocation(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-brand-stroke-border rounded-lg focus:outline-none focus:border-brand text-sm"
                    style={{
                      fontFamily: "Open Sans",
                      fontSize: "14px",
                      color: "#1A1A1A",
                    }}
                    placeholder="Enter location"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                    style={{ fontFamily: "Open Sans" }}
                    onClick={() => {
                      // Handle set location
                      setShowHomeLocationDropdown(false);
                    }}
                  >
                    Set Location
                  </button>
                  <button
                    className="px-4 py-2 bg-transparent border border-brand-stroke-border text-brand-stroke-strong rounded-lg hover:bg-brand-stroke-weak transition-colors text-sm"
                    style={{ fontFamily: "Open Sans" }}
                    onClick={() => {
                      setHomeLocation("");
                      setShowHomeLocationDropdown(false);
                    }}
                  >
                    Clear
                  </button>
                </div>
                {homeLocation && (
                  <div
                    style={{
                      fontFamily: "Open Sans",
                      fontSize: "12px",
                      color: "#575757",
                    }}
                  >
                    Current: {homeLocation}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {(isMapLoading || isFindingJobs || isDetectingLocation) && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            zIndex: 999,
            backgroundColor: isFindingJobs 
              ? 'rgba(255, 255, 255, 0.85)' 
              : 'rgba(255, 255, 255, 0.5)',
            backdropFilter: isFindingJobs ? 'blur(2px)' : 'none',
            pointerEvents: 'auto'
          }}
        >
          <div className="text-center">
            {/* Spinner */}
            <div 
              className="w-12 h-12 border-4 rounded-full loading-spinner mx-auto mb-4"
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid #E9D5FF',
                borderTop: '4px solid #9333EA',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            {/* Loading Text */}
            <p 
              className="text-base font-medium"
              style={{ 
                fontFamily: 'Open Sans',
                fontSize: '16px',
                fontWeight: 500,
                color: '#1A1A1A'
              }}
            >
              {isDetectingLocation 
                ? 'Detecting your location...' 
                : isFindingJobs 
                  ? 'Finding jobs...' 
                  : 'Loading map...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Export with dynamic import to disable SSR
export default dynamic(() => Promise.resolve(MapComponent), {
  ssr: false,
});
