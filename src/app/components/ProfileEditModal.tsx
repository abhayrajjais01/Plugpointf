import { useState, useEffect } from "react";
import { X, User, Phone, Loader2, CheckCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { user, updateProfile } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (phone.trim() && phone.trim().length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    const success = await updateProfile({ name: name.trim(), phone: phone.trim() });
    setIsLoading(false);

    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } else {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={() => !isLoading && onClose()} 
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Success Overlay */}
        {isSuccess && (
          <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <p className="text-emerald-800 font-bold text-lg">Profile Updated!</p>
          </div>
        )}

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">Edit Profile</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-8 space-y-5">
          {/* Avatar Hint */}
          <div className="flex flex-col items-center py-2">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-50 shadow-md">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <p className="text-[0.65rem] text-slate-400 mt-2 font-bold uppercase tracking-widest">Avatar synced from login</p>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-[0.75rem] font-bold text-slate-500 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-[0.95rem] font-semibold text-slate-900 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                placeholder="Enter your name"
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-1.5">
            <label className="text-[0.75rem] font-bold text-slate-500 ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ""); // Remove non-digits
                  if (val.length <= 10) setPhone(val);
                }}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-[0.95rem] font-semibold text-slate-900 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                placeholder="10-digit mobile number"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
            className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 flex justify-center items-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving Changes...</>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
