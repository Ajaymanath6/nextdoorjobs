"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import themeClasses from "../../theme-utility-classes.json";
import {
  EarthFilled,
  List,
  Filter,
  Location,
  Return,
  IbmWatsonDiscovery,
  Enterprise,
  Portfolio,
  User,
  UserAvatar,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Close,
  Chat,
  Home,
  Add,
} from "@carbon/icons-react";
import { RiArrowDownSLine } from "@remixicon/react";
import FilterDropdown from "./FilterDropdown";
import FilterBottomSheet from "./FilterBottomSheet";
import GigFilterDropdown from "./GigFilterDropdown";
import LocalityAutocomplete from "./LocalityAutocomplete";
import AddHomeModal from "./AddHomeModal";
import GetCoordinatesModal from "./GetCoordinatesModal";
import JobTitleAutocomplete from "./JobTitleAutocomplete";
import CollegeAutocomplete from "./CollegeAutocomplete";
import EmptyState from "./EmptyState";
import CompanyJobsSidebar from "../CompanyJobsSidebar";
import LoadingSpinner from "../LoadingSpinner";
import { getStateCenter } from "../../../lib/indiaStateCenters";
import { getAvatarUrlById } from "../../../lib/avatars";
// Import CSS files (Next.js handles these)
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Dynamic import of Leaflet to avoid SSR issues
const MapComponent = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGlobeView, setIsGlobeView] = useState(true);
  const [selectedFilterOption, setSelectedFilterOption] = useState(null);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showJobAutocomplete, setShowJobAutocomplete] = useState(false);
  const [showCollegeAutocomplete, setShowCollegeAutocomplete] = useState(false);
  const [localities, setLocalities] = useState([]);
  const [indiaSuggestions, setIndiaSuggestions] = useState([]);
  const [indiaSuggestionsLoading, setIndiaSuggestionsLoading] = useState(false);
  const [cachedStateDistricts, setCachedStateDistricts] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [isFindingJobs, setIsFindingJobs] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [emptyStateQuery, setEmptyStateQuery] = useState("");
  const autocompleteRef = useRef(null);
  const jobAutocompleteRef = useRef(null);
  const collegeAutocompleteRef = useRef(null);
  const searchInputRef = useRef(null);
  const userLocationMarkerRef = useRef(null);

  const searchBar = themeClasses.components.searchBar;
  const brand = themeClasses.brand;
  const markers = themeClasses.components.markers;
  const companyMarkersRef = useRef([]);
  const straightLinesRef = useRef([]);
  const clusterGroupRef = useRef(null);
  const zoomToJobMarkerRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const filterButtonRef = useRef(null);
  const [locationsData, setLocationsData] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [companyDistances, setCompanyDistances] = useState({});
  const [showCompanyJobsSidebar, setShowCompanyJobsSidebar] = useState(false);
  const [selectedCompanyForSidebar, setSelectedCompanyForSidebar] = useState(null);
  const [selectedCompanyJobs, setSelectedCompanyJobs] = useState([]);
  const [isSwitchingToChat, setIsSwitchingToChat] = useState(false);
  const [userAccountType, setUserAccountType] = useState(null);
  const [totalCompaniesCount, setTotalCompaniesCount] = useState(0);

  // Flattened company list for filter modal (main companies + per-locality companies)
  const flattenedCompanies = useMemo(() => {
    if (!locationsData) return [];
    const main = locationsData.companies || [];
    const fromLocalities = locationsData.localities
      ? Object.values(locationsData.localities).flatMap((loc) =>
          (loc.companies || []).map((c) => ({
            ...c,
            name: c.company_name || c.name,
          }))
        )
      : [];
    const seen = new Set();
    return [...main, ...fromLocalities].filter((c) => {
      const name = c.name || c.company_name;
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [locationsData]);

  // College distance feature state
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [isCollegeFilterActive, setIsCollegeFilterActive] = useState(false);
  const collegeMarkerRef = useRef(null);
  const [collegeDistances, setCollegeDistances] = useState({});
  const collegeLinesRef = useRef([]);

  // Search bar mode toggle: "person" (users), "job" (company jobs), or "company" (all companies)
  // Default to "person" for Individual/Gig Worker accounts, "job" for Company accounts
  const [searchMode, setSearchMode] = useState("person");
  // Last district/state from locality search (e.g. for gig workers fetch)
  const [lastSearchedDistrict, setLastSearchedDistrict] = useState(null);
  const [lastSearchedState, setLastSearchedState] = useState(null);
  const [gigs, setGigs] = useState([]);
  const gigMarkersRef = useRef([]);
  const gigClusterGroupRef = useRef(null);
  const gigClusterHoverPopupRef = useRef(null);
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false);
  const [showSearchModeDropdown, setShowSearchModeDropdown] = useState(false);
  const searchModeDropdownRef = useRef(null);
  const [selectedGigType, setSelectedGigType] = useState(null);
  const [showGigFilterDropdown, setShowGigFilterDropdown] = useState(false);
  const gigFilterDropdownRef = useRef(null);
  const gigFilterButtonRef = useRef(null);

  // Home location (from profile)
  const [homeLocation, setHomeLocation] = useState(null);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [showAddHomeModal, setShowAddHomeModal] = useState(false);
  const [showLocateMeCoordModal, setShowLocateMeCoordModal] = useState(false);
  const homeSuggestionsRef = useRef(null);
  const [showDistanceFromHome, setShowDistanceFromHome] = useState(false);
  const [selectedGigForDistance, setSelectedGigForDistance] = useState(null);
  const homeMarkerRef = useRef(null);
  const homeToGigLineRef = useRef(null);

  // Parse response as JSON safely (avoids "Unexpected token '<'" when server returns HTML)
  const parseJsonResponse = async (response) => {
    const text = await response.text();
    if (!response.ok) return null;
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  };

  // Fetch user profile for home location
  useEffect(() => {
    fetch("/api/profile", { credentials: "same-origin" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.success && data.user?.homeLatitude != null && data.user?.homeLongitude != null) {
          setHomeLocation({
            homeLatitude: data.user.homeLatitude,
            homeLongitude: data.user.homeLongitude,
            homeLocality: data.user.homeLocality,
            homeDistrict: data.user.homeDistrict,
            homeState: data.user.homeState,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Load locations data (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/data/locations.json")
        .then((response) => parseJsonResponse(response))
        .then((data) => {
          if (data) setLocationsData(data);
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
        .then((response) => parseJsonResponse(response))
        .then((data) => {
          if (data) {
            setLocalities(data);
            console.log(`✅ Loaded ${data.length} localities for autocomplete`);
          }
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
        .then((response) => parseJsonResponse(response))
        .then((data) => {
          if (data) {
            setJobTitles(data);
            console.log(`✅ Loaded ${data.length} job titles for autocomplete`);
          }
        })
        .catch((error) => {
          console.error("Error loading job titles:", error);
        });
    }
  }, []);

  // Load colleges for autocomplete
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/api/colleges")
        .then((response) => parseJsonResponse(response))
        .then((data) => {
          if (data) {
            setColleges(data);
            console.log(`✅ Loaded ${data.length} colleges for autocomplete`);
          }
        })
        .catch((error) => {
          console.error("Error loading colleges:", error);
        });
    }
  }, []);

  // Debounced fetch for all-India place suggestions (state/district/place)
  const indiaSearchDebounceRef = useRef(null);
  const indiaSearchAbortRef = useRef(null);
  const INDIA_SEARCH_CACHE_MAX = 20;
  const indiaSearchCacheRef = useRef(new Map());
  useEffect(() => {
    const q = searchQuery?.trim() || "";
    const stateFilter = selectedFilterOption?.state || "";
    if (q.length < 2) {
      setIndiaSuggestions([]);
      setIndiaSuggestionsLoading(false);
      return;
    }
    // Instant suggestions from preloaded districts when a state is selected
    if (stateFilter && cachedStateDistricts.length > 0) {
      const qLower = q.toLowerCase();
      const filtered = cachedStateDistricts
        .filter((d) => (d || "").toLowerCase().includes(qLower))
        .slice(0, 12)
        .map((name) => ({
          type: "district",
          name,
          state: stateFilter,
          district: name,
          lat: null,
          lon: null,
          listItemType: "india_place",
        }));
      setIndiaSuggestions(filtered);
    }
    if (indiaSearchDebounceRef.current) clearTimeout(indiaSearchDebounceRef.current);
    indiaSearchDebounceRef.current = setTimeout(() => {
      const cacheKey = q + "\0" + stateFilter;
      const cached = indiaSearchCacheRef.current.get(cacheKey);
      if (cached) {
        setIndiaSuggestions(cached);
        setIndiaSuggestionsLoading(false);
        return;
      }
      const controller = new AbortController();
      indiaSearchAbortRef.current = controller;
      setIndiaSuggestionsLoading(true);
      const url = stateFilter
        ? `/api/india/search?q=${encodeURIComponent(q)}&state=${encodeURIComponent(stateFilter)}`
        : `/api/india/search?q=${encodeURIComponent(q)}`;
      fetch(url, { signal: controller.signal })
        .then((res) => res.json().catch(() => ({ suggestions: [] })))
        .then((data) => {
          if (controller.signal.aborted) return;
          const list = data.suggestions || [];
          const mapped = list.map((s) => ({ ...s, listItemType: "india_place" }));
          setIndiaSuggestions(mapped);
          const cache = indiaSearchCacheRef.current;
          if (cache.size >= INDIA_SEARCH_CACHE_MAX) {
            const firstKey = cache.keys().next().value;
            if (firstKey !== undefined) cache.delete(firstKey);
          }
          cache.set(cacheKey, mapped);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setIndiaSuggestions([]);
        })
        .finally(() => setIndiaSuggestionsLoading(false));
    }, 150);
    return () => {
      if (indiaSearchDebounceRef.current) clearTimeout(indiaSearchDebounceRef.current);
      if (indiaSearchAbortRef.current) {
        indiaSearchAbortRef.current.abort();
        indiaSearchAbortRef.current = null;
      }
      setIndiaSuggestionsLoading(false);
    };
  }, [searchQuery, selectedFilterOption?.state, cachedStateDistricts]);

  // Pan map to selected state when user picks a state in the filter
  useEffect(() => {
    const stateName = selectedFilterOption?.state;
    if (!stateName || !mapInstanceRef.current) return;
    const result = getStateCenter(stateName);
    if (result?.center) {
      mapInstanceRef.current.flyTo(result.center, result.zoom, { duration: 0.8 });
    }
  }, [selectedFilterOption?.state]);

  // Preload districts for selected state so suggestions can show faster
  useEffect(() => {
    const stateName = selectedFilterOption?.state;
    if (!stateName || typeof stateName !== "string") {
      setCachedStateDistricts([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/india/districts?state=${encodeURIComponent(stateName)}`)
      .then((res) => res.json().catch(() => ({ districts: [] })))
      .then((data) => {
        if (!cancelled && Array.isArray(data.districts)) setCachedStateDistricts(data.districts);
      })
      .catch(() => {
        if (!cancelled) setCachedStateDistricts([]);
      });
    return () => { cancelled = true; };
  }, [selectedFilterOption?.state]);

  // Cleanup markers and lines on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        // Remove user location marker
        if (userLocationMarkerRef.current) {
          mapInstanceRef.current.removeLayer(userLocationMarkerRef.current);
        }
        // Remove company markers
        if (clusterGroupRef.current) {
          mapInstanceRef.current.removeLayer(clusterGroupRef.current);
        }
        if (zoomToJobMarkerRef.current) {
          mapInstanceRef.current.removeLayer(zoomToJobMarkerRef.current);
          zoomToJobMarkerRef.current = null;
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
        headers: { "User-Agent": "mapmyGig/1.0" },
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

  // Calculate distances from college to companies
  const calculateCollegeDistances = async (collegeLoc, companies, map) => {
    if (!collegeLoc || !collegeLoc.latitude || !collegeLoc.longitude || !map) return {};

    const distances = {};
    const collegeCoords = [collegeLoc.latitude, collegeLoc.longitude];

    await Promise.all(
      companies.map(async (company) => {
        // Handle both company.lat/lon and company.latitude/longitude formats
        const companyLat = company.latitude || company.lat;
        const companyLon = company.longitude || company.lon;
        
        if (!companyLat || !companyLon) return;
        
        const companyCoords = [companyLat, companyLon];
        const roadDistanceMeters = await fetchRoadDistance(
          collegeCoords,
          companyCoords
        );

        const companyName = company.company_name || company.name;
        if (roadDistanceMeters !== null) {
          distances[companyName] = (roadDistanceMeters / 1000).toFixed(1);
        } else {
          // Fallback to straight-line distance
          const straightDistance = map.distance(collegeCoords, companyCoords);
          distances[companyName] = (straightDistance / 1000).toFixed(1);
        }
      })
    );

    return distances;
  };

  // Create college icon function
  const createCollegeIcon = (L) => {
    return L.divIcon({
      html: `<div style="background-color:#FFFFFF;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #E5E5E5;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏫</div>`,
      className: "college-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  // Render company markers with popups
  const renderCompanyMarkers = (companies) => {
    if (!mapInstanceRef.current || !window.L) return;
    // Only render companies when in company mode
    if (searchMode !== "company") return;

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
        const markers = cluster.getAllChildMarkers();
        const count = markers.length;
        
        // Get up to 4 unique company logos from the markers
        const logos = [];
        const seen = new Set();
        
        for (const marker of markers) {
          if (logos.length >= 4) break;
          const company = marker.companyData;
          const logoUrl = company?.logoPath || company?.logoUrl || null;
          
          if (logoUrl && !seen.has(logoUrl)) {
            logos.push(logoUrl);
            seen.add(logoUrl);
          }
        }
        
        // Light bubble size
        const baseSize = 56;
        const size = Math.min(baseSize + (count * 2), 100);
        const padding = 10;

        // 2x2 grid: always 4 cells, fill with logos (empty if fewer than 4)
        const logoCells = [];
        for (let i = 0; i < 4; i++) {
          const url = logos[i];
          if (url) {
            logoCells.push(`
              <div style="width:100%;height:100%;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;background:white;">
                <img src="${url}" alt="" style="width:80%;height:80%;object-fit:contain;" onerror="this.style.display='none'" />
              </div>
            `);
          } else {
            logoCells.push('<div style="width:100%;height:100%;"></div>');
          }
        }

        const html = `
          <div style="
            position: relative;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            box-shadow: inset 0 20px 30px rgba(255, 255, 255, 0.3), inset 10px 0 20px rgba(0, 0, 0, 0.02), inset -10px -20px 30px rgba(0, 0, 0, 0.05), 0 15px 35px rgba(0, 0, 0, 0.08);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: ${padding}px;
            box-sizing: border-box;
          ">
            <div style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: 1fr 1fr;
              gap: 4px;
              width: 100%;
              height: 100%;
              min-width: 0;
              min-height: 0;
            ">
              ${logoCells.join('')}
            </div>
            ${count > 4 ? `
              <div style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                background: rgba(0, 0, 0, 0.55);
                color: white;
                border-radius: 10px;
                padding: 2px 6px;
                font-size: 10px;
                font-weight: 600;
              ">
                +${count - 4}
              </div>
            ` : ''}
          </div>
        `;

        return L.divIcon({
          html: html,
          className: 'marker-cluster-custom',
          iconSize: L.point(size, size),
          iconAnchor: [size / 2, size / 2],
        });
      },
    });
    clusterGroupRef.current = clusterGroup;

    // Create markers for each company
    companies.forEach((company, index) => {
      const companyName = company.company_name || company.name;
      
      // Logo fallback hierarchy:
      // 1. Company logo URL (from website fetch)
      // 2. Uploaded avatar from settings
      // 3. Carbon Organization icon
      const logoUrl = company.logoPath || company.logoUrl || company.avatarUrl || null;
      
      const positionsOpen = company.jobCount ?? 0;
      // Use Organization icon as final fallback
      const customIcon = logoUrl 
        ? createGeminiJobIcon(L, 50, logoUrl, positionsOpen)
        : createOrgIconMarker(L, 50, positionsOpen);

      const marker = L.marker([company.latitude, company.longitude], {
        icon: customIcon,
        zIndexOffset: 1000 + index,
        opacity: 1,
      });
      marker.companyData = company;

      // Add click handler to fetch and display jobs in sidebar
      marker.on("click", async () => {
        console.log('🔍 Company pin clicked:', company.id, company.company_name || company.name);
        try {
          const res = await fetch(`/api/companies/${company.id}/jobs`);
          console.log('📡 API response status:', res.status);
          if (res.ok) {
            const data = await res.json();
            console.log('✅ Jobs fetched:', data.jobs?.length || 0, 'jobs');
            setSelectedCompanyForSidebar(company);
            setSelectedCompanyJobs(data.jobs || []);
            setShowCompanyJobsSidebar(true);
            console.log('✅ Sidebar state set to true');
          } else {
            console.error('❌ API error:', res.status, res.statusText);
          }
        } catch (e) {
          console.error("❌ Failed to fetch company jobs:", e);
        }
      });

      clusterGroup.addLayer(marker);
      companyMarkersRef.current.push(marker);
    });

    // Add hover tooltip for clusters
    clusterGroup.on('clustermouseover', async function(e) {
      const cluster = e.layer;
      const markers = cluster.getAllChildMarkers();
      const companies = markers.map(m => m.companyData).filter(Boolean);
      const companyCount = companies.length;
      
      if (companyCount === 0) return;
      
      // Fetch job titles for these companies
      try {
        const companyIds = companies.map(c => c.id);
        const res = await fetch('/api/companies/job-titles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyIds }),
        });
        
        if (res.ok) {
          const data = await res.json();
          const titles = data.titles || [];
          const displayTitles = titles.slice(0, 5);
          
          const tooltipContent = `
            <div style="font-family: 'Open Sans', sans-serif; padding: 8px;">
              <div style="font-weight: 600; font-size: 13px; color: #0A0A0A; margin-bottom: 6px;">
                ${companyCount} ${companyCount === 1 ? 'company' : 'companies'} hiring
              </div>
              ${displayTitles.length > 0 ? `
                <div style="font-size: 11px; color: #575757;">
                  ${displayTitles.join(', ')}${titles.length > 5 ? '...' : ''}
                </div>
              ` : ''}
            </div>
          `;
          
          cluster.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
            className: 'cluster-tooltip',
            offset: [0, -10],
            interactive: false,
            opacity: 1,
          }).openTooltip();
        }
      } catch (error) {
        console.error('Error fetching job titles for tooltip:', error);
      }
    });

    clusterGroup.on('clustermouseout', function(e) {
      const cluster = e.layer;
      cluster.closeTooltip();
    });

    // Add cluster group to map
    mapInstanceRef.current.addLayer(clusterGroup);
  };

  // Render gig worker markers (avatar icon, popup with title + user name)
  const renderGigMarkers = (gigsToRender) => {
    if (!mapInstanceRef.current || !window.L) return;

    const L = window.L;

    if (gigClusterGroupRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(gigClusterGroupRef.current);
      gigClusterGroupRef.current = null;
    }
    gigMarkersRef.current = [];

    const gigMatchesFilter = (gig, filterType) => {
      if (!filterType) return true;
      const st = (gig.serviceType || "").toLowerCase();
      const title = (gig.title || "").toLowerCase();
      const filter = filterType.toLowerCase();
      const filterWords = filterType.toLowerCase().split(/[\s&,]+/).filter(Boolean);
      if (st === filter) return true;
      if (st && st.includes(filter)) return true;
      if (st && filter.includes(st)) return true;
      if (filterWords.some((w) => {
        if (title.includes(w)) return true;
        if (w === "tutoring" && title.includes("tutor")) return true;
        if (w === "tutor" && title.includes("tution")) return true;
        return false;
      })) return true;
      return false;
    };

    // Filter by selected gig type if one is selected (matches serviceType and title)
    let filteredGigs = gigsToRender || [];
    if (selectedGigType) {
      filteredGigs = filteredGigs.filter((g) => gigMatchesFilter(g, selectedGigType));
    }

    const withCoords = filteredGigs.filter(
      (g) =>
        g.latitude != null &&
        g.longitude != null &&
        Number.isFinite(Number(g.latitude)) &&
        Number.isFinite(Number(g.longitude))
    );
    if (withCoords.length === 0) return;

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 80,
      showCoverageOnHover: false,
      iconCreateFunction: function (cluster) {
        const markers = cluster.getAllChildMarkers();
        const count = markers.length;
        
        // Get up to 4 unique avatars from the markers
        const avatars = [];
        const seen = new Set();
        
        for (const marker of markers) {
          if (avatars.length >= 4) break;
          const gig = marker.options.gigData;
          const avatarUrl = gig?.user?.avatarId 
            ? getAvatarUrlById(gig.user.avatarId) 
            : gig?.user?.avatarUrl || '/avatars/avatar1.png';
          
          if (!seen.has(avatarUrl)) {
            avatars.push(avatarUrl);
            seen.add(avatarUrl);
          }
        }
        
        // Light bubble size
        const baseSize = 56;
        const size = Math.min(baseSize + (count * 2), 100);
        const padding = 10;

        // 2x2 grid: always 4 cells, fill with avatars (empty if fewer than 4)
        const avatarCells = [];
        for (let i = 0; i < 4; i++) {
          const url = avatars[i];
          if (url) {
            avatarCells.push(`
              <div style="width:100%;height:100%;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;">
                <img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;border:1px solid rgba(0,0,0,0.06);" onerror="this.src='/avatars/avatar1.png'" />
              </div>
            `);
          } else {
            avatarCells.push('<div style="width:100%;height:100%;"></div>');
          }
        }

        const html = `
          <div style="
            position: relative;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            box-shadow: inset 0 20px 30px rgba(255, 255, 255, 0.3), inset 10px 0 20px rgba(0, 0, 0, 0.02), inset -10px -20px 30px rgba(0, 0, 0, 0.05), 0 15px 35px rgba(0, 0, 0, 0.08);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: ${padding}px;
            box-sizing: border-box;
          ">
            <div style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: 1fr 1fr;
              gap: 4px;
              width: 100%;
              height: 100%;
              min-width: 0;
              min-height: 0;
            ">
              ${avatarCells.join('')}
            </div>
            ${count > 4 ? `
              <div style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                background: rgba(0, 0, 0, 0.55);
                color: white;
                border-radius: 10px;
                padding: 2px 6px;
                font-size: 10px;
                font-weight: 600;
              ">
                +${count - 4}
              </div>
            ` : ''}
          </div>
        `;
        
        return L.divIcon({
          html: html,
          className: 'marker-cluster-gig-bubble',
          iconSize: L.point(size, size),
        });
      },
    });

    const hasHome =
      homeLocation?.homeLatitude != null &&
      homeLocation?.homeLongitude != null &&
      Number.isFinite(Number(homeLocation.homeLatitude)) &&
      Number.isFinite(Number(homeLocation.homeLongitude));

    withCoords.forEach((gig, index) => {
      const lat = Number(gig.latitude);
      const lon = Number(gig.longitude);
      const avatarUrl = gig.user?.avatarId
        ? getAvatarUrlById(gig.user.avatarId)
        : gig.user?.avatarUrl || "/avatars/avatar1.png";
      const size = 44;
      const isThisSelected =
        selectedGigForDistance?.id === gig.id && hasHome;
      const distanceKm =
        isThisSelected && hasHome
          ? haversineKm(
              homeLocation.homeLatitude,
              homeLocation.homeLongitude,
              lat,
              lon
            ).toFixed(1)
          : null;
      const distanceBadgeHtml =
        distanceKm != null
          ? `<div style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:#0A0A0A;color:white;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:600;white-space:nowrap;font-family:'Open Sans',sans-serif;">${distanceKm} km</div>`
          : "";
      const icon = L.divIcon({
        html: `<div style="position:relative;"><div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;background:#e5e5e5;"><img src="${avatarUrl}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='/avatars/avatar1.png'" /></div>${distanceBadgeHtml}</div>`,
        className: "gig-marker",
        iconSize: [size, 64],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker([lat, lon], { 
        icon, 
        zIndexOffset: 2000 + index,
        gigData: gig // Pass gig data to marker for cluster access
      });
      const userName = gig.user?.name || "Gig worker";
      const userAvatarUrl = gig.user?.avatarId
        ? getAvatarUrlById(gig.user.avatarId)
        : gig.user?.avatarUrl || "/avatars/avatar1.png";
      const escapeHtml = (str) => (str || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const isCandidate = gig.serviceType === "Job Seeker" && gig.resume;
      let popupContent;
      if (isCandidate && gig.resume) {
        const r = gig.resume;
        const displayName = [r.firstName, r.lastName].filter(Boolean).join(" ") || gig.user?.name || "Candidate";
        const displayEmail = r.emailOverride != null && r.emailOverride !== "" ? r.emailOverride : (gig.email || "—");
        const workHtml = (r.workExperiences || []).length
          ? (r.workExperiences || []).map((w) => `
            <div class="map-popup-work-item">
              <strong>${escapeHtml(w.companyName || "Company")}</strong>${w.year ? ` (${escapeHtml(w.year)})` : ""}<br/>
              ${w.position ? escapeHtml(w.position) : ""}${w.companyUrl ? ` · <a href="${escapeHtml(w.companyUrl)}" target="_blank" rel="noopener">Link</a>` : ""}
              ${w.duties ? `<br/>${escapeHtml(w.duties)}` : ""}
            </div>`).join("")
          : "";
        const eduHtml = (r.educations || []).length
          ? (r.educations || []).map((e) => `
            <div class="map-popup-edu-item">
              <strong>${escapeHtml(e.universityName || "—")}</strong>${e.yearOfPassing ? ` (${escapeHtml(e.yearOfPassing)})` : ""}<br/>
              ${e.streamName ? escapeHtml(e.streamName) : ""}${e.marksOrScore ? ` · ${escapeHtml(e.marksOrScore)}` : ""}
            </div>`).join("")
          : "";
        const currentSalaryHtml = r.currentSalaryVisibleToRecruiter && r.currentSalaryPackage
          ? `<div class="map-popup-meta"><strong>Current salary:</strong> ${escapeHtml(r.currentSalaryPackage)}</div>`
          : "";
        popupContent = `
        <div class="map-popup-content">
          <div class="map-popup-row">
            <div class="map-popup-avatar-wrap">
              <img class="map-popup-avatar" src="${userAvatarUrl}" alt="${escapeHtml(displayName)}" onerror="this.src='/avatars/avatar1.png'" />
            </div>
            <div class="map-popup-body">
              <div class="map-popup-title">${escapeHtml(displayName)}</div>
              <div class="map-popup-sub">${escapeHtml(displayEmail)}</div>
              ${r.currentPosition ? `<div class="map-popup-meta"><strong>Position:</strong> ${escapeHtml(r.currentPosition)}</div>` : ""}
              ${r.yearsExperience ? `<div class="map-popup-meta"><strong>Experience:</strong> ${escapeHtml(r.yearsExperience)} years</div>` : ""}
            </div>
          </div>
          ${workHtml ? `<div class="map-popup-block"><strong class="map-popup-section-title">Work</strong>${workHtml}</div>` : ""}
          ${eduHtml ? `<div class="map-popup-block"><strong class="map-popup-section-title">Education</strong>${eduHtml}</div>` : ""}
          ${r.expectedSalaryPackage ? `<div class="map-popup-meta"><strong>Expected salary:</strong> ${escapeHtml(r.expectedSalaryPackage)}</div>` : ""}
          ${currentSalaryHtml}
          <div class="map-popup-divider">
            <strong>Location:</strong> ${escapeHtml(gig.district || "")}${gig.state ? `, ${escapeHtml(gig.state)}` : ""}
          </div>
        </div>`;
      } else {
        const serviceBadge = gig.serviceType
          ? `<span class="map-popup-badge">${escapeHtml(gig.serviceType)}</span>`
          : "";
        popupContent = `
        <div class="map-popup-content">
          <div class="map-popup-row">
            <div class="map-popup-avatar-wrap">
              <img class="map-popup-avatar" src="${userAvatarUrl}" alt="${escapeHtml(userName)}" onerror="this.src='/avatars/avatar1.png'" />
            </div>
            <div class="map-popup-body">
              <div class="map-popup-title">${escapeHtml(gig.title || "")}</div>
              <div class="map-popup-sub">${escapeHtml(userName)}</div>
              ${serviceBadge}
            </div>
          </div>
          ${gig.description ? `<div class="map-popup-meta map-popup-desc">${escapeHtml(gig.description)}</div>` : ""}
          <div class="map-popup-meta"><strong>Service:</strong> ${escapeHtml(gig.serviceType || "—")}</div>
          ${gig.expectedSalary ? `<div class="map-popup-meta"><strong>Expected Salary:</strong> ${escapeHtml(gig.expectedSalary)}</div>` : ""}
          ${gig.experienceWithGig ? `<div class="map-popup-meta"><strong>Experience:</strong> ${escapeHtml(gig.experienceWithGig)}</div>` : ""}
          ${gig.customersTillDate != null ? `<div class="map-popup-meta"><strong>Customers Served:</strong> ${gig.customersTillDate}</div>` : ""}
          <div class="map-popup-divider">
            <div><strong>Location:</strong> ${escapeHtml(gig.district || "")}${gig.state ? `, ${escapeHtml(gig.state)}` : ""}</div>
            ${gig.pincode ? `<div class="map-popup-pincode">Pincode: ${escapeHtml(gig.pincode)}</div>` : ""}
          </div>
          <div class="map-popup-block">
            ${
              hasHome
                ? `<button type="button" class="map-popup-btn" data-action="see-distance" data-gig-id="${gig.id}">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor"><path d="M16 4L4 14v14h8v-8h8v8h8V14L16 4z"/></svg>
              See how far from your home
            </button>`
                : `<button type="button" class="map-popup-btn" data-action="add-home">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor"><path d="M17 15V8h-2v7H8v2h7v7h2v-7h7v-2h-7z"/></svg>
              Add home to see distance
            </button>`
            }
          </div>
        </div>
      `;
      }
      marker.bindPopup(popupContent, { className: "gig-popup", maxWidth: 320 });
      marker.on("popupopen", () => {
        const el = marker.getPopup()?.getElement();
        if (!el) return;
        const seeBtn = el.querySelector('[data-action="see-distance"]');
        if (seeBtn) {
          seeBtn.onclick = () => {
            setSelectedGigForDistance(gig);
            setShowDistanceFromHome(true);
          };
        }
        const addBtn = el.querySelector('[data-action="add-home"]');
        if (addBtn) {
          addBtn.onclick = () => {
            setSelectedGigForDistance(gig);
            setShowAddHomeModal(true);
          };
        }
      });
      clusterGroup.addLayer(marker);
      gigMarkersRef.current.push(marker);
    });

    // Add hover popover for gig worker clusters (map-level popup so it always shows)
    clusterGroup.on('clustermouseover', function(e) {
      const cluster = e.layer;
      const map = mapInstanceRef.current;
      if (!map) return;

      // Close any existing gig cluster popup
      if (gigClusterHoverPopupRef.current) {
        map.removeLayer(gigClusterHoverPopupRef.current);
        gigClusterHoverPopupRef.current = null;
      }

      const markers = cluster.getAllChildMarkers();
      const gigs = markers.map(m => m.options.gigData).filter(Boolean);
      const gigCount = gigs.length;
      if (gigCount === 0) return;

      const serviceTypes = [];
      const seen = new Set();
      for (const gig of gigs) {
        const serviceType = gig.serviceType || gig.title;
        if (serviceType && !seen.has(serviceType.toLowerCase())) {
          serviceTypes.push(serviceType);
          seen.add(serviceType.toLowerCase());
        }
      }
      const displayServices = serviceTypes.slice(0, 5);

      const tooltipContent = `
        <div style="font-family: 'Open Sans', sans-serif; padding: 8px;">
          <div style="font-weight: 600; font-size: 13px; color: #0A0A0A; margin-bottom: 6px;">
            ${gigCount} ${gigCount === 1 ? 'gig worker' : 'gig workers'} available
          </div>
          ${displayServices.length > 0 ? `
            <div style="font-size: 11px; color: #575757;">
              ${displayServices.join(', ')}${serviceTypes.length > 5 ? '...' : ''}
            </div>
          ` : ''}
        </div>
      `;

      const popup = L.popup({
        closeButton: false,
        className: 'cluster-tooltip',
        offset: [0, -12],
        autoPan: false,
      })
        .setLatLng(cluster.getLatLng())
        .setContent(tooltipContent);
      popup.openOn(map);
      gigClusterHoverPopupRef.current = popup;
    });

    clusterGroup.on('clustermouseout', function() {
      const map = mapInstanceRef.current;
      if (map && gigClusterHoverPopupRef.current) {
        map.removeLayer(gigClusterHoverPopupRef.current);
        gigClusterHoverPopupRef.current = null;
      }
    });

    mapInstanceRef.current.addLayer(clusterGroup);
    gigClusterGroupRef.current = clusterGroup;
  };

  // Clear gig markers when switching to company mode
  useEffect(() => {
    if (searchMode !== "company" || !mapInstanceRef.current) return;
    if (gigClusterHoverPopupRef.current) {
      mapInstanceRef.current.removeLayer(gigClusterHoverPopupRef.current);
      gigClusterHoverPopupRef.current = null;
    }
    if (gigClusterGroupRef.current) {
      mapInstanceRef.current.removeLayer(gigClusterGroupRef.current);
      gigClusterGroupRef.current = null;
    }
    gigMarkersRef.current = [];
    setGigs([]);
    setSelectedGigType(null); // Clear filter when switching modes
  }, [searchMode]);

  // Clear company markers when switching to person mode
  useEffect(() => {
    if (searchMode !== "person" || !mapInstanceRef.current) return;
    if (clusterGroupRef.current) {
      mapInstanceRef.current.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    companyMarkersRef.current = [];
  }, [searchMode]);

  // Re-render gigs when filter, selected gig for distance, or home changes
  useEffect(() => {
    if (searchMode === "person" && gigs.length > 0 && mapInstanceRef.current) {
      renderGigMarkers(gigs);
    }
  }, [selectedGigType, selectedGigForDistance, homeLocation]);

  // Fetch all gigs when in person mode (person icon = show all gigs; location filter only when user does a place search)
  useEffect(() => {
    if (searchMode !== "person" || !mapInstanceRef.current) return;

    const fetchGigs = () => {
      fetch("/api/gigs")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.gigs)) {
            setGigs(data.gigs);
            renderGigMarkers(data.gigs);
          }
          // Don't render companies when in person mode - only show gig workers
        })
        .catch((err) => {
          console.error("Error fetching gigs:", err);
        });
    };

    fetchGigs();

    // Listen for gig deletion events to refresh the map
    const handleGigDeleted = () => {
      if (searchMode === "person" && mapInstanceRef.current) {
        fetchGigs();
      }
    };

    window.addEventListener("gigDeleted", handleGigDeleted);
    return () => {
      window.removeEventListener("gigDeleted", handleGigDeleted);
    };
  }, [searchMode, mapReady]);

  // Perform district-level zoom (state → district, stops at district)
  const performDistrictZoom = (dbData, showNoCompaniesMessage = false) => {
    if (!mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const state = dbData.state; // "Kerala"
    const district = dbData.district; // "Thrissur"
    
    // Set location context for future mode switches
    if (state) setLastSearchedState(state);
    if (district) setLastSearchedDistrict(district);

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
  const performLocalitySearchWithDBData = (dbData, localityData, searchMode = "job") => {
    if (!mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const companies = localityData.companies || [];
    const state = dbData.state || "";
    const district = dbData.district || "";
    
    // Set location context for future mode switches
    if (state) setLastSearchedState(state);
    if (district) setLastSearchedDistrict(district);

    // Use database coordinates if available, otherwise fall back to locations.json
    const hasCoordinates = dbData.latitude && dbData.longitude;
    const localityCenter = hasCoordinates
      ? [dbData.latitude, dbData.longitude]
      : [localityData.center.lat, localityData.center.lon];

    // Calculate state center from locality data
    const stateCenter = hasCoordinates 
      ? [dbData.latitude, dbData.longitude]
      : [localityData.center.lat, localityData.center.lon];
    
    // Use database coordinates for district center if available
    const districtCenter = hasCoordinates
      ? [dbData.latitude, dbData.longitude]
      : [localityData.center.lat, localityData.center.lon];

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

          // After final zoom, render company or gig markers by mode
          mapInstanceRef.current.once("moveend", () => {
            if (searchMode === "person") {
              const params = new URLSearchParams();
              if (state) params.set("state", state);
              if (district) params.set("district", district);
              fetch(`/api/gigs?${params.toString()}`)
                .then((r) => r.json())
                .then((data) => {
                  if (data.success && Array.isArray(data.gigs)) {
                    setGigs(data.gigs);
                    renderGigMarkers(data.gigs);
                  }
                })
                .finally(() => {
                  setIsFindingJobs(false);
                  setIsMapLoading(false);
                });
            } else if (searchMode === "company") {
              renderCompanyMarkers(companies);
              setTimeout(() => {
                setIsFindingJobs(false);
                setIsMapLoading(false);
              }, 300);
            } else {
              setIsFindingJobs(false);
              setIsMapLoading(false);
            }
          });
        });
      }, 500); // Small delay between stages
    });
  };

  // Perform college search - zoom to college location and show nearby companies
  const performCollegeSearch = (collegeData) => {
    if (!mapInstanceRef.current || !window.L) return;

    const L = window.L;

    // Use college coordinates
    const hasCoordinates = collegeData.latitude && collegeData.longitude;
    if (!hasCoordinates) {
      console.error("College coordinates not available", collegeData);
      setIsMapLoading(false);
      setIsFindingJobs(false);
      return;
    }

    // CRITICAL: Capture all values in local constants to avoid closure issues
    // If user searches multiple colleges quickly, collegeData gets overwritten
    // but these constants preserve the correct values for this search
    const collegeName = collegeData.name;
    const collegeLatitude = collegeData.latitude;
    const collegeLongitude = collegeData.longitude;
    const collegePincode = collegeData.pincode;

    // Debug: Log the college data to verify coordinates
    console.log("🏫 Performing college search:", {
      name: collegeName,
      latitude: collegeLatitude,
      longitude: collegeLongitude,
      pincode: collegePincode
    });

    // Ensure coordinates are numbers, not strings
    const lat = typeof collegeLatitude === 'number' ? collegeLatitude : parseFloat(collegeLatitude);
    const lon = typeof collegeLongitude === 'number' ? collegeLongitude : parseFloat(collegeLongitude);
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lon)) {
      console.error("❌ Invalid coordinates:", { lat, lon, collegeName });
      setIsMapLoading(false);
      setIsFindingJobs(false);
      alert(`Invalid coordinates for ${collegeName}. Please check the database.`);
      return;
    }
    
    const collegeCenter = [lat, lon];
    // Use India center as fallback
    const stateCenter = [20.5937, 78.9629]; // India center
    
    console.log("📍 College center coordinates:", collegeCenter);
    console.log("📍 Raw values:", { 
      collegeName, 
      rawLat: collegeLatitude, 
      rawLon: collegeLongitude,
      parsedLat: lat, 
      parsedLon: lon,
      latType: typeof collegeLatitude,
      lonType: typeof collegeLongitude
    });

    // Store college data in state
    setSelectedCollege({
      name: collegeName,
      latitude: lat,
      longitude: lon,
      pincode: collegePincode,
      locality: collegeData.locality || null,
      category: collegeData.category || null,
    });

    // Remove existing college marker if present
    if (collegeMarkerRef.current) {
      mapInstanceRef.current.removeLayer(collegeMarkerRef.current);
      collegeMarkerRef.current = null;
    }

    // Get company data from locations.json using pincode
    const localityData = getLocalityDataByPincode(
      collegePincode,
      null
    );

    // CRITICAL: Remove any existing "moveend" listeners to prevent conflicts
    // when user searches multiple colleges quickly
    mapInstanceRef.current.off("moveend");
    
    // Stage 1: Fly to State (zoom 8)
    mapInstanceRef.current.flyTo(stateCenter, 8, {
      duration: 1.5,
      easeLinearity: 0.25,
    });

    // Stage 2: After Stage 1 completes, fly to College location (zoom 15)
    // Use a unique handler function to avoid conflicts
    const handleStage1Complete = () => {
      // Remove this handler to prevent it from being called again
      mapInstanceRef.current.off("moveend", handleStage1Complete);
      
      setTimeout(() => {
        // Double-check coordinates are correct before zooming
        // Re-validate to ensure we're using the right values
        const finalLat = typeof collegeLatitude === 'number' ? collegeLatitude : parseFloat(collegeLatitude);
        const finalLon = typeof collegeLongitude === 'number' ? collegeLongitude : parseFloat(collegeLongitude);
        const finalCollegeCenter = [finalLat, finalLon];
        
        // Log before zooming to verify correct coordinates
        console.log(`🗺️ Zooming to ${collegeName}:`);
        console.log(`   Expected coordinates: [${finalLat}, ${finalLon}]`);
        console.log(`   College center array:`, finalCollegeCenter);
        console.log(`   Original values: lat=${collegeLatitude} (${typeof collegeLatitude}), lon=${collegeLongitude} (${typeof collegeLongitude})`);
        
        // Verify coordinates are valid before zooming
        if (isNaN(finalLat) || isNaN(finalLon)) {
          console.error(`❌ Invalid coordinates for ${collegeName}:`, { finalLat, finalLon });
          setIsFindingJobs(false);
          setIsMapLoading(false);
          return;
        }
        
        mapInstanceRef.current.flyTo(finalCollegeCenter, 15, {
          duration: 1.5,
          easeLinearity: 0.25,
        });

        // After final zoom, add college marker and render company markers if available
        const handleStage2Complete = () => {
          // Remove this handler to prevent it from being called again
          mapInstanceRef.current.off("moveend", handleStage2Complete);
          
          // Create and add college marker
          const collegeIcon = createCollegeIcon(L);
          const collegeMarker = L.marker([finalLat, finalLon], {
            icon: collegeIcon,
            zIndexOffset: 2000,
            interactive: true,
          }).addTo(mapInstanceRef.current);

          collegeMarkerRef.current = collegeMarker;

          // Add tooltip for college marker
          collegeMarker.bindTooltip(
            `<div style="font-weight:bold;color:#1A1A1A;font-size:14px;">${collegeName}</div>`,
            {
              permanent: false,
              direction: "right",
              offset: [10, 0],
              className: "college-panel-tooltip",
              interactive: true,
            }
          );

          // Click handler for college marker
          collegeMarker.on("click", function () {
            if (collegeMarker.isTooltipOpen()) {
              collegeMarker.closeTooltip();
            } else {
              collegeMarker.openTooltip();
            }
          });

          // Filter companies within 3km radius
          let filteredCompanies = [];
          if (localityData && localityData.companies && localityData.companies.length > 0) {
            filteredCompanies = localityData.companies.filter((company) => {
              if (!company.latitude || !company.longitude) return false;
              const companyCoords = [company.latitude, company.longitude];
              const distanceMeters = mapInstanceRef.current.distance(
                [finalLat, finalLon],
                companyCoords
              );
              return distanceMeters <= 3000; // 3km = 3000 meters
            });
            
            console.log(`📍 Filtered companies within 3km: ${filteredCompanies.length} out of ${localityData.companies.length}`);
          }

          if (filteredCompanies.length > 0) {
            // Calculate distances from college to companies
            calculateCollegeDistances(
              { latitude: finalLat, longitude: finalLon },
              filteredCompanies,
              mapInstanceRef.current
            ).then((distances) => {
              setCollegeDistances(distances);
            });
            
            renderCompanyMarkers(filteredCompanies);
          } else {
            // Show "No companies found" message
            // Use captured collegeName constant instead of collegeData.name
            const noCompaniesMessage = L.popup({
              className: "no-companies-message",
              closeButton: true,
              autoClose: false,
              closeOnClick: false,
            })
              .setLatLng([lat, lon])
              .setContent(`
                <div style="font-family: 'Open Sans', sans-serif; padding: 12px; text-align: center;">
                  <div style="font-weight: 600; font-size: 16px; color: #0A0A0A; margin-bottom: 8px;">
                    No Companies Found
                  </div>
                  <div style="font-size: 14px; color: #1A1A1A;">
                    No companies available near ${collegeName} at this time.
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
        };
        
        mapInstanceRef.current.once("moveend", handleStage2Complete);
      }, 500);
    };
    
    mapInstanceRef.current.once("moveend", handleStage1Complete);
  };

  // Create company marker icon function
  const createCustomTeardropIcon = (L, logoUrl = null, size = 50, distanceKm = null) => {
    const boxSize = size;
    const lightBlueBorder = "#87CEEB";
    const badgeHeight = 20; // Height of the badge including padding

    // Distance badge HTML - positioned at the bottom of the pindrop
    const badgeHtml =
      distanceKm !== null
        ? `<div style="position:absolute;bottom:-${badgeHeight}px;left:50%;transform:translateX(-50%);background-color:#0A0A0A;color:white;border-radius:4px;padding:3px 8px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.4);pointer-events:none;z-index:1000;font-family:'Open Sans',sans-serif;line-height:1.2;">${distanceKm} km</div>`
        : "";

    // Main marker HTML - container must allow overflow for badge visibility
    const html = `<div class="company-marker" style="position:relative;width:${boxSize}px;height:${boxSize}px;background-color:#FFFFFF;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 2px 8px rgba(0,0,0,0.12),0 1px 3px rgba(0,0,0,0.08);border:2px solid ${lightBlueBorder};cursor:pointer;transition:transform 0.2s ease,box-shadow 0.2s ease;overflow:visible;">${
      logoUrl
        ? `<img src="${logoUrl}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" />`
        : `<div style="width:100%;height:100%;background:#F84416;border-radius:6px;"></div>`
    }${badgeHtml}</div>`;

    // Calculate total icon size including badge
    const totalHeight = boxSize + (distanceKm !== null ? badgeHeight : 0);

    return L.divIcon({
      html: html,
      className: "custom-pindrop-marker",
      iconSize: [boxSize, totalHeight],
      iconAnchor: [
        boxSize / 2,
        totalHeight, // Anchor at the bottom of the total height (including badge)
      ],
      popupAnchor: [0, -totalHeight - 10],
    });
  };

  // Job posting pindrop: round, primary border, shadow; optional logoUrl (else gemni.png). onerror fallback when logo fails to load.
  const PRIMARY_BORDER = "#F84416";
  const DEFAULT_LOGO = "/gemni.png";
  const createGeminiJobIcon = (L, size = 50, logoUrl = null, jobCount = 0) => {
    const imgSrc = logoUrl || DEFAULT_LOGO;
    const safeSrc = imgSrc.replace(/"/g, "&quot;");
    const badgeHeight = 20;
    const totalH = size + (jobCount > 0 ? badgeHeight : 0);
    const label = jobCount === 1 ? "1 position open" : `${jobCount} positions open`;
    const badgeHtml = jobCount > 0
      ? `<div class="company-marker-badge" style="position:absolute;left:50%;top:${size}px;transform:translateX(-50%);white-space:nowrap;background:${PRIMARY_BORDER};color:#fff;font-size:10px;font-weight:600;padding:2px 6px;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.2);font-family:'Open Sans',sans-serif;">${label}</div>`
      : "";
    const html = `<div class="company-marker" style="position:relative;width:${size}px;height:${totalH}px;cursor:pointer;"><div style="position:relative;width:${size}px;height:${size}px;background-color:#FFFFFF;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform 0.2s ease;box-shadow:0 2px 8px rgba(0,0,0,0.15),0 1px 3px rgba(0,0,0,0.1);border:2px solid ${PRIMARY_BORDER};overflow:hidden;"><img src="${safeSrc}" alt="Job" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null;this.src='${DEFAULT_LOGO}';" /></div>${badgeHtml}</div>`;
    return L.divIcon({
      html,
      className: "custom-pindrop-marker",
      iconSize: [size, totalH],
      iconAnchor: [size / 2, totalH],
      popupAnchor: [0, -totalH - 10],
    });
  };

  const createOrgIconMarker = (L, size = 50, jobCount = 0) => {
    const badgeHeight = 20;
    const totalH = size + (jobCount > 0 ? badgeHeight : 0);
    const label = jobCount === 1 ? "1 position open" : `${jobCount} positions open`;
    const badgeHtml = jobCount > 0
      ? `<div style="position:absolute;left:50%;top:${size}px;transform:translateX(-50%);white-space:nowrap;background:${PRIMARY_BORDER};color:#fff;font-size:10px;font-weight:600;padding:2px 6px;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.2);font-family:'Open Sans',sans-serif;">${label}</div>`
      : "";
    const html = `
      <div style="position:relative;width:${size}px;height:${totalH}px;">
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F84416 0%, #FF6B47 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">
          <svg width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 32 32" fill="white">
            <path d="M16 2C14.3 2 13 3.3 13 5s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3zM8 8C6.3 8 5 9.3 5 11s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3zM24 8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3zM16 14c-3.3 0-6 2.7-6 6v10h12V20c0-3.3-2.7-6-6-6z"/>
          </svg>
        </div>
        ${badgeHtml}
      </div>
    `;
    return L.divIcon({
      html,
      className: "custom-org-marker",
      iconSize: [size, totalH],
      iconAnchor: [size / 2, totalH],
      popupAnchor: [0, -totalH - 10],
    });
  };

  useEffect(() => {
    setIsClient(true);
    
    // Fetch user account type and set initial search mode
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.user?.accountType) {
          setUserAccountType(data.user.accountType);
          // Set initial search mode: "person" for all account types (default)
          setSearchMode("person");
        }
      })
      .catch(() => {});

    // Fetch total companies count
    fetch("/api/companies")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.companies && Array.isArray(data.companies)) {
          setTotalCompaniesCount(data.companies.length);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Only run on client side
    if (!isClient || !mapRef.current || mapInstanceRef.current) return;

    // Dynamic import of Leaflet to avoid SSR issues
    import("leaflet").then((LModule) => {
      try {
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

        // Guard: container may be unmounted (e.g. user navigated away) during async load
        if (!mapRef.current || !document.body.contains(mapRef.current)) return;

        // Set initial view to India center
        // Will be adjusted by fitBounds when markers are added
        const initialLat = 20.5937;
        const initialLon = 78.9629;
        const zoom = 5; // Default zoom for India view

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
          setMapReady(true);

          // zoomToJobCoords is handled in the addMarkersToMap effect so the "my job" marker can be added there
        }).catch((error) => {
          console.error("Error loading markercluster:", error);
        });
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }).catch((error) => {
      console.error("Error loading Leaflet:", error);
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        // Remove all markers and lines
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

  // "Locate me on map": use first gig location, else home, else show get-coordinates modal (three options)
  const runLocateMeOnMap = () => {
    if (!mapInstanceRef.current || !window.L) return;

    const applyCoords = (lat, lng) => {
      if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
        zoomToUserLocation({ lat, lng });
      }
    };

    // 1) Try first gig location (user who posted a gig)
    fetch("/api/gigs?mine=1", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const first = data?.gigs?.[0];
        if (first && first.latitude != null && first.longitude != null) {
          applyCoords(first.latitude, first.longitude);
          return;
        }
        // 2) Else use home location if set
        if (
          homeLocation?.homeLatitude != null &&
          homeLocation?.homeLongitude != null &&
          Number.isFinite(Number(homeLocation.homeLatitude)) &&
          Number.isFinite(Number(homeLocation.homeLongitude))
        ) {
          applyCoords(Number(homeLocation.homeLatitude), Number(homeLocation.homeLongitude));
          return;
        }
        // 3) Else show modal: use device location, enter coords/link, or cancel
        setShowLocateMeCoordModal(true);
      })
      .catch(() => {
        // On fetch error, try home then modal
        if (
          homeLocation?.homeLatitude != null &&
          homeLocation?.homeLongitude != null &&
          Number.isFinite(Number(homeLocation.homeLatitude)) &&
          Number.isFinite(Number(homeLocation.homeLongitude))
        ) {
          applyCoords(Number(homeLocation.homeLatitude), Number(homeLocation.homeLongitude));
        } else {
          setShowLocateMeCoordModal(true);
        }
      });
  };

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || typeof window === "undefined") return;
    const flag = sessionStorage.getItem("locateMeOnMap");
    if (flag) {
      sessionStorage.removeItem("locateMeOnMap");
      runLocateMeOnMap();
    }
    const onLocateMe = () => runLocateMeOnMap();
    window.addEventListener("locateMeOnMap", onLocateMe);
    return () => window.removeEventListener("locateMeOnMap", onLocateMe);
  }, [mapReady]);

  // Add markers when locations data and map are ready (companies only when in company mode)
  useEffect(() => {
    if (!mapInstanceRef.current || !locationsData) {
      return;
    }

    // Only render companies when in company mode
    if (searchMode !== "company") {
      // Clear company markers if switching away from company mode
      if (clusterGroupRef.current) {
        mapInstanceRef.current.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
      companyMarkersRef.current = [];
      return;
    }

    const addMarkersToMap = async () => {
      const L = window.L;
      if (!L || !mapInstanceRef.current) {
        setTimeout(() => {
          if (window.L && mapInstanceRef.current) {
            addMarkersToMap();
          }
        }, 100);
        return;
      }

      // Fetch companies from API to display on map
      let companies = [];
      
      try {
        const res = await fetch('/api/companies');
        if (res.ok) {
          const data = await res.json();
          companies = data.companies || [];
          setTotalCompaniesCount(companies.length);
          console.log('✅ Fetched companies for map:', companies.length);
        } else {
          console.error('Failed to fetch companies:', res.status);
          setTotalCompaniesCount(0);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        setTotalCompaniesCount(0);
      }

      if (clusterGroupRef.current) {
        mapInstanceRef.current.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
      companyMarkersRef.current = [];

      if (companies && companies.length > 0) {
        // Create marker cluster group for companies with glassmorphism style
        const clusterGroup = L.markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 80,
          showCoverageOnHover: false,
          iconCreateFunction: function(cluster) {
            const markers = cluster.getAllChildMarkers();
            const count = markers.length;
            
            // Get up to 4 unique company logos from the markers
            const logos = [];
            const seen = new Set();
            
            for (const marker of markers) {
              if (logos.length >= 4) break;
              const company = marker.companyData;
              const logoUrl = company?.logoPath || company?.logoUrl || null;
              
              if (logoUrl && !seen.has(logoUrl)) {
                logos.push(logoUrl);
                seen.add(logoUrl);
              }
            }
            
            // Light bubble size
            const baseSize = 56;
            const size = Math.min(baseSize + (count * 2), 100);
            const padding = 10;

            // 2x2 grid: always 4 cells, fill with logos (empty if fewer than 4)
            const logoCells = [];
            for (let i = 0; i < 4; i++) {
              const url = logos[i];
              if (url) {
                logoCells.push(`
                  <div style="width:100%;height:100%;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;background:white;">
                    <img src="${url}" alt="" style="width:80%;height:80%;object-fit:contain;" onerror="this.style.display='none'" />
                  </div>
                `);
              } else {
                logoCells.push('<div style="width:100%;height:100%;"></div>');
              }
            }

            const html = `
              <div style="
                position: relative;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                border: 1px solid rgba(255, 255, 255, 0.4);
                box-shadow: inset 0 20px 30px rgba(255, 255, 255, 0.3), inset 10px 0 20px rgba(0, 0, 0, 0.02), inset -10px -20px 30px rgba(0, 0, 0, 0.05), 0 15px 35px rgba(0, 0, 0, 0.08);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: ${padding}px;
                box-sizing: border-box;
              ">
                <div style="
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  grid-template-rows: 1fr 1fr;
                  gap: 4px;
                  width: 100%;
                  height: 100%;
                  min-width: 0;
                  min-height: 0;
                ">
                  ${logoCells.join('')}
                </div>
                ${count > 4 ? `
                  <div style="
                    position: absolute;
                    bottom: 4px;
                    right: 4px;
                    background: rgba(0, 0, 0, 0.55);
                    color: white;
                    border-radius: 10px;
                    padding: 2px 6px;
                    font-size: 10px;
                    font-weight: 600;
                  ">
                    +${count - 4}
                  </div>
                ` : ''}
              </div>
            `;

            return L.divIcon({
              html: html,
              className: 'marker-cluster-custom',
              iconSize: L.point(size, size),
              iconAnchor: [size / 2, size / 2],
            });
          },
        });
        clusterGroupRef.current = clusterGroup;

        // Create company markers
        companies.forEach((company, index) => {
          const companyLogoUrl = company.logoPath || company.logoUrl || null;
          const positionsOpen = company.jobCount ?? 0;
          const customIcon = companyLogoUrl
            ? createGeminiJobIcon(L, 50, companyLogoUrl, positionsOpen)
            : createOrgIconMarker(L, 50, positionsOpen);
          const companyName = company.company_name || company.name || "Company";

          const marker = L.marker([company.lat, company.lon], {
            icon: customIcon,
            zIndexOffset: 1000 + index,
            opacity: 1,
          });

          // Store company data on marker
          marker.companyData = company;

          // Add click handler to fetch and display jobs
          marker.on("click", async () => {
            console.log('🔍 Company pin clicked:', company.id, company.company_name || company.name);
            try {
              const res = await fetch(`/api/companies/${company.id}/jobs`);
              console.log('📡 API response status:', res.status);
              if (res.ok) {
                const data = await res.json();
                console.log('✅ Jobs fetched:', data.jobs?.length || 0, 'jobs');
                setSelectedCompanyForSidebar(company);
                setSelectedCompanyJobs(data.jobs || []);
                setShowCompanyJobsSidebar(true);
                console.log('✅ Sidebar state set to true');
              } else {
                console.error('❌ API error:', res.status, res.statusText);
              }
            } catch (e) {
              console.error("❌ Failed to fetch company jobs:", e);
            }
          });

          clusterGroup.addLayer(marker);
          companyMarkersRef.current.push(marker);
        });

        // Add hover tooltip for clusters
        clusterGroup.on('clustermouseover', async function(e) {
          const cluster = e.layer;
          const markers = cluster.getAllChildMarkers();
          const companies = markers.map(m => m.companyData).filter(Boolean);
          const companyCount = companies.length;
          
          if (companyCount === 0) return;
          
          // Fetch job titles for these companies
          try {
            const companyIds = companies.map(c => c.id);
            const res = await fetch('/api/companies/job-titles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ companyIds }),
            });
            
            if (res.ok) {
              const data = await res.json();
              const titles = data.titles || [];
              const displayTitles = titles.slice(0, 5);
              
              const tooltipContent = `
                <div style="font-family: 'Open Sans', sans-serif; padding: 8px;">
                  <div style="font-weight: 600; font-size: 13px; color: #0A0A0A; margin-bottom: 6px;">
                    ${companyCount} ${companyCount === 1 ? 'company' : 'companies'} hiring
                  </div>
                  ${displayTitles.length > 0 ? `
                    <div style="font-size: 11px; color: #575757;">
                      ${displayTitles.join(', ')}${titles.length > 5 ? '...' : ''}
                    </div>
                  ` : ''}
                </div>
              `;
              
              cluster.bindTooltip(tooltipContent, {
                permanent: false,
                direction: 'top',
                className: 'cluster-tooltip',
                offset: [0, -10],
                interactive: false,
                opacity: 1,
              }).openTooltip();
            }
          } catch (error) {
            console.error('Error fetching job titles for tooltip:', error);
          }
        });

        clusterGroup.on('clustermouseout', function(e) {
          const cluster = e.layer;
          cluster.closeTooltip();
        });

        // Add cluster group to map
        mapInstanceRef.current.addLayer(clusterGroup);

        // Calculate bounds from company coordinates only
        const allCoords = companies.map(c => [c.lat, c.lon]);
        const lats = allCoords.map(c => c[0]);
        const lons = allCoords.map(c => c[1]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);

        const latPadding = (maxLat - minLat) * 0.1 || 0.01;
        const lonPadding = (maxLon - minLon) * 0.1 || 0.01;
        const bounds = L.latLngBounds(
          [minLat - latPadding, minLon - lonPadding],
          [maxLat + latPadding, maxLon + lonPadding]
        );

        const totalPinCount = companies.length;
        const padding = calculateOptimalPadding(totalPinCount);

        const maxZoomLevel = companies.length >= 5 ? 12 : 14;

        setTimeout(() => {
          const group = new L.featureGroup(companyMarkersRef.current);
          const groupBounds = group.getBounds();
          const paddedBounds = groupBounds.pad(0.1);
          mapInstanceRef.current.fitBounds(paddedBounds, {
            maxZoom: maxZoomLevel,
          });
        }, 200);
      }
    };

    addMarkersToMap();
  }, [mapInstanceRef.current, locationsData, searchMode]);

  // Zoom to job coordinates when arriving from "See your posting on the map"
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem("zoomToJobCoords") : null;
      if (raw && mapInstanceRef.current) {
        const payload = JSON.parse(raw);
        const lat = payload.lat;
        const lng = payload.lng;
        const companyName = payload.companyName || "Your posting";
        const logoUrl = payload.logoUrl || null;
        if (typeof lat === "number" && typeof lng === "number") {
          sessionStorage.removeItem("zoomToJobCoords");
          const L = window.L;
          if (L) {
            if (zoomToJobMarkerRef.current) {
              mapInstanceRef.current.removeLayer(zoomToJobMarkerRef.current);
              zoomToJobMarkerRef.current = null;
            }
            const jobIcon = createGeminiJobIcon(L, 50, logoUrl);
            const myJobMarker = L.marker([lat, lng], {
              icon: jobIcon,
              zIndexOffset: 3000,
              opacity: 1,
            });
            const popupContent = `
              <div style="font-family: 'Open Sans', sans-serif; padding: 4px;">
                <div style="font-weight: 600; font-size: 14px; color: #0A0A0A;">${companyName}</div>
              </div>
            `;
            myJobMarker.bindPopup(popupContent, { className: "company-popup" });
            myJobMarker.addTo(mapInstanceRef.current);
            zoomToJobMarkerRef.current = myJobMarker;
          }
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([lat, lng], 15);
            }
          }, 400);
        }
      }
    } catch (_) {}

    // Zoom to gig coords when arriving from onboarding "View on map" after posting a gig
    try {
      const gigRaw = typeof window !== "undefined" ? sessionStorage.getItem("zoomToGigCoords") : null;
      if (gigRaw && mapInstanceRef.current) {
        const payload = JSON.parse(gigRaw);
        const lat = payload.lat;
        const lng = payload.lng;
        const state = payload.state;
        const district = payload.district;
        if (typeof lat === "number" && typeof lng === "number") {
          sessionStorage.removeItem("zoomToGigCoords");
          setSearchMode("person");
          
          // Set location context for future mode switches
          if (state) setLastSearchedState(state);
          if (district) setLastSearchedDistrict(district);
          
          // Fetch gigs filtered by location if available, otherwise fetch all
          const params = new URLSearchParams();
          if (state) params.set("state", state);
          if (district) params.set("district", district);
          const url = params.toString() ? `/api/gigs?${params.toString()}` : "/api/gigs";
          
          fetch(url)
            .then((r) => r.json())
            .then((data) => {
              if (data.success && Array.isArray(data.gigs)) {
                setGigs(data.gigs);
                renderGigMarkers(data.gigs);
              }
            })
            .catch(() => {});
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([lat, lng], 14);
            }
          }, 500);
        }
      }
    } catch (_) {}
  }, [locationsData, isClient, mapReady]);

  // Check if search query is a college search (only when user types college-related keywords).
  // Place names like "Thrissur" must not be treated as college search so locality suggestions show.
  const isCollegeSearchQuery = (query) => {
    if (!query || !query.trim() || colleges.length === 0) return false;

    const normalizedQuery = query.toLowerCase().trim();

    const collegeKeywords = [
      "college",
      "university",
      "institute",
      "school",
      "academy",
      "gec",
      "mti",
      "pmgc",
      "government college",
      "govt college",
      "engineering college",
      "arts college",
      "science college",
      "polytechnic",
      "law college",
      "fine arts",
    ];

    return collegeKeywords.some((keyword) => normalizedQuery.includes(keyword));
  };

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

  // Parse college from search query
  const parseCollegeFromQuery = (query) => {
    if (!query || !query.trim()) return null;

    const normalizedQuery = query.toLowerCase().trim();
    
    // Pattern 1: "jobs near [College]" or "companies near [College]"
    const pattern1 = /(?:jobs|companies|internships)\s+near\s+(.+)/i;
    const match1 = normalizedQuery.match(pattern1);
    if (match1) {
      return match1[1].trim();
    }

    // Pattern 2: Just the college name - return the query itself
    return query.trim();
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

  // Request location permission from browser
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      console.error('❌ Geolocation is not supported by this browser');
      setLocationError('Geolocation is not supported by your browser. Please search for a specific locality.');
      return { granted: false, location: null };
    }

    // Check if permission is already granted
    try {
      // Try to get permission status (if supported)
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        console.log('📍 Location permission status:', permissionStatus.state);
        
        if (permissionStatus.state === 'granted') {
          console.log('✅ Location permission already granted');
          return { granted: true, location: null }; // Will fetch location separately
        }
        
        if (permissionStatus.state === 'denied') {
          console.error('❌ Location permission denied');
          setLocationError('Location permission denied. Please allow location access in your browser settings.');
          alert('Location permission denied. Please allow location access in your browser settings to use "near me" features.');
          return { granted: false, location: null };
        }
      }
    } catch (error) {
      console.log('⚠️ Permission query not supported, will request permission directly');
    }

    // Request permission by attempting to get location (browser will prompt)
    // Note: This will also fetch location, but we'll use detectUserLocation for the actual location fetch
    return new Promise((resolve) => {
      console.log('🔍 Requesting location permission from browser...');
      setIsDetectingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Location permission granted');
          setIsDetectingLocation(false);
          resolve({ granted: true, location: null }); // Permission granted, will fetch location separately
        },
        (error) => {
          console.error('❌ Location permission error:', {
            code: error.code,
            message: error.message,
            PERMISSION_DENIED: error.code === 1,
            POSITION_UNAVAILABLE: error.code === 2,
            TIMEOUT: error.code === 3
          });
          
          setIsDetectingLocation(false);
          
          const localityHint = ' You can search for a locality instead.';
          let errorMessage = 'Unable to access your location. ';
          if (error.code === 1) {
            errorMessage = 'Location permission denied. Please allow location access in your browser settings to use "near me" features.' + localityHint;
            setLocationError(errorMessage);
            alert(errorMessage);
          } else if (error.code === 2) {
            errorMessage = 'Location unavailable (in some browsers "Near me" does not work). Please search for a locality instead.';
            setLocationError(errorMessage);
            alert(errorMessage);
          } else if (error.code === 3) {
            errorMessage = 'Location request timed out. Please try again or search for a specific locality.';
            setLocationError(errorMessage);
            alert(errorMessage);
          } else {
            errorMessage = 'Unable to detect your location. In some browsers "Near me" may not work; try searching for a locality instead.';
            setLocationError(errorMessage);
            alert(errorMessage);
          }
          
          resolve({ granted: false, location: null });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds for permission request
          maximumAge: 0, // Force fresh request
        }
      );
    });
  };

  // Detect user location using browser geolocation with IP fallback
  const detectUserLocation = async (forceRefresh = false) => {
    if (!mapInstanceRef.current) {
      console.error('Map instance not available');
      return null;
    }

    setIsDetectingLocation(true);
    setLocationError(null);

    // First, try native browser geolocation API directly (more accurate)
    if (navigator.geolocation) {
      try {
        console.log('🔍 Requesting browser geolocation with HIGH ACCURACY...');
        console.log('💡 TIP: If using USB tethering/hotspot, open this site on your PHONE for accurate GPS location');
        
        const browserLocation = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                source: 'browser',
                timestamp: position.timestamp
              };
              
              console.log('✅ Browser geolocation successful:', {
                ...location,
                accuracyMeters: `${Math.round(position.coords.accuracy)}m`,
                method: position.coords.accuracy < 100 ? 'GPS' : position.coords.accuracy < 1000 ? 'WiFi/Cell' : 'WiFi (Inaccurate)'
              });
              
              // Warn if accuracy is poor (> 1km) - likely WiFi positioning
              if (position.coords.accuracy > 1000) {
                console.warn('⚠️ Location accuracy is POOR (>1km). This is WiFi-based positioning.');
                console.warn('⚠️ Your WiFi network is registered at the wrong location in Google/Mozilla databases.');
                console.warn('⚠️ SOLUTIONS:');
                console.warn('   1. 📱 BEST: Open this site on your MOBILE PHONE (has GPS)');
                console.warn('   2. 🔌 If using USB tethering: Open on the PHONE, not laptop');
                console.warn('   3. 🔍 Or search for your city/area manually instead');
                
                // Show user-friendly warning
                const userConfirm = confirm(
                  `⚠️ Location detected but accuracy is poor (${Math.round(position.coords.accuracy)}m).\n\n` +
                  `This is likely because:\n` +
                  `• You're on a laptop/desktop (no GPS)\n` +
                  `• Your WiFi is registered at wrong location\n` +
                  `• You're using USB tethering/hotspot\n\n` +
                  `SOLUTIONS:\n` +
                  `1. Open this site on your MOBILE PHONE for accurate GPS\n` +
                  `2. Or search for your city manually\n\n` +
                  `Use this inaccurate location anyway?`
                );
                
                if (!userConfirm) {
                  reject(new Error('User rejected inaccurate location'));
                  return;
                }
              }
              
              resolve(location);
            },
            (error) => {
              const code = error?.code;
              const message = error?.message ?? "Unknown error";
              if (code === 2) {
                console.warn("Location unavailable (browser/network). User can allow location or search manually.");
              } else if (code !== undefined || message) {
                console.warn("Geolocation:", message, "code:", code);
              }
              reject(error);
            },
            {
              enableHighAccuracy: true, // Use GPS if available
              timeout: 20000, // 20 seconds - longer for GPS
              maximumAge: forceRefresh ? 0 : 5000, // Force fresh if requested, otherwise allow 5s cache
            }
          );
        });

        if (browserLocation) {
          setIsDetectingLocation(false);
          return browserLocation;
        }
      } catch (browserError) {
        console.log('⚠️ Browser geolocation failed or rejected');
        setIsDetectingLocation(false);
        setLocationError('Location detection failed. In some browsers "Near me" may not work; please search for a locality instead.');
        return null;
      }
    }

    // Fallback to Leaflet's locate method
    return new Promise((resolve) => {
      const L = window.L;
      if (!L) {
        setIsDetectingLocation(false);
        resolve(null);
        return;
      }

      // Try browser geolocation via Leaflet
      mapInstanceRef.current.locate({
        setView: false, // We'll handle zoom manually
        maxZoom: 16,
        timeout: 15000, // Increased timeout
        enableHighAccuracy: true,
        watch: false, // Don't watch, just get once
      });

      // Handle successful location detection
      const handleLocationFound = (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const accuracy = e.accuracy || null;
        
        console.log('✅ Leaflet geolocation successful:', { lat, lng, accuracy });
        
        // Remove event listeners
        mapInstanceRef.current.off('locationfound', handleLocationFound);
        mapInstanceRef.current.off('locationerror', handleLocationError);
        
        setIsDetectingLocation(false);
        resolve({ lat, lng, accuracy, source: 'browser' });
      };

      // Handle location error (show error, don't use IP fallback)
      const handleLocationError = async (e) => {
        console.error('❌ All geolocation methods failed');
        
        // Remove event listeners
        mapInstanceRef.current.off('locationfound', handleLocationFound);
        mapInstanceRef.current.off('locationerror', handleLocationError);
        
        setIsDetectingLocation(false);
        
        // Show detailed error message; in some browsers "Near me" may not work (e.g. network location 404)
        let errorMessage = 'Unable to detect your location. ';
        if (e.code === 1) {
          errorMessage += 'Location permission denied. Please allow location access in your browser settings.';
        } else if (e.code === 2) {
          errorMessage += 'Location unavailable. In some browsers "Near me" does not work; please search for a locality instead.';
        } else if (e.code === 3) {
          errorMessage += 'Location request timed out. Please try again or search for a locality.';
        } else {
          errorMessage += 'Please search for a specific locality instead.';
        }
        errorMessage += ' You can search for a locality in the search box.';
        setLocationError(errorMessage);
        alert(errorMessage);
        resolve(null);
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
          // Check if location is less than 10 minutes old (shorter cache for mobile users)
          const tenMinutes = 10 * 60 * 1000;
          const isRecent = Date.now() - locationData.timestamp < tenMinutes;
          const isAccurate = locationData.source === 'browser' && !locationData.approximate;
          
          if (isRecent && isAccurate) {
            console.log('✅ Using cached browser location from sessionStorage');
            console.log('💡 TIP: If location is wrong, clear cache and open on mobile phone');
            return locationData;
          } else if (isRecent && !isAccurate) {
            console.log('⚠️ Cached location is approximate, fetching fresh location...');
            return null; // Force fresh location if cached is inaccurate
          } else {
            console.log('⏰ Cached location expired, fetching fresh location...');
            return null;
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

    // Create user location marker with theme-color glow to differentiate from other gig workers
    const themeGlow = "rgba(248, 68, 22, 0.5)";
    const themeBorder = "#F84416";
    const userLocationIcon = L.divIcon({
      html: `<div class="user-location-marker-glow" style="background-color:${themeBorder};border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;border:3px solid #FFFFFF;box-shadow:0 0 0 4px ${themeGlow}, 0 0 20px ${themeGlow}, 0 2px 12px rgba(0,0,0,0.25);opacity:0.95;">📍</div>`,
      className: "user-location-marker",
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    // Add marker to map
    const marker = L.marker([lat, lng], {
      icon: userLocationIcon,
      zIndexOffset: 2500, // Higher than home marker (2000)
      interactive: true,
    }).addTo(mapInstanceRef.current);

    // Add accuracy info to tooltip if available
    const accuracyText = location.accuracy 
      ? ` (±${Math.round(location.accuracy)}m)` 
      : '';
    const methodText = location.accuracy && location.accuracy < 100 
      ? ' [GPS]' 
      : location.accuracy && location.accuracy < 1000 
        ? ' [WiFi]' 
        : '';
    
    marker.bindTooltip(`Your current location${accuracyText}${methodText}`, {
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

      // Check if this is a college search query
      if (isCollegeSearchQuery(queryToSearch)) {
        console.log("🔍 College search detected...");
        
        // Parse college from search query
        const collegeName = parseCollegeFromQuery(queryToSearch);
        
        if (collegeName) {
          try {
            // Search for college in database
            const response = await fetch(
              `/api/search-college?college=${encodeURIComponent(collegeName)}`
            );
            
            if (!response.ok) {
              setIsMapLoading(false);
              setIsFindingJobs(false);
              
              const errorData = await response.json().catch(() => ({}));
              const errorMessage = errorData.error || "Unknown error";
              const errorDetails = errorData.details || "";
              console.error("College search error:", errorMessage, errorDetails);
              
              // Check if it's a server error (like prisma.college undefined)
              if (response.status === 503 || (errorDetails && errorDetails.includes("restart"))) {
                alert("College search is not available yet. Please restart the development server:\n\n1. Stop the server (Ctrl+C)\n2. Run: npm run dev\n\nThis will load the College model.");
                return;
              }
              
              // Only show empty state if college truly not found (404)
              if (response.status === 404) {
                console.log("🔍 Showing empty state for college:", collegeName);
                setTimeout(() => {
                  setEmptyStateQuery(collegeName);
                  setShowEmptyState(true);
                }, 100);
              } else {
                // For other errors, show alert with details
                const fullMessage = errorDetails 
                  ? `${errorMessage}\n\n${errorDetails}`
                  : errorMessage;
                alert(`Error searching for college: ${fullMessage}`);
              }
              return;
            }

            const collegeData = await response.json();
            console.log("✅ Found college in database:", {
              name: collegeData.name,
              latitude: collegeData.latitude,
              longitude: collegeData.longitude,
              pincode: collegeData.pincode,
              category: collegeData.category
            });

            // Verify college data has required fields
            if (!collegeData || !collegeData.name) {
              console.error("Invalid college data received:", collegeData);
              setIsMapLoading(false);
              setIsFindingJobs(false);
              alert("Invalid college data received. Please try again.");
              return;
            }

            // Verify coordinates are available
            if (!collegeData.latitude || !collegeData.longitude) {
              console.error("College coordinates not available:", collegeData);
              setIsMapLoading(false);
              setIsFindingJobs(false);
              alert(`College "${collegeData.name}" found but coordinates are not available.`);
              return;
            }
            
            // Debug: Verify coordinates are numbers
            if (typeof collegeData.latitude !== 'number' || typeof collegeData.longitude !== 'number') {
              console.warn("⚠️ College coordinates are not numbers:", {
                latitude: collegeData.latitude,
                latitudeType: typeof collegeData.latitude,
                longitude: collegeData.longitude,
                longitudeType: typeof collegeData.longitude
              });
            }

            setIsMapLoading(false);
            setIsFindingJobs(true);
            // Perform college search and zoom - this will always zoom to college even if no companies
            performCollegeSearch(collegeData);
          } catch (error) {
            setIsMapLoading(false);
            setIsFindingJobs(false);
            console.error("Error searching college:", error);
            alert("An error occurred while searching. Please try again.");
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
            setLastSearchedDistrict(null);
            setLastSearchedState(null);
            // Clear all loading states first
            setIsMapLoading(false);
            setIsFindingJobs(false);
            setIsDetectingLocation(false);
            
            const responseText = await response.text();
            let errorData = {};
            try {
              errorData = responseText ? JSON.parse(responseText) : {};
            } catch {
              console.error("Locality search non-JSON response:", response.status, response.statusText, responseText?.slice(0, 200));
            }
            const errorMessage = errorData.error || `Server error (${response.status})`;
            const errorDetails = errorData.details || (responseText && !errorData.error ? responseText.slice(0, 200) : "");
            console.error("Locality search error:", response.status, errorMessage, errorDetails);
            
            // Check if it's a server error (like prisma.pincode undefined)
            if (response.status === 503 || (errorDetails && errorDetails.includes("restart"))) {
              alert("Locality search is not available. Please restart the development server:\n\n1. Stop the server (Ctrl+C)\n2. Run: npm run dev\n\nThis will load the database models.");
              return;
            }
            
            // Only show empty state if locality truly not found (404)
            if (response.status === 404) {
              console.log("🔍 Showing empty state for:", localityName);
              setTimeout(() => {
                setEmptyStateQuery(localityName);
                setShowEmptyState(true);
                console.log("✅ Empty state should be visible now, showEmptyState:", true);
              }, 100);
            } else {
              // For other errors, show alert
              const fullMessage = errorDetails 
                ? `${errorMessage}\n\n${errorDetails}`
                : errorMessage;
              alert(`Error searching for locality: ${fullMessage}`);
            }
            return;
          }

          const dbData = await response.json();
          console.log("Found locality in database:", dbData);
          setLastSearchedDistrict(dbData.district ?? null);
          setLastSearchedState(dbData.state ?? null);

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
            // Step 3: Perform multi-stage zoom with database info and show companies or gigs
            performLocalitySearchWithDBData(dbData, localityData, searchMode);
          } else if (searchMode === "person") {
            setIsMapLoading(false);
            setIsFindingJobs(true);
            performDistrictZoom(dbData, false);
            const params = new URLSearchParams();
            if (dbData.state) params.set("state", dbData.state);
            if (dbData.district) params.set("district", dbData.district);
            fetch(`/api/gigs?${params.toString()}`)
              .then((r) => r.json())
              .then((data) => {
                if (data.success && Array.isArray(data.gigs)) {
                  setGigs(data.gigs);
                  renderGigMarkers(data.gigs);
                }
              })
              .finally(() => {
                setIsFindingJobs(false);
                setIsMapLoading(false);
              });
          } else {
            console.log(`No companies found for locality: ${dbData.localityName}`);
            setIsMapLoading(false);
            setIsFindingJobs(true);  // Change to "Finding jobs..." before zoom
            // Still zoom to district level and show "No companies found" message
            performDistrictZoom(dbData, true);
          }
        } catch (error) {
          setLastSearchedDistrict(null);
          setLastSearchedState(null);
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

  // Handle connecting lines from college to companies when college distance toggle is active
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedCollege || !companyMarkersRef.current) {
      // Remove college lines if map is not ready
      if (collegeLinesRef.current.length > 0 && mapInstanceRef.current) {
        collegeLinesRef.current.forEach((line) => {
          mapInstanceRef.current.removeLayer(line);
        });
        collegeLinesRef.current = [];
      }
      return;
    }

    const L = window.L;
    if (!L) return;

    // Remove existing college lines
    collegeLinesRef.current.forEach((line) => {
      mapInstanceRef.current.removeLayer(line);
    });
    collegeLinesRef.current = [];

    // Only create lines if college distance toggle is active and college marker exists
    if (isCollegeFilterActive && collegeMarkerRef.current && companyMarkersRef.current.length > 0) {
      const collegeCoords = [selectedCollege.latitude, selectedCollege.longitude];

      // Create lines from college to each company
      companyMarkersRef.current.forEach(async (marker) => {
        if (!marker.companyData) return;

        // Handle both company.lat/lon and company.latitude/longitude formats
        const companyLat = marker.companyData.latitude || marker.companyData.lat;
        const companyLon = marker.companyData.longitude || marker.companyData.lon;

        if (!companyLat || !companyLon) return;

        const companyCoords = [companyLat, companyLon];

        // Create dashed line
        const collegeLine = L.polyline([collegeCoords, companyCoords], {
          color: "#0A0A0A",
          weight: 2,
          opacity: 0.6,
          dashArray: "5, 5",
          interactive: true,
        }).addTo(mapInstanceRef.current);

        // Add hover handler to show road distance
        collegeLine.on("mouseover", async function () {
          const roadDistanceMeters = await fetchRoadDistance(
            collegeCoords,
            companyCoords
          );

          if (roadDistanceMeters !== null) {
            const distanceKm = (roadDistanceMeters / 1000).toFixed(1);
            collegeLine.bindTooltip(
              `<div style="font-weight:bold;color:#1A1A1A;font-size:12px;">${distanceKm} km</div>`,
              {
                permanent: false,
                direction: "center",
                className: "distance-tooltip",
              }
            ).openTooltip();
          }
        });

        collegeLine.on("mouseout", function () {
          collegeLine.closeTooltip();
        });

        collegeLinesRef.current.push(collegeLine);
      });
    }
  }, [isCollegeFilterActive, selectedCollege]);

  // Home marker and dotted line to selected gig
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || searchMode !== "person") return;

    const L = window.L;
    const hasHome =
      homeLocation?.homeLatitude != null &&
      homeLocation?.homeLongitude != null &&
      Number.isFinite(Number(homeLocation.homeLatitude)) &&
      Number.isFinite(Number(homeLocation.homeLongitude));

    // Remove existing home marker
    if (homeMarkerRef.current) {
      mapInstanceRef.current.removeLayer(homeMarkerRef.current);
      homeMarkerRef.current = null;
    }
    // Remove existing home-to-gig line
    if (homeToGigLineRef.current) {
      mapInstanceRef.current.removeLayer(homeToGigLineRef.current);
      homeToGigLineRef.current = null;
    }

    if (!showDistanceFromHome || !hasHome) return;

    const homeLat = Number(homeLocation.homeLatitude);
    const homeLon = Number(homeLocation.homeLongitude);

    // Add home marker
    const homeIcon = L.divIcon({
      html: `<div style="width:36px;height:36px;border-radius:50%;background:#fff;border:2px solid #0f62fe;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.2);font-size:18px;">🏠</div>`,
      className: "home-marker",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    const marker = L.marker([homeLat, homeLon], {
      icon: homeIcon,
      zIndexOffset: 1900,
    })
      .addTo(mapInstanceRef.current)
      .bindTooltip("Home", { permanent: false, direction: "top" });
    homeMarkerRef.current = marker;

    // Add dotted line to selected gig
    const gig = selectedGigForDistance;
    if (
      gig?.latitude != null &&
      gig?.longitude != null &&
      Number.isFinite(Number(gig.latitude)) &&
      Number.isFinite(Number(gig.longitude))
    ) {
      const gigCoords = [Number(gig.latitude), Number(gig.longitude)];
      const line = L.polyline(
        [
          [homeLat, homeLon],
          gigCoords,
        ],
        {
          color: "#0A0A0A",
          weight: 2,
          opacity: 0.6,
          dashArray: "5, 5",
        }
      ).addTo(mapInstanceRef.current);
      homeToGigLineRef.current = line;
    }

    return () => {
      if (homeMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(homeMarkerRef.current);
        homeMarkerRef.current = null;
      }
      if (homeToGigLineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(homeToGigLineRef.current);
        homeToGigLineRef.current = null;
      }
    };
  }, [
    showDistanceFromHome,
    homeLocation,
    selectedGigForDistance,
    searchMode,
  ]);

  // Handle click outside filter dropdown (do not close when click is inside filter modal)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest("[data-filter-modal-root]")) return;
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

  // Close gig filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        gigFilterDropdownRef.current &&
        !gigFilterDropdownRef.current.contains(event.target) &&
        gigFilterButtonRef.current &&
        !gigFilterButtonRef.current.contains(event.target)
      ) {
        setShowGigFilterDropdown(false);
      }
    };

    if (showGigFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showGigFilterDropdown]);

  // Close search mode dropdown when clicking outside (mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchModeDropdownRef.current &&
        !searchModeDropdownRef.current.contains(event.target)
      ) {
        setShowSearchModeDropdown(false);
      }
    };

    if (showSearchModeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchModeDropdown]);

  // Close autocomplete and suggestions when clicking outside
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
      
      if (
        collegeAutocompleteRef.current &&
        !collegeAutocompleteRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowCollegeAutocomplete(false);
      }

      if (
        homeSuggestionsRef.current &&
        !homeSuggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestionsDropdown(false);
      }
    };

    if (showAutocomplete || showJobAutocomplete || showCollegeAutocomplete || showSuggestionsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAutocomplete, showJobAutocomplete, showCollegeAutocomplete, showSuggestionsDropdown]);

  // Show autocomplete when user types
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Hide empty state when user starts typing
    if (showEmptyState) {
      setShowEmptyState(false);
      setEmptyStateQuery("");
    }
    
    // Show autocomplete if query is at least 2 characters
    if (value.trim().length >= 2) {
      setShowSuggestionsDropdown(false);
      // Check query type in priority order: job > college > locality
      const isJobQuery = isJobSearchQuery(value);
      const isCollegeQuery = isCollegeSearchQuery(value);
      
      if (isJobQuery) {
        setShowJobAutocomplete(true);
        setShowAutocomplete(false);
        setShowCollegeAutocomplete(false);
      } else if (isCollegeQuery) {
        setShowCollegeAutocomplete(true);
        setShowAutocomplete(false);
        setShowJobAutocomplete(false);
      } else {
        setShowAutocomplete(true);
        setShowJobAutocomplete(false);
        setShowCollegeAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
      setShowJobAutocomplete(false);
      setShowCollegeAutocomplete(false);
      if (value.trim().length === 0) {
        setShowSuggestionsDropdown(true);
      } else {
        setShowSuggestionsDropdown(false);
      }
    }
  };

  // Handle locality selection from autocomplete
  const handleLocalitySelect = (locality) => {
    const selectedLocalityName = locality.localityName;
    console.log("📍 Locality selected:", selectedLocalityName);
    setSearchQuery(selectedLocalityName);
    setShowAutocomplete(false);
    
    // Clear college selection when locality is selected
    setSelectedCollege(null);
    setIsCollegeFilterActive(false);
    setCollegeDistances({});
    if (collegeMarkerRef.current) {
      mapInstanceRef.current?.removeLayer(collegeMarkerRef.current);
      collegeMarkerRef.current = null;
    }
    
    // Automatically trigger search with the selected locality
    // Use setTimeout to ensure state update is reflected in UI
    setTimeout(() => {
      handleSearch(selectedLocalityName);
    }, 200);
  };

  // Handle combined autocomplete select: India place (zoom) or Kerala locality (search)
  const handlePlaceOrLocalitySelect = async (item) => {
    if (item.listItemType !== "india_place") {
      handleLocalitySelect(item);
      return;
    }
    setSearchQuery(item.state ? `${item.name}, ${item.state}` : item.name);
    setShowAutocomplete(false);
    setSelectedCollege(null);
    setIsCollegeFilterActive(false);
    if (collegeMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(collegeMarkerRef.current);
      collegeMarkerRef.current = null;
    }
    const zoomLevel = item.type === "state" ? 7 : item.type === "district" ? 10 : 12;
    let lat = item.lat;
    let lon = item.lon;
    if (lat == null || lon == null) {
      const query =
        item.type === "state"
          ? `${item.name}, India`
          : item.type === "district"
            ? `${item.name}, ${item.state}, India`
            : `${item.name}, ${item.state || "India"}`;
      try {
        const res = await fetch(
          `/api/geocode/forward?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        if (data?.lat != null && data?.lon != null) {
          lat = data.lat;
          lon = data.lon;
        }
      } catch (_) {
        // Keep lat/lon null; skip zoom
      }
    }
    if (lat != null && lon != null && mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      setIsMapLoading(true);
      const center = map.getCenter();
      const currentZoom = map.getZoom();
      map.flyTo(center, Math.max(5, currentZoom - 2), { duration: 0.4 });
      map.once("moveend", () => {
        map.flyTo([lat, lon], zoomLevel, { duration: 1.2 });
        map.once("moveend", () => setIsMapLoading(false));
      });
    }
  };

  // Handle college selection from autocomplete
  const handleCollegeSelect = async (college) => {
    const selectedCollegeName = college.name;
    console.log("🏫 College selected:", {
      name: selectedCollegeName,
      fullObject: college,
      pincode: college.pincode,
      latitude: college.latitude,
      longitude: college.longitude
    });
    
    // Clean up previous college state
    if (collegeMarkerRef.current) {
      mapInstanceRef.current?.removeLayer(collegeMarkerRef.current);
      collegeMarkerRef.current = null;
    }
    
    // Remove previous college lines
    if (collegeLinesRef.current.length > 0 && mapInstanceRef.current) {
      collegeLinesRef.current.forEach((line) => {
        mapInstanceRef.current.removeLayer(line);
      });
      collegeLinesRef.current = [];
    }
    
    // Reset college filter state
    setIsCollegeFilterActive(false);
    setCollegeDistances({});
    
    setSearchQuery(selectedCollegeName);
    setShowCollegeAutocomplete(false);
    
    // Set loading state
    setIsMapLoading(true);
    setHasSearched(true);
    
    // CRITICAL: Use the college data directly from autocomplete instead of API call
    // This avoids any search mismatches since we already have the correct data
    if (college.latitude && college.longitude) {
      console.log("✅ Using college data directly from autocomplete:", {
        name: college.name,
        latitude: college.latitude,
        longitude: college.longitude,
        pincode: college.pincode
      });
      
      // Format the college data to match what performCollegeSearch expects
      const collegeData = {
        name: college.name,
        category: college.category,
        pincode: college.pincode,
        locality: college.locality || null,
        latitude: typeof college.latitude === 'number' ? college.latitude : parseFloat(college.latitude),
        longitude: typeof college.longitude === 'number' ? college.longitude : parseFloat(college.longitude),
      };
      
      setIsMapLoading(false);
      setIsFindingJobs(true);
      // Perform college search and zoom directly
      performCollegeSearch(collegeData);
    } else {
      // Fallback: If autocomplete data is incomplete, use API
      try {
        const searchUrl = `/api/search-college?college=${encodeURIComponent(selectedCollegeName)}`;
        console.log("🔍 Searching college API (fallback):", searchUrl);
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
          setIsMapLoading(false);
          setIsFindingJobs(false);
          
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || "Unknown error";
          const errorDetails = errorData.details || "";
          console.error("College search error:", errorMessage, errorDetails);
          
          // Check if it's a server error (like prisma.college undefined)
          if (response.status === 503 || (errorDetails && errorDetails.includes("restart"))) {
            alert("College search is not available yet. Please restart the development server:\n\n1. Stop the server (Ctrl+C)\n2. Run: npm run dev\n\nThis will load the College model.");
            return;
          }
          
          // Only show empty state if college truly not found (404)
          if (response.status === 404) {
            setTimeout(() => {
              setEmptyStateQuery(selectedCollegeName);
              setShowEmptyState(true);
            }, 100);
          } else {
            // For other errors, show alert
            const fullMessage = errorDetails 
              ? `${errorMessage}\n\n${errorDetails}`
              : errorMessage;
            alert(`Error searching for college: ${fullMessage}`);
          }
          return;
        }

        const collegeData = await response.json();
        console.log("✅ Found college via API:", {
          searchedFor: selectedCollegeName,
          found: collegeData.name,
          latitude: collegeData.latitude,
          longitude: collegeData.longitude,
          pincode: collegeData.pincode,
          category: collegeData.category
        });
        
        // CRITICAL: Verify the returned college matches what we searched for
        if (collegeData.name.toLowerCase() !== selectedCollegeName.toLowerCase()) {
          console.error(`❌ College mismatch! Searched for: "${selectedCollegeName}", Got: "${collegeData.name}"`);
          alert(`Error: The search returned a different college (${collegeData.name}) than what you selected (${selectedCollegeName}). Please try again.`);
          setIsMapLoading(false);
          setIsFindingJobs(false);
          return;
        }

        setIsMapLoading(false);
        setIsFindingJobs(true);
        // Perform college search and zoom
        performCollegeSearch(collegeData);
      } catch (error) {
        setIsMapLoading(false);
        setIsFindingJobs(false);
        console.error("Error searching college:", error);
        alert("An error occurred while searching. Please try again.");
      }
    }
  };

  // Handle job title selection from autocomplete
  const handleJobTitleSelect = async (jobTitle) => {
    const selectedJobTitle = `${jobTitle.title} near me`;
    console.log("💼 Job title selected:", selectedJobTitle);
    setSearchQuery(selectedJobTitle);
    setShowJobAutocomplete(false);
    
    // Clear college selection when job title is selected
    setSelectedCollege(null);
    setIsCollegeFilterActive(false);
    setCollegeDistances({});
    if (collegeMarkerRef.current) {
      mapInstanceRef.current?.removeLayer(collegeMarkerRef.current);
      collegeMarkerRef.current = null;
    }
    
    // Set loading state
    setIsMapLoading(true);
    setHasSearched(true);
    setIsDetectingLocation(true);
    
    // Step 1: Check sessionStorage first (skip permission if we have cached location)
    const cachedLocation = getLocationFromSession();
    if (cachedLocation) {
      console.log("✅ Using cached location from sessionStorage");
      setUserLocation(cachedLocation);
      storeLocationInSession(cachedLocation);
      zoomToUserLocation(cachedLocation);
      setIsMapLoading(false);
      setIsFindingJobs(false);
      setIsDetectingLocation(false);
      return;
    }

    // Step 2: Request location permission from browser
    console.log("🔍 Requesting location permission...");
    const permissionResult = await requestLocationPermission();
    
    if (!permissionResult.granted) {
      // Permission denied or failed
      setIsMapLoading(false);
      setIsFindingJobs(false);
      setIsDetectingLocation(false);
      return;
    }

    // Step 3: Permission granted, now fetch location
    console.log("✅ Permission granted, fetching location...");
    const location = await detectUserLocation(true); // Force fresh location
    
    if (location) {
      setUserLocation(location);
      storeLocationInSession(location);
      zoomToUserLocation(location);
      setIsMapLoading(false);
      setIsFindingJobs(false);
      setIsDetectingLocation(false);
    } else {
      // Location detection failed
      setIsMapLoading(false);
      setIsFindingJobs(false);
      setIsDetectingLocation(false);
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

      {/* Search Bar - visible on all viewports */}
      {isGlobeView && (
        <div
          className={`flex flex-col top-3 md:top-4 gap-4 ${searchBar.container} w-[calc(100vw-16px)] max-w-[800px]`}
        >
          {/* Search Bar Card - same corner radius as show distance button (rounded-full), white bg. */}
          <div className={`bg-brand-bg-white rounded-full border border-brand-stroke-border shadow-lg w-full px-1.5 py-1.5 md:px-4 md:py-2`}>
            {/* Mobile: single bar (Person/Job + input + Filter + Profile). Desktop: no bar, separate bordered controls. */}
            <div className={`flex items-center gap-0 w-full rounded-full border border-brand-stroke-border bg-brand-bg-white min-h-[34px] overflow-visible md:border-0 md:bg-transparent md:rounded-none md:min-h-0`}>
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

              {/* Toggle: Person (users) / Job (suitcase) - hidden on mobile when search input focused */}
              <div className={`${searchBar["toggle-wrapper"]} border-0 overflow-visible shrink-0 md:pr-1 ${mobileSearchExpanded ? "hidden md:!flex" : ""}`} ref={searchModeDropdownRef}>
                {/* Mobile: single button with chevron, dropdown with Person and Enterprise options */}
                <div className="relative md:hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSearchModeDropdown(!showSearchModeDropdown)}
                    className={`h-[34px] w-[46px] flex items-center justify-center gap-0.5 p-1 rounded-lg border-r border-brand-stroke-border hover:bg-brand-bg-fill transition-colors shrink-0 ${searchMode ? "bg-brand-bg-fill" : "bg-transparent"}`}
                    title={searchMode === "person" ? (userAccountType === "Company" ? "Candidates" : "Gig work") : "All companies"}
                    aria-expanded={showSearchModeDropdown}
                    aria-haspopup="true"
                  >
                    {searchMode === "person" ? (
                      <User size={20} className={`w-5 h-5 shrink-0 ${searchBar["toggle-segment-icon-active"]}`} />
                    ) : (
                      <Enterprise size={20} className={`w-5 h-5 shrink-0 ${searchBar["toggle-segment-icon-active"]}`} />
                    )}
                    <ChevronDown size={16} className="w-4 h-4 shrink-0 text-brand-stroke-strong" />
                  </button>
                  {showSearchModeDropdown && (
                    <div className="absolute top-full left-0 mt-1 min-w-[140px] rounded-lg border border-brand-stroke-border bg-brand-bg-white shadow-lg z-[1001] py-1 overflow-hidden">
                      {searchMode !== "person" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchMode("person");
                            setShowSearchModeDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-brand-text-strong hover:bg-brand-bg-fill transition-colors min-w-0"
                        >
                          <User size={20} className={`w-5 h-5 shrink-0 ${searchBar["toggle-segment-icon"]}`} />
                          <span className="truncate">{userAccountType === "Company" ? "Candidates" : "Gig Workers"}</span>
                        </button>
                      )}
                      {searchMode !== "company" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchMode("company");
                            setShowSearchModeDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-brand-text-strong hover:bg-brand-bg-fill transition-colors min-w-0"
                        >
                          <Enterprise size={20} className={`w-5 h-5 shrink-0 ${searchBar["toggle-segment-icon"]}`} />
                          <span className="truncate">All Companies</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {/* Desktop: toggle buttons - Show Person and Enterprise (All Companies) for all account types */}
                <div className="hidden md:flex items-center gap-1 shrink-0">
                  <div className="flex rounded-full border border-brand-stroke-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setSearchMode("person")}
                      className={`p-2 border-0 ${searchBar["toggle-segment"]} ${searchMode === "person" ? searchBar["toggle-segment-active"] : ""} !rounded-l-md !rounded-r-none`}
                      title={userAccountType === "Company" ? "Candidates" : "Gig work"}
                    >
                      <User
                        size={20}
                        className={`w-5 h-5 shrink-0 ${searchMode === "person" ? searchBar["toggle-segment-icon-active"] + " text-brand" : searchBar["toggle-segment-icon"]}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchMode("company")}
                      className={`p-2 border-0 ${searchBar["toggle-segment"]} ${searchMode === "company" ? searchBar["toggle-segment-active"] : ""} !rounded-r-md !rounded-l-none`}
                      title="All companies"
                    >
                      <Enterprise
                        size={20}
                        className={`w-5 h-5 shrink-0 ${searchMode === "company" ? searchBar["toggle-segment-icon-active"] + " text-brand" : searchBar["toggle-segment-icon"]}`}
                      />
                    </button>
                  </div>
                  {/* Filter dropdown - only show in person mode for all account types */}
                  {searchMode === "person" && (
                    <div className="relative shrink-0">
                      <button
                        ref={gigFilterButtonRef}
                        type="button"
                        onClick={() => setShowGigFilterDropdown(!showGigFilterDropdown)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-sm font-medium transition-colors shrink-0 bg-brand-bg-white border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill cursor-pointer"
                        style={{ fontFamily: "Open Sans" }}
                        aria-label="Filter by service type"
                        title="Filter gigs by service type"
                      >
                        <Filter size={16} className="shrink-0" />
                        <span className="max-w-[100px] truncate">{selectedGigType || "All Gigs"}</span>
                        <RiArrowDownSLine size={16} className="shrink-0" />
                      </button>
                      <GigFilterDropdown
                        isOpen={showGigFilterDropdown}
                        onClose={() => setShowGigFilterDropdown(false)}
                        dropdownRef={gigFilterDropdownRef}
                        position={{
                          top: "100%",
                          bottom: "auto",
                          left: "0",
                          right: "auto",
                          marginTop: "8px",
                        }}
                        width="300px"
                        selectedGigType={selectedGigType}
                        onSelect={(type) => setSelectedGigType(type)}
                      />
                    </div>
                  )}
                  {/* Show "All Companies" label when in company mode */}
                  {searchMode === "company" && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-sm font-medium shrink-0 bg-brand-bg-fill border-brand-stroke-weak text-brand-text-placeholder">
                      <Filter size={16} className="shrink-0" />
                      <span className="max-w-[100px] truncate">All Companies</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Input with Autocomplete - overflow-visible so dropdown is not clipped */}
              <div className="relative flex-1 min-w-0 overflow-visible">
                {/* Back arrow - mobile only when search expanded */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearchExpanded(false);
                    searchInputRef.current?.blur();
                  }}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 rounded border-0 bg-transparent hover:bg-brand-bg-fill transition-colors ${mobileSearchExpanded ? "md:hidden" : "hidden"}`}
                  aria-label="Back"
                >
                  <ArrowLeft size={24} className="text-brand-stroke-strong w-6 h-6 shrink-0" />
                </button>
                {/* Search Icon - Left side; hidden on mobile when expanded */}
                <IbmWatsonDiscovery
                  size={24}
                  className={`absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 z-10 text-brand-stroke-strong pointer-events-none w-6 h-6 shrink-0 ${mobileSearchExpanded ? "hidden md:block" : ""}`}
                />
                
                {/* Search Input */}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={(e) => {
                    setMobileSearchExpanded(true);
                    if (searchQuery.trim().length >= 2) {
                      if (isJobSearchQuery(searchQuery)) {
                        setShowJobAutocomplete(true);
                        setShowCollegeAutocomplete(false);
                        setShowAutocomplete(false);
                        setShowSuggestionsDropdown(false);
                      } else if (isCollegeSearchQuery(searchQuery)) {
                        setShowCollegeAutocomplete(true);
                        setShowJobAutocomplete(false);
                        setShowAutocomplete(false);
                        setShowSuggestionsDropdown(false);
                      } else {
                        setShowAutocomplete(true);
                        setShowJobAutocomplete(false);
                        setShowCollegeAutocomplete(false);
                        setShowSuggestionsDropdown(false);
                      }
                    } else if (searchQuery.trim().length === 0) {
                      setShowSuggestionsDropdown(true);
                    }
                  }}
                  onBlur={() => setMobileSearchExpanded(false)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") return;
                    if (e.key === "Enter" && searchQuery.trim()) {
                      setShowAutocomplete(false);
                      setShowJobAutocomplete(false);
                      setShowCollegeAutocomplete(false);
                      handleSearch();
                    } else if (e.key === "Escape") {
                      setShowAutocomplete(false);
                      setShowJobAutocomplete(false);
                      setShowCollegeAutocomplete(false);
                    }
                  }}
                  className={`${searchBar["search-input"]} border-0 rounded-none md:border md:rounded-full bg-transparent hover:bg-transparent ${searchBar["search-input-text"]} ${searchBar["search-input-placeholder"]} search-input-focus-active focus:ring-2 focus:ring-inset focus:ring-brand focus:outline-none w-full text-sm md:text-base font-semibold py-1.5 pl-9 pr-9 md:py-2 md:pl-11 md:pr-11`}
                  style={{
                    fontFamily: "Open Sans",
                    boxShadow: "0 1px 6px rgba(32,33,36,0.08)",
                  }}
                  placeholder="Search for locality, pincode, job"
                />
                
                {/* Right side: mobile = cross when typing; desktop = clear (when typing) + filter */}
                <div className="absolute right-1.5 md:right-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-0 md:gap-0.5">
                  {/* Mobile: cross when typing (clear) */}
                  {searchQuery?.trim() ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="md:hidden flex items-center justify-center p-1 rounded border-0 bg-transparent hover:bg-brand-stroke-weak cursor-pointer"
                      aria-label="Clear search"
                    >
                      <Close size={24} className="w-6 h-6 shrink-0 text-brand-stroke-strong" />
                    </button>
                  ) : null}
                  {/* Desktop: cross (clear) when typing - click clears all search */}
                  {searchQuery?.trim() ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="hidden md:flex items-center justify-center p-1 rounded border-0 bg-transparent hover:bg-brand-stroke-weak cursor-pointer shrink-0"
                      aria-label="Clear search"
                    >
                      <Close size={24} className="w-6 h-6 shrink-0 text-brand-stroke-strong" />
                    </button>
                  ) : null}
                  {/* State filter badge: show when a state is selected; click X to clear filter */}
                  {selectedFilterOption?.state ? (
                    <span className="hidden md:flex items-center gap-0.5 shrink-0 max-w-[140px] rounded-full bg-brand/10 border border-brand-stroke-weak px-2 py-1">
                      <span className="truncate text-xs font-medium text-brand-text-strong" title={selectedFilterOption.state}>
                        {selectedFilterOption.state}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedFilterOption(null)}
                        className="shrink-0 p-0.5 rounded-full hover:bg-brand-stroke-weak transition-colors"
                        aria-label="Clear state filter"
                      >
                        <Close size={14} className="w-3.5 h-3.5 text-brand-stroke-strong" />
                      </button>
                    </span>
                  ) : null}
                  {/* Desktop: location filter button inside search bar - no bg on hover, icon turns primary on hover */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="group hidden md:flex items-center justify-center p-1.5 rounded border-0 bg-transparent hover:bg-transparent transition-colors shrink-0"
                    aria-label="Location filter"
                  >
                    <Location size={24} className="text-brand-stroke-strong group-hover:text-brand w-6 h-6 shrink-0 transition-colors" />
                  </button>
                </div>
                
                {/* Home / Add home suggestions - when search empty and focused */}
                {showSuggestionsDropdown && (
                  <div
                    ref={homeSuggestionsRef}
                    className="absolute left-0 right-0 top-full mt-2 z-[1001] rounded-lg border border-brand-stroke-border bg-brand-bg-white shadow-lg overflow-hidden"
                    style={{ fontFamily: "Open Sans" }}
                  >
                    {homeLocation ? (
                      <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-brand-bg-fill transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="shrink-0 w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center">
                            <Home size={20} className="text-brand" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-brand-text-strong">Home</div>
                            <div className="text-sm text-brand-text-weak truncate">
                              {[homeLocation.homeDistrict, homeLocation.homeState].filter(Boolean).join(", ") || "Location set"}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddHomeModal(true);
                            setShowSuggestionsDropdown(false);
                          }}
                          className="shrink-0 text-sm font-medium text-brand hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddHomeModal(true);
                          setShowSuggestionsDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-bg-fill transition-colors text-left"
                      >
                        <div className="shrink-0 w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center">
                          <Add size={20} className="text-brand" />
                        </div>
                        <span className="font-medium text-brand-text-strong">Add home</span>
                      </button>
                    )}
                    <div className="px-4 py-2 text-xs text-brand-text-weak border-t border-brand-stroke-weak">
                      Keep typing to search for locality, job, or college
                    </div>
                  </div>
                )}

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
                  indiaSuggestions={indiaSuggestions}
                  indiaSuggestionsLoading={indiaSuggestionsLoading}
                  searchQuery={searchQuery}
                  onSelect={handlePlaceOrLocalitySelect}
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
                
                {/* College Autocomplete Dropdown */}
                <CollegeAutocomplete
                  isOpen={showCollegeAutocomplete}
                  onClose={() => setShowCollegeAutocomplete(false)}
                  dropdownRef={collegeAutocompleteRef}
                  position={{
                    top: "100%",
                    left: "0",
                    right: "auto",
                    marginTop: "8px",
                  }}
                  width="100%"
                  colleges={colleges}
                  searchQuery={searchQuery}
                  onSelect={handleCollegeSelect}
                />
              </div>

              {/* Filter + Profile grouped. Mobile: filter button here. Desktop: filter is inside search input, this wrapper only holds dropdown (no width). */}
              <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                {/* Mobile: state filter badge when selected */}
                {selectedFilterOption?.state ? (
                  <span className={`md:hidden flex items-center gap-0.5 shrink-0 max-w-[100px] rounded-full bg-brand/10 border border-brand-stroke-weak px-2 py-1 ${mobileSearchExpanded || showFilterDropdown ? "hidden" : ""}`}>
                    <span className="truncate text-xs font-medium text-brand-text-strong" title={selectedFilterOption.state}>
                      {selectedFilterOption.state}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFilterOption(null)}
                      className="shrink-0 p-0.5 rounded-full hover:bg-brand-stroke-weak transition-colors"
                      aria-label="Clear state filter"
                    >
                      <Close size={14} className="w-3.5 h-3.5 text-brand-stroke-strong" />
                    </button>
                  </span>
                ) : null}
                {/* Filter Button (mobile only); on desktop filter is inside input. Wrapper md:w-0 so dropdown can still open. */}
                <div className={`relative shrink-0 ${!mobileSearchExpanded && !showFilterDropdown ? "hidden" : ""} md:!flex md:w-0 md:min-w-0 md:overflow-visible`}>
                  <button
                    ref={filterButtonRef}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="group h-[34px] w-[34px] md:hidden flex items-center justify-center p-1.5 rounded-lg border-0 bg-transparent hover:bg-transparent transition-colors shrink-0"
                    aria-label="Location filter"
                  >
                    <Location size={24} className="text-brand-stroke-strong group-hover:text-brand w-6 h-6 shrink-0 transition-colors" />
                  </button>

                  {/* Desktop: dropdown */}
                  <div className="hidden md:block">
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
                </div>

                {/* Profile icon - mobile only: direct logout; hide when search focused or filter modal open */}
                <div className={`md:hidden shrink-0 ${mobileSearchExpanded || showFilterDropdown ? "hidden" : ""}`}>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (signOut) await signOut();
                        await fetch("/api/auth/logout", { method: "POST" });
                        router.push("/");
                        window.location.reload();
                      } catch (e) {
                        console.error("Logout error:", e);
                        await fetch("/api/auth/logout", { method: "POST" });
                        router.push("/");
                        window.location.reload();
                      }
                    }}
                    className="h-[34px] w-[34px] flex items-center justify-center rounded-lg border-0 bg-transparent hover:bg-brand-bg-fill transition-colors shrink-0"
                    aria-label="Log out"
                  >
                    <UserAvatar size={24} className="text-brand-stroke-strong w-6 h-6 shrink-0" />
                  </button>
                </div>


                {/* View toggle: Globe (map) | Chat (onboarding) - inside search bar, right end, desktop only; rounded-full pill shape */}
                <div className="hidden md:flex items-center shrink-0 ml-1">
                  <div className="flex bg-white border border-brand-stroke-border overflow-hidden rounded-full shrink-0">
                    <button
                      type="button"
                      aria-label="Map view"
                      className={`flex items-center gap-1.5 px-3 py-2 border-0 ${searchBar["toggle-segment"]} ${searchBar["toggle-segment-active"]} !rounded-l-full !rounded-r-none`}
                    >
                      <EarthFilled size={20} className={`w-5 h-5 shrink-0 ${searchBar["toggle-segment-icon-active"]} text-brand`} />
                      <span className={`text-sm font-medium ${searchBar["toggle-segment-icon-active"]}`}>Map</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsSwitchingToChat(true);
                        try {
                          // Fetch user account type
                          const res = await fetch("/api/auth/me", { credentials: "same-origin" });
                          const data = await res.json();
                          const accountType = data?.user?.accountType;
                          
                          // Small delay for UX
                          await new Promise(resolve => setTimeout(resolve, 500));
                          
                          if (accountType === "Company") {
                            router.push("/onboarding.org");
                          } else {
                            router.push("/onboarding");
                          }
                        } catch (error) {
                          console.error("Error switching to chat:", error);
                          router.push("/onboarding");
                        }
                      }}
                      aria-label="Chat / onboarding"
                      className={`flex items-center gap-1.5 px-3 py-2 border-0 ${searchBar["toggle-segment"]} !rounded-r-full !rounded-l-none`}
                    >
                      <Chat size={20} className={`w-5 h-5 shrink-0 ${searchBar["toggle-segment-icon"]}`} />
                      <span className={`text-sm font-medium ${searchBar["toggle-segment-icon"]}`}>Chat</span>
                      <ArrowRight size={16} className={`w-4 h-4 shrink-0 ${searchBar["toggle-segment-icon"]}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile: bottom sheet */}
              <FilterBottomSheet
                isOpen={showFilterDropdown}
                onClose={() => setShowFilterDropdown(false)}
                selectedOption={selectedFilterOption}
                onSelect={(option) => setSelectedFilterOption(option)}
                localities={localities}
                jobTitles={jobTitles}
                colleges={colleges}
                companies={flattenedCompanies}
              />

              {/* Return Button - Hidden for now, will add in later stages */}
              {/* <button
                onClick={handleReturn}
                className={searchBar["return-button"]}
              >
                <Return size={20} className={searchBar["return-button-icon"]} />
              </button> */}
            </div>
          </div>

          {/* Home badge - below search bar, when user has home and in person mode */}
          {homeLocation && searchMode === "person" && (
            <div className="relative self-start">
              <button
                type="button"
                onClick={() => setShowDistanceFromHome((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-brand-stroke-border bg-brand-bg-white hover:bg-brand-bg-fill transition-colors shrink-0 shadow-lg"
                title={showDistanceFromHome ? "Hide distance" : "Show distance from home"}
              >
                <span className="text-base">🏠</span>
                {showDistanceFromHome &&
                selectedGigForDistance?.latitude != null &&
                selectedGigForDistance?.longitude != null ? (
                  <span className="text-xs font-medium text-brand-text-strong">
                    {haversineKm(
                      homeLocation.homeLatitude,
                      homeLocation.homeLongitude,
                      selectedGigForDistance.latitude,
                      selectedGigForDistance.longitude
                    ).toFixed(1)}{" "}
                    km
                  </span>
                ) : (
                  <span className="text-xs font-medium text-brand-text-weak">Home</span>
                )}
              </button>
            </div>
          )}

          {/* Distance chip - below search bar, mobile only; only when a college is selected */}
          <div className="relative self-start md:hidden">
            {selectedCollege && (
              <button
                type="button"
                onClick={() => setIsCollegeFilterActive(!isCollegeFilterActive)}
                className={`inline-flex items-center gap-1.5 py-2 px-3 rounded-full text-sm font-medium transition-colors border border-brand-stroke-border bg-brand-bg-white hover:bg-brand-bg-fill text-brand-text-weak shadow-lg ${isCollegeFilterActive ? "bg-brand-bg-fill" : ""}`}
                style={{ fontFamily: "Open Sans" }}
              >
                <span className="text-sm">🏫</span>
                <span>{isCollegeFilterActive ? "Hide distance" : "Show distance"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State Overlay */}
      <EmptyState
        isOpen={showEmptyState}
        onClose={() => {
          setShowEmptyState(false);
          setEmptyStateQuery("");
        }}
        query={emptyStateQuery}
      />

      {/* Loading Overlay */}
      {(isMapLoading || isFindingJobs || isDetectingLocation) && (
        <div
          className={`absolute inset-0 z-[999] flex items-center justify-center pointer-events-auto ${isFindingJobs ? "bg-white/85 backdrop-blur-[2px]" : "bg-white/50"}`}
        >
          <div className="text-center">
            {/* Spinner */}
            <div className="w-12 h-12 border-4 border-brand-stroke-weak border-t-brand rounded-full loading-spinner mx-auto mb-4" />
            {/* Loading Text */}
            <p className="text-base font-medium font-sans text-brand-text-strong">
              {isDetectingLocation 
                ? 'Detecting your location...' 
                : isFindingJobs 
                  ? 'Finding jobs...' 
                  : 'Loading map...'}
            </p>
          </div>
        </div>
      )}

      {/* Statistics Badges - hidden on mobile, bottom-left on desktop */}
      <div className="hidden md:flex absolute md:top-auto md:bottom-4 md:left-4 flex-col gap-1.5 md:gap-2 z-[1000] pointer-events-none">
        {/* Statistics Badges - Show different content based on account type and search mode */}
        {userAccountType === "Company" ? (
          /* Company Account: Total Candidates in person mode, Total Companies in company mode */
          searchMode === "person" ? (
            <div className="bg-white border border-brand-stroke-border rounded-lg shadow-lg px-2 py-1.5 md:px-3 md:py-2 flex items-center gap-1.5 md:gap-2 pointer-events-auto font-sans">
              <User size={14} className="shrink-0 text-brand" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] md:text-xs text-brand-text-weak font-normal">
                  Total Candidates
                </span>
                <span className="text-sm md:text-base text-brand-text-strong font-semibold">
                  {(gigs?.length || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-brand-stroke-border rounded-lg shadow-lg px-2 py-1.5 md:px-3 md:py-2 flex items-center gap-1.5 md:gap-2 pointer-events-auto font-sans">
              <Enterprise size={14} className="shrink-0 text-brand" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] md:text-xs text-brand-text-weak font-normal">
                  Total Companies
                </span>
                <span className="text-sm md:text-base text-brand-text-strong font-semibold">
                  {totalCompaniesCount.toLocaleString()}
                </span>
              </div>
            </div>
          )
        ) : (
          /* Individual/Gig Worker Account: Show Total Gigs in person mode, Total Companies in company mode */
          <>
            {searchMode === "person" ? (
              <div className="bg-white border border-brand-stroke-border rounded-lg shadow-lg px-2 py-1.5 md:px-3 md:py-2 flex items-center gap-1.5 md:gap-2 pointer-events-auto font-sans">
                <User size={14} className="shrink-0 text-brand" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] md:text-xs text-brand-text-weak font-normal">
                    Total Gigs
                  </span>
                  <span className="text-sm md:text-base text-brand-text-strong font-semibold">
                    {(gigs?.length || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-brand-stroke-border rounded-lg shadow-lg px-2 py-1.5 md:px-3 md:py-2 flex items-center gap-1.5 md:gap-2 pointer-events-auto font-sans">
                <Enterprise size={14} className="shrink-0 text-brand" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] md:text-xs text-brand-text-weak font-normal">
                    Total Companies
                  </span>
                  <span className="text-sm md:text-base text-brand-text-strong font-semibold">
                    {totalCompaniesCount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AddHomeModal
        isOpen={showAddHomeModal}
        onClose={() => setShowAddHomeModal(false)}
        onSaved={(user) => {
          if (user?.homeLatitude != null && user?.homeLongitude != null) {
            setHomeLocation({
              homeLatitude: user.homeLatitude,
              homeLongitude: user.homeLongitude,
              homeLocality: user.homeLocality,
              homeDistrict: user.homeDistrict,
              homeState: user.homeState,
            });
          }
        }}
        initialHome={homeLocation}
      />

      <GetCoordinatesModal
        isOpen={showLocateMeCoordModal}
        onClose={() => setShowLocateMeCoordModal(false)}
        onLocation={(coords) => {
          if (coords?.lat != null && coords?.lng != null) {
            zoomToUserLocation({ lat: coords.lat, lng: coords.lng });
          }
          setShowLocateMeCoordModal(false);
        }}
      />

      <CompanyJobsSidebar
        company={selectedCompanyForSidebar}
        jobs={selectedCompanyJobs}
        isOpen={showCompanyJobsSidebar}
        onClose={() => setShowCompanyJobsSidebar(false)}
      />

      {/* Loading overlay when switching to chat */}
      {isSwitchingToChat && <LoadingSpinner size="lg" overlay={true} />}
    </div>
  );
};

// Export with dynamic import to disable SSR
export default dynamic(() => Promise.resolve(MapComponent), {
  ssr: false,
});
