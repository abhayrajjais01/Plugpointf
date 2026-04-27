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
  { id: "m1", brandId: "b1", name: "Tata Nexon EV", image: "/cars/m1.jpeg" },
  { id: "m2", brandId: "b1", name: "Tata Tiago EV", image: "/cars/m2.jpeg" },
  { id: "m3", brandId: "b1", name: "Tata Punch EV", image: "/cars/m3.jpeg" },
  { id: "m4", brandId: "b1", name: "Tata Tigor EV", image: "/cars/m4.jpeg" },
  { id: "m5", brandId: "b1", name: "Tata Curvv EV", image: "/cars/m5.jpeg" },
  { id: "m6", brandId: "b1", name: "Tata Harrier EV", image: "/cars/m6.jpeg" },
  
  // MG
  { id: "m7", brandId: "b2", name: "MG ZS EV", image: "/cars/m7.jpeg" },
  { id: "m8", brandId: "b2", name: "MG Comet EV", image: "/cars/m8.jpeg" },
  { id: "m9", brandId: "b2", name: "MG Cyberster", image: "/cars/m9.jpeg" },

  // Mahindra
  { id: "m10", brandId: "b3", name: "Mahindra XUV400", image: "/cars/m10.jpeg" },
  
  // Hyundai
  { id: "m11", brandId: "b4", name: "Hyundai Kona Electric", image: "/cars/m11.jpeg" },
  { id: "m12", brandId: "b4", name: "Hyundai Ioniq 5", image: "/cars/m12.jpeg" },

  // BYD
  { id: "m13", brandId: "b5", name: "BYD Atto 3", image: "/cars/m13.jpeg" },
  { id: "m14", brandId: "b5", name: "BYD Seal", image: "/cars/m14.jpeg" },
  { id: "m15", brandId: "b5", name: "BYD e6", image: "/cars/m15.jpeg" },

  // Kia
  { id: "m16", brandId: "b6", name: "Kia EV6", image: "/cars/m16.jpeg" },
  { id: "m17", brandId: "b6", name: "Kia EV9", image: "/cars/m17.jpeg" },

  // Citroen
  { id: "m18", brandId: "b7", name: "Citroen eC3", image: "/cars/m18.jpeg" },

  // Volvo
  { id: "m19", brandId: "b8", name: "Volvo XC40 Recharge", image: "/cars/m19.jpeg" },
  { id: "m20", brandId: "b8", name: "Volvo EX30", image: "/cars/m20.jpeg" },
  { id: "m21", brandId: "b8", name: "Volvo C40 Recharge", image: "/cars/m21.jpeg" },

  // BMW
  { id: "m22", brandId: "b9", name: "BMW iX", image: "/cars/m22.jpeg" },
  { id: "m23", brandId: "b9", name: "BMW i4", image: "/cars/m23.jpeg" },
  { id: "m24", brandId: "b9", name: "BMW i7", image: "/cars/m24.jpeg" },
  { id: "m25", brandId: "b9", name: "BMW iX1", image: "/cars/m25.jpeg" },

  // Mercedes-Benz
  { id: "m26", brandId: "b10", name: "Mercedes-Benz EQB", image: "/cars/m26.jpeg" },
  { id: "m27", brandId: "b10", name: "Mercedes-Benz EQS", image: "/cars/m27.jpeg" },
  { id: "m28", brandId: "b10", name: "Mercedes-Benz EQE SUV", image: "/cars/m28.jpeg" },

  // Audi
  { id: "m29", brandId: "b11", name: "Audi Q8 e-tron", image: "/cars/m29.jpeg" },
  { id: "m30", brandId: "b11", name: "Audi e-tron GT", image: "/cars/m30.jpeg" },

  // Porsche
  { id: "m31", brandId: "b12", name: "Porsche Taycan", image: "/cars/m31.jpeg" },
  
  // Mini
  { id: "m32", brandId: "b13", name: "Mini Cooper SE", image: "/cars/m32.jpeg" }
];
