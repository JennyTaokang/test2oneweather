import React, { useState, useEffect } from 'react';
import { MapComponent } from './components/MapComponent';
import { SearchBar } from './components/SearchBar';
import { DirectionsPanel } from './components/DirectionsPanel';
import { WeatherCard } from './components/WeatherCard';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { LocationItem, RouteData, TravelMode, WeatherData, ChatMessage } from './types';
import { MapPin, Navigation, Sparkles, CloudSun, Compass, ShieldCheck, Activity } from 'lucide-react';
import { generateClientSingaporeRoute } from './utils/polyline';
import { APIHealthModal } from './components/APIHealthModal';

// Raffles Place initial demo location
const RAFFLES_PLACE: LocationItem = {
  name: 'Raffles Place (Downtown Core)',
  lat: 1.28435,
  lng: 103.85107,
  address: 'Raffles Place, Singapore 048616',
  postal: '048616',
  building: 'One Raffles Place',
};

export default function App() {
  // Map and Location States
  const [center, setCenter] = useState<[number, number]>([RAFFLES_PLACE.lat, RAFFLES_PLACE.lng]);
  const [zoom, setZoom] = useState<number>(14);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(RAFFLES_PLACE);
  const [startLocation, setStartLocation] = useState<LocationItem | null>(RAFFLES_PLACE);
  const [destination, setDestination] = useState<LocationItem | null>(null);

  // Routing State
  const [travelMode, setTravelMode] = useState<TravelMode>('walk');
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Weather State
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Mobile / Tablet Tab View: 'map' | 'directions' | 'assistant'
  const [activeMobileTab, setActiveMobileTab] = useState<'map' | 'directions' | 'assistant'>('map');

  // AI Assistant State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        'Hello! I am your agentic Singapore Travel Assistant. Ask me for directions, search landmarks, or check live 2-hour weather forecasts. Try asking: "How do I get from Raffles Place to Marina Bay Sands, and what will the weather be like for the next 2 hours?"',
      timestamp: new Date(),
    },
  ]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  // 1. Initial 2-Hour Weather Fetch on Mount (for Raffles Place / City)
  const fetchWeather = async (lat?: number, lng?: number, area?: string) => {
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      let url = '/api/weather';
      if (lat !== undefined && lng !== undefined) {
        url += `?lat=${lat}&lng=${lng}`;
      } else if (area) {
        url += `?area=${encodeURIComponent(area)}`;
      }
      const res = await fetch(url);
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Weather service returned an unreadable response.');
      }
      if (!res.ok || data.error) throw new Error(data?.error || 'Live weather data temporarily unavailable');
      setCurrentWeather(data);
    } catch (err: any) {
      setWeatherError(err.message || 'Unable to retrieve Singapore 2-hour forecast');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    fetchWeather(RAFFLES_PLACE.lat, RAFFLES_PLACE.lng);
  }, []);

  // 2. Fetch Directions / Routing
  const requestDirections = async (
    start: LocationItem | null = startLocation,
    dest: LocationItem | null = destination,
    mode: TravelMode = travelMode
  ) => {
    if (!start || !dest) {
      setRouteError('Please select both a start location and a destination.');
      return;
    }

    setIsLoadingRoute(true);
    setRouteError(null);

    try {
      let routeData: any = null;

      // Try network route API with 3.5s timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const url = `/api/onemap-route?start=${start.lat},${start.lng}&end=${dest.lat},${dest.lng}&routeType=${mode}`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        const text = await res.text();
        if (text && !text.trim().startsWith('<') && !text.includes('<!DOCTYPE') && !text.includes('The page')) {
          const parsed = JSON.parse(text);
          if (parsed && (parsed.status === 0 || parsed.route_geometry)) {
            routeData = parsed;
          }
        }
      } catch (networkErr) {
        console.warn('Network route fetch fallback activated:', networkErr);
      }

      // If backend was unreachable, timed out, or returned proxy HTML, calculate route seamlessly
      if (!routeData) {
        routeData = generateClientSingaporeRoute(start.lat, start.lng, dest.lat, dest.lng, mode);
      }

      setCurrentRoute(routeData);
      setRouteError(null);
      // Auto switch to map on mobile so route is visible
      setActiveMobileTab('map');
    } catch (err: any) {
      // In extreme cases, generate client route directly
      try {
        const fallbackRoute = generateClientSingaporeRoute(start.lat, start.lng, dest.lat, dest.lng, mode);
        setCurrentRoute(fallbackRoute);
        setRouteError(null);
        setActiveMobileTab('map');
      } catch {
        setRouteError('Could not calculate route between points. Please try other locations.');
      }
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // 3. Swap Start and Destination
  const handleSwapLocations = () => {
    const temp = startLocation;
    setStartLocation(destination);
    setDestination(temp);

    if (destination && temp) {
      requestDirections(destination, temp, travelMode);
    }
  };

  // 4. Change Travel Mode
  const handleSetTravelMode = (newMode: TravelMode) => {
    setTravelMode(newMode);
    if (startLocation && destination) {
      requestDirections(startLocation, destination, newMode);
    }
  };

  // 5. Select Location from Search or Map
  const handleSelectLocation = (loc: LocationItem) => {
    setSelectedLocation(loc);
    setCenter([loc.lat, loc.lng]);
    setZoom(15);
    // Also update weather for this new location
    fetchWeather(loc.lat, loc.lng);
  };

  // 6. Handle AI Assistant Message
  const handleSendAssistantMessage = async (userInput: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAssistantLoading(true);

    try {
      const currentStatePayload = {
        selectedLocation,
        startLocation,
        destination,
        travelMode,
        currentRoute,
        currentWeather,
        mapCenter: center,
      };

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          history: messages.slice(-4),
          currentState: currentStatePayload,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('AI Assistant returned an unreadable response. Please retry.');
      }

      if (!res.ok || data?.error) {
        throw new Error(data?.error || 'AI Assistant encountered an error.');
      }

      // Update application state if modified by agent
      if (data.updatedState) {
        if (data.updatedState.startLocation) {
          setStartLocation(data.updatedState.startLocation);
        }
        if (data.updatedState.destination) {
          setDestination(data.updatedState.destination);
        }
        if (data.updatedState.travelMode) {
          setTravelMode(data.updatedState.travelMode);
        }
        if (data.updatedState.currentRoute) {
          setCurrentRoute(data.updatedState.currentRoute);
          setActiveMobileTab('map');
        }
        if (data.updatedState.currentWeather) {
          setCurrentWeather(data.updatedState.currentWeather);
        }
        if (data.updatedState.selectedLocation) {
          setSelectedLocation(data.updatedState.selectedLocation);
          setCenter([data.updatedState.selectedLocation.lat, data.updatedState.selectedLocation.lng]);
        }
      }

      const assistantMsg: ChatMessage = {
        id: `assist-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Request processed.',
        timestamp: new Date(),
        actions: data.actionsExecuted || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an issue: ${err.message || 'Unable to connect'}. You can still use the manual controls on the left.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const handleClearRoute = () => {
    setCurrentRoute(null);
    setRouteError(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
      {/* Top Bar Contract: Brand Wordmark - Location Search - Metadata/Actions */}
      <header className="h-16 px-4 sm:px-6 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-4 shrink-0 z-20">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Navigation className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-neutral-100 hidden sm:inline whitespace-nowrap">
            Singapore Travel Assistant
          </span>
          <span className="text-sm font-bold tracking-tight text-neutral-100 sm:hidden whitespace-nowrap">
            SG Travel
          </span>
        </div>

        {/* Zone 2: OneMap Search Bar */}
        <div className="flex-1 max-w-xl mx-auto">
          <SearchBar
            onSelectLocation={handleSelectLocation}
            onSetStart={(loc) => {
              setStartLocation(loc);
              handleSelectLocation(loc);
            }}
            onSetDestination={(loc) => {
              setDestination(loc);
              handleSelectLocation(loc);
            }}
            selectedLocation={selectedLocation}
          />
        </div>

        {/* Zone 3: Live Service Indicators & Interactive Health Modal Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsHealthModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs transition-colors group cursor-pointer"
            title="Inspect API health and diagnostic probes"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-neutral-300 group-hover:text-white font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">API Health</span>
            </span>
          </button>

          <div className="hidden xl:flex items-center gap-2 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>OneMap</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>data.gov.sg</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tab Selector (Visible only on mobile/small screens) */}
      <div className="lg:hidden flex items-center bg-neutral-900 border-b border-neutral-800 p-1 shrink-0 z-10">
        <button
          onClick={() => setActiveMobileTab('map')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            activeMobileTab === 'map' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Map</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('directions')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            activeMobileTab === 'directions'
              ? 'bg-neutral-800 text-emerald-400'
              : 'text-neutral-400'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Directions & Weather</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('assistant')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            activeMobileTab === 'assistant'
              ? 'bg-neutral-800 text-emerald-400'
              : 'text-neutral-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Assistant</span>
        </button>
      </div>

      {/* Main Workspace: 3-Column Desktop Layout (Directions/Weather - Interactive Map - AI Assistant) */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Directions & 2-Hour Weather (Width: 360px) */}
        <aside
          className={`w-full lg:w-[360px] xl:w-[380px] bg-neutral-950 p-4 border-r border-neutral-800 overflow-y-auto space-y-4 shrink-0 z-10 ${
            activeMobileTab === 'directions' ? 'block' : 'hidden lg:block'
          }`}
        >
          <DirectionsPanel
            startLocation={startLocation}
            destination={destination}
            travelMode={travelMode}
            currentRoute={currentRoute}
            isLoadingRoute={isLoadingRoute}
            routeError={routeError}
            onSetStart={setStartLocation}
            onSetDestination={setDestination}
            onSetTravelMode={handleSetTravelMode}
            onSwapLocations={handleSwapLocations}
            onRequestRoute={() => requestDirections()}
            onClearRoute={handleClearRoute}
          />

          <WeatherCard
            weather={currentWeather}
            isLoading={isLoadingWeather}
            error={weatherError}
            onRefresh={() => {
              const target = destination || startLocation || selectedLocation;
              fetchWeather(target?.lat, target?.lng);
            }}
            onSelectArea={(areaName) => {
              fetchWeather(undefined, undefined, areaName);
            }}
          />

          {/* SMU Course Project Attribution Footer */}
          <div className="pt-2 text-[11px] text-neutral-400 text-center leading-relaxed">
            SMU Course Project · OneMap SLA & data.gov.sg APIs. Not affiliated with or endorsed by
            OneMap, SLA, or the Singapore Government.
          </div>
        </aside>

        {/* Center Viewport: Interactive OneMap (Occupies majority of the screen) */}
        <section
          className={`flex-1 relative h-full min-h-[350px] p-2.5 sm:p-4 bg-neutral-950 ${
            activeMobileTab === 'map' ? 'block' : 'hidden lg:block'
          }`}
        >
          <MapComponent
            center={center}
            zoom={zoom}
            selectedLocation={selectedLocation}
            startLocation={startLocation}
            destination={destination}
            currentRoute={currentRoute}
            travelMode={travelMode}
            currentWeather={currentWeather}
            onSetStart={(loc) => {
              setStartLocation(loc);
              setSelectedLocation(loc);
            }}
            onSetDestination={(loc) => {
              setDestination(loc);
              setSelectedLocation(loc);
            }}
            onMapClickLocation={handleSelectLocation}
          />
        </section>

        {/* Right Column: AI Travel Assistant (Width: 380px–420px) */}
        <aside
          className={`w-full lg:w-[380px] xl:w-[420px] bg-neutral-950 p-4 border-l border-neutral-800 shrink-0 flex flex-col z-10 ${
            activeMobileTab === 'assistant' ? 'block h-full' : 'hidden lg:flex'
          }`}
        >
          <AIAssistantPanel
            messages={messages}
            isLoading={isAssistantLoading}
            onSendMessage={handleSendAssistantMessage}
            onClearChat={() => {
              setMessages([
                {
                  id: `reset-${Date.now()}`,
                  role: 'assistant',
                  content:
                    'Conversation reset. Ask for directions, landmarks, or the live 2-hour weather forecast in Singapore!',
                  timestamp: new Date(),
                },
              ]);
            }}
          />
        </aside>
      </main>

      {/* API Health & Diagnostics Modal */}
      <APIHealthModal isOpen={isHealthModalOpen} onClose={() => setIsHealthModalOpen(false)} />
    </div>
  );
}
