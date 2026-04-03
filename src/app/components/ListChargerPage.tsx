import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Zap, MapPin, Camera, IndianRupee, Clock, Info, CheckCircle, ArrowRight, ArrowLeft, Shield, Plus, Loader2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../context/AppContext";
import { uploadChargerImage } from "../../lib/db";
import type { Charger } from "../data/mock-data";

// Options for the dropdowns
const connectorOptions = ["J1772", "CCS", "Tesla Wall Connector", "CHAdeMO"];
const amenityOptions = [
  "Covered Parking","Well Lit","WiFi Nearby","Security Camera",
  "Gated Access","Restroom Nearby","Pet Friendly","Street Parking",
  "Coffee Shop Nearby","Underground Parking",
];

// Step 1: Basic Info, Step 2: Specs, Step 3: Prices, Step 4: Final Tips
type Step = 1 | 2 | 3 | 4;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1765272088039-a6f6b9188199?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

/**
 * --- THE LIST CHARGER PAGE ---
 * This is a "Multi-Step Form". Instead of one giant page, 
 * we break it into 4 small steps to make it less overwhelming for the user.
 */
export function ListChargerPage() {
  const navigate = useNavigate();
  const { addCharger, user } = useApp();
  
  // useRef is like a "Pointer" to a real HTML element.
  // We use it here to click a hidden <input type="file"> when the user clicks our pretty button.
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FORM STATE ---
  const [step, setStep] = useState<Step>(1); // Current page (1 to 4)
  const [submitted, setSubmitted] = useState(false); // Shows the 'Success' screen
  const [submitting, setSubmitting] = useState(false); // Shows a loading spinner on the button
  const [error, setError] = useState<string | null>(null);

  // The actual data fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bangalore, KA");
  const [connectorType, setConnectorType] = useState("");
  const [power, setPower] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [pricePerKwh, setPricePerKwh] = useState("");
  const [availableHours, setAvailableHours] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");

  // Image upload logic
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Adds or removes an amenity from the list when clicked
  const toggleAmenity = (a: string) =>
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  // Prevents the user from clicking 'Next' if they haven't filled in the basics
  const canProceed = () => {
    switch (step) {
      case 1: return title && description && address;
      case 2: return connectorType && power;
      case 3: return pricePerHour && availableHours;
      case 4: return true;
      default: return false;
    }
  };

  // Called when the user picks a photo from their phone/computer
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    // URL.createObjectURL creates a temporary link so we can show a preview immediately
    setImagePreview(URL.createObjectURL(file));
  };

  // The final save logic
  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);

    try {
      // 1. If the user picked a custom photo, upload it to Supabase Storage first
      let imageUrl = FALLBACK_IMAGE;
      if (imageFile) {
        setUploadingImage(true);
        const uploaded = await uploadChargerImage(imageFile, user.id);
        setUploadingImage(false);
        if (uploaded) imageUrl = uploaded;
      }

      // 2. Prepare the final "Charger" object
      const charger: Omit<Charger, "id"> = {
        ownerId: user.id,
        ownerName: user.name,
        ownerAvatar: user.avatar,
        ownerRating: user.rating,
        title,
        description,
        image: imageUrl,
        address,
        city,
        // We pick a random spot in Bangalore if they didn't provide GPS coords
        lat: 12.93 + Math.random() * 0.08,
        lng: 77.56 + Math.random() * 0.18,
        connectorType,
        power: parseFloat(power) || 7.2,
        pricePerHour: parseFloat(pricePerHour) || 80,
        pricePerKwh: parseFloat(pricePerKwh) || 12,
        available: true,
        availableHours,
        rating: 0,
        reviewCount: 0,
        amenities: selectedAmenities,
        instructions,
        verified: false,
      };

      // 3. Save to the database
      const saved = await addCharger(charger);
      if (!saved) throw new Error("Failed to save. Check your connection.");
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- SUCCESS SCREEN ---
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-slate-50/50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-500/10 border border-emerald-50 flex flex-col items-center"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/30"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
          
          <h1 className="text-[1.75rem] font-black text-slate-900 leading-tight">
            Host mode <br />
            <span className="text-emerald-500">activated!</span>
          </h1>
          
          <p className="text-[0.9375rem] text-slate-500 mt-4 font-medium px-2">
            Awesome! "{title}" is now live and ready to power up the EV community.
          </p>
          
          <div className="flex flex-col gap-3 mt-10 w-full">
            <button 
              onClick={() => navigate("/")}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
            >
              Back to Explore
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 text-emerald-600 font-bold hover:bg-emerald-50 rounded-2xl transition-colors"
            >
              Add Another Charger
            </button>
          </div>
        </motion.div>
        
        {/* Subtle background decoration */}
        <div className="absolute top-1/4 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-10 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="pb-8 bg-white min-h-full">
      {/* ─── PAGE HEADER ─── */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[1.25rem] font-black text-slate-900">List Your Charger</h1>
        <p className="text-[0.8125rem] text-slate-400 font-medium mt-1">Start earning by sharing your power</p>
      </div>

      {/* ─── PROGRESS BAR ─── */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            // The bar changes color as you progress through steps
            <div key={s} className={`flex-1 h-2 rounded-full transition-all duration-500 ${s <= step ? "bg-primary shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-slate-100"}`} />
          ))}
        </div>
        <p className="text-[0.7rem] text-slate-400 mt-2 font-black uppercase tracking-widest">
          Step {step} of 4 •{" "}
          <span className="text-primary">
            {step === 1 ? "Fundamentals" : step === 2 ? "Specifications" : step === 3 ? "Pricing" : "Final Details"}
          </span>
        </p>
      </div>

      <div className="px-5">
        {/* STEP 1: BASIC INFO */}
        {step === 1 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-1.5">
              <label className="text-[0.75rem] text-slate-400 font-black uppercase tracking-wider">Station Name *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Koramangala Fast Pad"
                className="w-full px-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 text-[0.9rem] font-bold outline-none focus:border-primary focus:bg-white transition-all shadow-sm" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[0.75rem] text-slate-400 font-black uppercase tracking-wider">Description *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Give details about access, parking, and availability..."
                className="w-full h-32 px-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 text-[0.9rem] font-medium resize-none outline-none focus:border-primary focus:bg-white transition-all shadow-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.75rem] text-slate-400 font-black uppercase tracking-wider">Street Address *</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. #42, MG Road"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 text-[0.9rem] font-bold outline-none focus:border-primary focus:bg-white transition-all shadow-sm" />
              </div>
            </div>

            {/* THE PHOTO UPLOAD SECTION */}
            <div className="space-y-2">
              <label className="text-[0.75rem] text-slate-400 font-black uppercase tracking-wider">Charger Photos</label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <div className="flex gap-3 h-24">
                {/* Clicking this button triggers the hidden input above */}
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-primary hover:text-primary transition-all bg-slate-50">
                  {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Camera className="w-6 h-6 mb-1" /><span className="text-[0.6rem] font-black uppercase">Upload</span></>}
                </button>
                
                {/* Image Preview Block */}
                <div className="flex-1 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                       <Upload className="w-5 h-5 text-slate-300" />
                       <span className="text-[0.6rem] text-slate-300 font-bold mt-1">Preview</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: TECHNICAL SPECS */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-3">
              <label className="text-[0.75rem] text-slate-400 font-black uppercase tracking-wider">Connector Type</label>
              <div className="grid grid-cols-2 gap-2.5">
                {connectorOptions.map((opt) => (
                  <button key={opt} onClick={() => setConnectorType(opt)}
                    className={`p-4 rounded-2xl border text-[0.8rem] text-left transition-all font-bold ${connectorType === opt ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5" : "border-slate-100 bg-slate-50 text-slate-500"}`}>{opt}</button>
                ))}
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[0.75rem] text-slate-400 font-black uppercase tracking-wider">Charging Speed (kW)</label>
              <div className="relative">
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input type="number" value={power} onChange={(e) => setPower(e.target.value)} placeholder="e.g., 7.2"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 text-[0.9rem] font-bold outline-none focus:border-primary transition-all shadow-sm" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PRICING */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-1.5">
              <label className="text-[0.75rem] text-slate-400 font-black uppercase tracking-wider">Price per Hour (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input type="number" value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value)} placeholder="e.g., 100"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 text-[1.1rem] font-black outline-none focus:border-primary transition-all shadow-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.75rem] text-slate-400 font-black uppercase tracking-wider">Available Hours *</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input type="text" value={availableHours} onChange={(e) => setAvailableHours(e.target.value)} placeholder="e.g., 24/7 or 9AM - 8PM"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 text-[0.9rem] font-bold outline-none focus:border-primary transition-all shadow-sm" />
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <IndianRupee className="w-5 h-5 text-primary" />
               </div>
               <div>
                  <p className="text-[0.85rem] font-bold text-slate-800">Earnings Potential</p>
                  <p className="text-[0.7rem] text-slate-500 font-medium tracking-tight">You could earn up to <span className="text-primary font-black">₹{((parseFloat(pricePerHour) || 0) * 100).toLocaleString()}</span> per month.</p>
               </div>
            </div>
          </div>
        )}

        {/* Errors Block */}
        {error && <p className="text-red-500 text-[0.8rem] font-bold mt-4 text-center animate-bounce">{error}</p>}

        {/* ─── NAVIGATION BUTTONS ─── */}
        <div className="flex gap-3 mt-10">
          {step > 1 && (
            <button onClick={() => setStep((step - 1) as Step)}
              className="w-14 h-14 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 hover:bg-slate-50 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          
          {step < 4 ? (
            <button onClick={() => setStep((step + 1) as Step)} disabled={!canProceed()}
              className={`flex-1 h-14 rounded-2xl font-black text-[0.9rem] flex items-center justify-center gap-2 transition-all ${canProceed() ? "bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02]" : "bg-slate-100 text-slate-300 cursor-not-allowed"}`}>
              Continue<ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 h-14 bg-primary text-white rounded-2xl font-black text-[0.9rem] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "List Station Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}