import { useState } from "react";
import { useNavigate } from "react-router";
import { 
  Zap, 
  Trash2, 
  ChevronLeft, 
  MapPin, 
  Star, 
  Plus,
  Loader2,
  Power,
  Info,
  AlertCircle
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

/**
 * --- MANAGE CHARGERS PAGE ---
 * This page allows hosts to see their own charging stations,
 * toggle if they are currently "Open" or "Busy", and remove them.
 */
export function ManageChargersPage() {
  const navigate = useNavigate();
  const { user, chargers, updateCharger, deleteCharger } = useApp();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Filter the global chargers list to only show ones owned by the current user
  const myChargers = chargers.filter((c) => c.ownerId === user?.id);

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    setLoadingId(id);
    const success = await updateCharger(id, { available: !currentStatus });
    setLoadingId(null);
    if (success) {
      toast.success(currentStatus ? "Station marked as Busy" : "Station marked as Available");
    } else {
      toast.error("Failed to update status. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    const success = await deleteCharger(id);
    setLoadingId(null);
    setShowDeleteConfirm(null);
    if (success) {
      toast.success("Station removed successfully");
    } else {
      toast.error("Failed to remove station.");
    }
  };

  return (
    <div className="pb-24 bg-slate-50/50 min-h-screen">
      {/* ─── HEADER ─── */}
      <div className="bg-white px-5 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-[1.15rem] font-bold text-slate-900">Manage My Chargers</h1>
            <p className="text-[0.75rem] text-slate-400 font-medium">{myChargers.length} stations listed</p>
          </div>
          <button 
            onClick={() => navigate("/list-charger")}
            className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {myChargers.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-8 text-center border border-slate-100 shadow-sm mt-10">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-slate-200" />
            </div>
            <h2 className="text-[1.1rem] font-bold text-slate-900">No chargers yet</h2>
            <p className="text-[0.85rem] text-slate-400 mt-2 max-w-[200px] mx-auto">
              Ready to start earning? List your first charging station now.
            </p>
            <button 
              onClick={() => navigate("/list-charger")}
              className="mt-6 px-8 py-3 bg-primary text-white rounded-xl font-bold text-[0.9rem] shadow-lg shadow-primary/20"
            >
              List My Charger
            </button>
          </div>
        ) : (
          myChargers.map((charger) => (
            <motion.div 
              layout
              key={charger.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="flex p-4 gap-4">
                {/* Image */}
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                  <img src={charger.image} alt={charger.title} className="w-full h-full object-cover" />
                  {!charger.available && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="text-white text-[0.6rem] font-black uppercase tracking-wider">Busy</span>
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="text-[0.9375rem] font-bold text-slate-900 truncate pr-2">{charger.title}</h3>
                    <div className="flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-lg shrink-0">
                      <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                      <span className="text-[0.7rem] font-black text-emerald-600">{charger.rating || "NEW"}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[0.75rem] truncate font-medium">{charger.address}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2.5">
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-[0.7rem] font-bold text-slate-600">{charger.power}kW</span>
                    </div>
                    <div className="text-primary font-black text-[0.85rem]">₹{charger.pricePerHour}/hr</div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="px-4 pb-4 pt-1 border-t border-slate-50 flex items-center justify-between mt-1 bg-slate-50/30">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                      <span className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Status</span>
                      <div className="flex items-center gap-1.5">
                         <div className={`w-2 h-2 rounded-full ${charger.available ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                         <span className={`text-[0.75rem] font-black ${charger.available ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {charger.available ? 'Open to Public' : 'Currently Busy'}
                         </span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    disabled={loadingId === charger.id}
                    onClick={() => handleToggleAvailability(charger.id, charger.available)}
                    className={`h-10 px-4 rounded-xl flex items-center justify-center gap-2 text-[0.75rem] font-bold transition-all active:scale-95 ${
                      charger.available 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    {loadingId === charger.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Power className="w-3.5 h-3.5" />
                        {charger.available ? 'Make Busy' : 'Make Open'}
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => setShowDeleteConfirm(charger.id)}
                    className="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Delete Confirmation Overlay (Inline) */}
              <AnimatePresence>
                {showDeleteConfirm === charger.id && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="p-4 bg-red-600 text-white flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      <p className="text-[0.8rem] font-bold">Permanently remove this charger?</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => handleDelete(charger.id)}
                         className="flex-1 py-2 bg-white text-red-600 rounded-lg text-xs font-black uppercase tracking-wider shadow-md"
                       >
                         {loadingId === charger.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Yes, Delete"}
                       </button>
                       <button 
                         onClick={() => setShowDeleteConfirm(null)}
                         className="flex-1 py-2 bg-red-700 text-white/80 rounded-lg text-xs font-bold"
                       >
                         Cancel
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Helpful Tips Card */}
      <div className="px-4 py-2">
         <div className="bg-blue-50/50 rounded-[2rem] p-5 border border-blue-100/50 flex gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
               <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div>
               <h4 className="text-[0.85rem] font-bold text-blue-900">Hosting Tip</h4>
               <p className="text-[0.7rem] text-blue-800/60 font-medium mt-1 leading-relaxed">
                  Keeping your station status updated helps you maintain a high host rating and avoids frustrated drivers!
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
