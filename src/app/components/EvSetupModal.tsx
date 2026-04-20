import { useState, useEffect } from "react";
import { Car, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

interface EvSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EvSetupModal({ isOpen, onClose }: EvSetupModalProps) {
  const { evDetails, setEvDetails } = useApp();
  const [evForm, setEvForm] = useState({ make: "", model: "" });

  useEffect(() => {
    if (evDetails) {
      setEvForm(evDetails);
    }
  }, [evDetails]);

  if (!isOpen) return null;

  const saveEvDetails = () => {
    localStorage.setItem("plugpoint_my_ev", JSON.stringify(evForm));
    setEvDetails(evForm);
    onClose();
    toast.success("EV Details saved!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Car className="w-5 h-5" />
            <h3 className="font-bold text-[1.1rem]">Setup My EV</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-slate-500 text-[0.85rem] mb-4">
          Save your electric vehicle details to easily check compatibility with charging connectors in the area.
        </p>

        <div className="mb-3">
          <label className="text-[0.8rem] font-bold text-slate-600 mb-1 block">Make (Brand)</label>
          <input
            type="text"
            placeholder="e.g. Tata, MG, Tesla"
            value={evForm.make}
            onChange={(e) => setEvForm({...evForm, make: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[0.95rem] font-semibold text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        
        <div className="mb-6">
          <label className="text-[0.8rem] font-bold text-slate-600 mb-1 block">Model</label>
          <input
            type="text"
            placeholder="e.g. Nexon EV, ZS EV"
            value={evForm.model}
            onChange={(e) => setEvForm({...evForm, model: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[0.95rem] font-semibold text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          onClick={saveEvDetails}
          disabled={!evForm.make || !evForm.model}
          className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Save Details
        </button>
      </div>
    </div>
  );
}
