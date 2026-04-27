export interface EVBrand {
  id: string;
  name: string;
  logoUrl: string;
}

export interface EVModel {
  id: string;
  brandId: string;
  name: string;
  image: string;
}

export interface UserVehicle {
  id: string;
  modelId: string;
  brandName: string;
  modelName: string;
  image: string;
  logoUrl: string;
  registrationNumber?: string;
}

const DEFAULT_EV_IMAGE = "/cars/ev-placeholder.svg";

export const evBrands: EVBrand[] = [
  { id: "b1", name: "Tata", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Tata_logo.svg" },
  { id: "b2", name: "MG", logoUrl: "https://upload.wikimedia.org/wikipedia/en/7/7b/MG_Motor_logo.svg" },
  { id: "b3", name: "Mahindra", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/3/36/Mahindra_Auto_Current_Logo.svg" },
  { id: "b4", name: "Hyundai", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg" },
  { id: "b5", name: "BYD", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/05/BYD_logo.svg" },
  { id: "b6", name: "Kia", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/47/KIA_logo2.svg" },
  { id: "b7", name: "Citroen", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/46/Citroen_logo_2022.svg" },
  { id: "b8", name: "Volvo", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/29/Volvo-Iron-Mark-Black.svg" },
  { id: "b9", name: "BMW", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f4/BMW_logo_%28transparent_background%29.svg" },
  { id: "b10", name: "Mercedes-Benz", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg" },
  { id: "b11", name: "Audi", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg" },
  { id: "b12", name: "Porsche", logoUrl: "https://upload.wikimedia.org/wikipedia/en/e/e0/Porsche_logo.svg" },
  { id: "b13", name: "Mini", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d3/MINI_logo_2018.svg" },
];

export const evModels: EVModel[] = [
  // Tata
  { id: "m1", brandId: "b1", name: "Tata Nexon EV", image: DEFAULT_EV_IMAGE },
  { id: "m2", brandId: "b1", name: "Tata Tiago EV", image: DEFAULT_EV_IMAGE },
  { id: "m3", brandId: "b1", name: "Tata Punch EV", image: DEFAULT_EV_IMAGE },
  { id: "m4", brandId: "b1", name: "Tata Tigor EV", image: DEFAULT_EV_IMAGE },
  { id: "m5", brandId: "b1", name: "Tata Curvv EV", image: DEFAULT_EV_IMAGE },
  { id: "m6", brandId: "b1", name: "Tata Harrier EV", image: DEFAULT_EV_IMAGE },
  
  // MG
  { id: "m7", brandId: "b2", name: "MG ZS EV", image: DEFAULT_EV_IMAGE },
  { id: "m8", brandId: "b2", name: "MG Comet EV", image: DEFAULT_EV_IMAGE },
  { id: "m9", brandId: "b2", name: "MG Cyberster", image: DEFAULT_EV_IMAGE },

  // Mahindra
  { id: "m10", brandId: "b3", name: "Mahindra XUV400", image: DEFAULT_EV_IMAGE },
  
  // Hyundai
  { id: "m11", brandId: "b4", name: "Hyundai Kona Electric", image: DEFAULT_EV_IMAGE },
  { id: "m12", brandId: "b4", name: "Hyundai Ioniq 5", image: DEFAULT_EV_IMAGE },

  // BYD
  { id: "m13", brandId: "b5", name: "BYD Atto 3", image: DEFAULT_EV_IMAGE },
  { id: "m14", brandId: "b5", name: "BYD Seal", image: DEFAULT_EV_IMAGE },
  { id: "m15", brandId: "b5", name: "BYD e6", image: DEFAULT_EV_IMAGE },

  // Kia
  { id: "m16", brandId: "b6", name: "Kia EV6", image: DEFAULT_EV_IMAGE },
  { id: "m17", brandId: "b6", name: "Kia EV9", image: DEFAULT_EV_IMAGE },

  // Citroen
  { id: "m18", brandId: "b7", name: "Citroen eC3", image: DEFAULT_EV_IMAGE },

  // Volvo
  { id: "m19", brandId: "b8", name: "Volvo XC40 Recharge", image: DEFAULT_EV_IMAGE },
  { id: "m20", brandId: "b8", name: "Volvo EX30", image: DEFAULT_EV_IMAGE },
  { id: "m21", brandId: "b8", name: "Volvo C40 Recharge", image: DEFAULT_EV_IMAGE },

  // BMW
  { id: "m22", brandId: "b9", name: "BMW iX", image: DEFAULT_EV_IMAGE },
  { id: "m23", brandId: "b9", name: "BMW i4", image: DEFAULT_EV_IMAGE },
  { id: "m24", brandId: "b9", name: "BMW i7", image: DEFAULT_EV_IMAGE },
  { id: "m25", brandId: "b9", name: "BMW iX1", image: DEFAULT_EV_IMAGE },

  // Mercedes-Benz
  { id: "m26", brandId: "b10", name: "Mercedes-Benz EQB", image: DEFAULT_EV_IMAGE },
  { id: "m27", brandId: "b10", name: "Mercedes-Benz EQS", image: DEFAULT_EV_IMAGE },
  { id: "m28", brandId: "b10", name: "Mercedes-Benz EQE SUV", image: DEFAULT_EV_IMAGE },

  // Audi
  { id: "m29", brandId: "b11", name: "Audi Q8 e-tron", image: DEFAULT_EV_IMAGE },
  { id: "m30", brandId: "b11", name: "Audi e-tron GT", image: DEFAULT_EV_IMAGE },

  // Porsche
  { id: "m31", brandId: "b12", name: "Porsche Taycan", image: DEFAULT_EV_IMAGE },
  
  // Mini
  { id: "m32", brandId: "b13", name: "Mini Cooper SE", image: DEFAULT_EV_IMAGE }
];
