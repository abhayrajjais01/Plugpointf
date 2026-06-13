import { useState, useMemo, useEffect } from "react";
import { Search, ChevronLeft, Check, Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { evBrands, evModels, UserVehicle } from "../data/ev-data";
import { toast } from "sonner";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ImageWithFallback } from "./figma/ImageWithFallback";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface EvSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EvSetupModal({ isOpen, onClose }: EvSetupModalProps) {
  const { myVehicles, setMyVehicles, addVehicle, removeVehicle, activeVehicle, setActiveVehicle } = useApp();
  
  // default to 'add' view if user has no vehicles
  const [view, setView] = useState<"selector" | "add">("selector");
  
  // States for 'add' view
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState("");

  // States for 'selector' view
  const [tempActiveVehicleId, setTempActiveVehicleId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (myVehicles.length === 0) {
        setView("add");
      } else {
        setView("selector");
        // Only reset temp active vehicle if it is not already set
        setTempActiveVehicleId((prev) => prev || activeVehicle?.id || null);
      }
    }
  }, [isOpen, activeVehicle]); // Removed myVehicles to prevent overriding temp state when a vehicle is added

  const filteredModels = useMemo(() => {
    return evModels.filter((model) => {
      const matchBrand =
        selectedBrand === "All" ||
        evBrands.find((b) => b.id === model.brandId)?.name === selectedBrand;
      const matchSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [selectedBrand, searchQuery]);

  if (!isOpen) return null;

  const handleAddVehicle = async () => {
    if (!selectedModel) return;
    const modelData = evModels.find((m) => m.id === selectedModel);
    if (!modelData) return;
    const brandData = evBrands.find((b) => b.id === modelData.brandId);

    const newVehicle: UserVehicle = {
      id: "v_" + Date.now(),
      modelId: modelData.id,
      brandName: brandData?.name || "Unknown",
      modelName: modelData.name,
      image: modelData.image,
      logoUrl: brandData?.logoUrl || "",
      registrationNumber: registrationNumber || undefined,
    };

    const success = await addVehicle(newVehicle);
    if (success) {
      if (myVehicles.length === 0) {
        setActiveVehicle(newVehicle);
      }
      toast.success(`${newVehicle.modelName} added!`);
      setView("selector");
      setTempActiveVehicleId(newVehicle.id);
      setShowRegistrationPrompt(false);
      setRegistrationNumber("");
    } else {
      toast.error("Failed to save vehicle to your profile.");
    }
  };

  const handleApplySelector = () => {
    if (tempActiveVehicleId) {
      const v = myVehicles.find((v) => v.id === tempActiveVehicleId);
      if (v) setActiveVehicle(v);
    }
    onClose();
  };

  // -------------------------------------------------------------
  // VIEW: SELECTOR (Screenshot 3)
  // -------------------------------------------------------------
  if (view === "selector") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-t-3xl w-full max-w-md mx-auto shadow-2xl animate-in slide-in-from-bottom-full duration-300">
          
          <div className="flex justify-center pt-3 pb-1 w-full absolute top-0">
            <div className="w-12 h-1 bg-slate-200 rounded-full"></div>
          </div>
          
          <div className="p-6 pt-8 pb-24">
            <h3 className="font-extrabold text-slate-800 text-[1.1rem] mb-6">My Vehicles</h3>

            {myVehicles.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                No vehicles added yet.
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {myVehicles.map((vehicle) => {
                  const isSelected = vehicle.id === tempActiveVehicleId;
                  return (
                    <div
                      key={vehicle.id}
                      onClick={() => setTempActiveVehicleId(vehicle.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer min-w-[140px] snap-center shrink-0",
                        isSelected
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-slate-100/50 bg-white shadow-sm hover:border-slate-200"
                      )}
                    >
                      <div className="w-24 h-16 mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
                        <ImageWithFallback src={vehicle.image} alt={vehicle.modelName} className="object-contain w-full h-full p-1" />
                      </div>
                      <div className="text-center w-full">
                        <p className={cn("text-[0.8rem] font-bold leading-tight", isSelected ? "text-emerald-900" : "text-slate-800")}>{vehicle.brandName}</p>
                        <p className={cn("text-[0.7rem] font-bold", isSelected ? "text-emerald-700" : "text-slate-600 truncate px-1")}>{vehicle.modelName.replace(vehicle.brandName, "").trim()}</p>
                        <p className="text-[0.6rem] text-slate-400 mt-1 uppercase tracking-wider">{vehicle.registrationNumber || "UP52BK3914"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setView("add")}
                className="flex-1 bg-white border border-slate-200 text-primary font-bold py-3.5 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
              >
                Add New
              </button>
              <button
                onClick={handleApplySelector}
                disabled={myVehicles.length > 0 && !tempActiveVehicleId}
                className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: ADD VEHICLE (Screenshot 1)
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 relative">
        <button
          onClick={() => {
            if (myVehicles.length > 0) setView("selector");
            else onClose();
          }}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-[1.05rem] font-bold text-slate-800 absolute w-full text-center left-0">Add Vehicle</h2>
        <div className="w-8"></div> {/* Spacer for symmetry */}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* EXISTING VEHICLES PREVIEW (If any) */}
        {myVehicles.length > 0 && (
          <div className="pt-6 px-4">
            <h3 className="text-slate-800 font-extrabold text-[1.1rem] mb-4">My Vehicles</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
              {myVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-emerald-400 bg-emerald-50 cursor-pointer min-w-[140px] snap-center shrink-0"
                >
                  <div className="w-24 h-16 mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
                    <ImageWithFallback src={vehicle.image} alt={vehicle.modelName} className="object-contain w-full h-full p-1" />
                  </div>
                  <div className="text-center w-full">
                    <p className="text-[0.8rem] font-bold leading-tight text-emerald-900">{vehicle.brandName} {vehicle.modelName.replace(vehicle.brandName, "").trim()}</p>
                    <p className="text-[0.6rem] text-emerald-600 mt-1 uppercase tracking-wider">{vehicle.registrationNumber || "UP52BK3914"}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="h-px bg-slate-100 w-full my-2"></div>
          </div>
        )}

        {/* BRANDS TABS */}
        <div className="px-1 pt-4 sticky top-0 bg-white z-10">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar px-3 pb-2">
            {["All", ...evBrands.map(b => b.name)].map((brandName) => (
              <button
                key={brandName}
                onClick={() => setSelectedBrand(brandName)}
                className={cn(
                  "px-5 py-2 whitespace-nowrap border-b-2 font-semibold text-sm transition-colors",
                  selectedBrand === brandName 
                    ? "border-primary text-slate-900" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                {brandName}
              </button>
            ))}
          </div>

          {/* SEARCH BAR */}
          <div className="px-4 py-3 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search for vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* MODELS GRID */}
        <div className="px-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            {filteredModels.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-sm",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-md"
                      : "border-slate-100 hover:border-slate-300"
                  )}
                >
                  <div className="w-full h-20 mb-3 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
                     <ImageWithFallback src={model.image} alt={model.name} className="object-contain w-full h-full p-2" />
                  </div>
                  <p className={cn("text-center text-[0.85rem] font-bold leading-tight", isSelected ? "text-primary" : "text-slate-800")}>
                    {model.name}
                  </p>
                </div>
              );
            })}
          </div>
          {filteredModels.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm font-medium">
              No vehicles found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* REGISTRATION NUMBER PROMPT */}
      {showRegistrationPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRegistrationPrompt(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <h3 className="font-extrabold text-slate-800 text-lg mb-2">Registration Number</h3>
            <p className="text-[0.8rem] text-slate-500 mb-4">Enter your car's registration (e.g., UP52BK3914)</p>
            <input
              type="text"
              placeholder="e.g. MH01AB1234"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center font-bold text-slate-800 uppercase focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRegistrationPrompt(false)}
                className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleAddVehicle}
                disabled={!registrationNumber.trim()}
                className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIXED BOTTOM BUTTON */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-slate-100">
        <button
          onClick={() => setShowRegistrationPrompt(true)}
          disabled={!selectedModel}
          className="w-full bg-primary text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-40"
        >
          Proceed
        </button>
      </div>
      
      {/* Quick custom style for hiding scrollbars without breaking tailwind */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
