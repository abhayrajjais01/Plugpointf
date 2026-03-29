-- ============================================================
-- PlugPoint Database Schema
-- Paste this entire file into: Supabase → SQL Editor → Run
-- ============================================================

-- Profiles (synced from Firebase Auth on login)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'User',
  avatar_url TEXT DEFAULT 'https://i.pravatar.cc/150?img=33',
  email TEXT,
  phone TEXT DEFAULT '',
  joined_date TEXT,
  chargers_listed INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 5.0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chargers
CREATE TABLE IF NOT EXISTS chargers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL,
  owner_name TEXT,
  owner_avatar TEXT,
  owner_rating NUMERIC(3,1) DEFAULT 5.0,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Bangalore, KA',
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  connector_type TEXT DEFAULT 'J1772',
  power NUMERIC(5,2) DEFAULT 7.2,
  price_per_hour NUMERIC(8,2) DEFAULT 80,
  price_per_kwh NUMERIC(8,2) DEFAULT 12,
  available BOOLEAN DEFAULT true,
  available_hours TEXT DEFAULT '24/7',
  rating NUMERIC(3,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  amenities TEXT[] DEFAULT '{}',
  instructions TEXT DEFAULT '',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charger_id UUID REFERENCES chargers(id) ON DELETE SET NULL,
  charger_title TEXT,
  charger_image TEXT,
  charger_address TEXT,
  host_name TEXT,
  user_id TEXT NOT NULL,
  date TEXT,
  start_time TEXT,
  end_time TEXT,
  duration INTEGER DEFAULT 1,
  total_cost NUMERIC(10,2),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','active','completed','cancelled')),
  connector_type TEXT,
  power NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charger_id UUID REFERENCES chargers(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_avatar TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  helpful INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (permissive for MVP)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chargers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_all" ON profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "chargers_all" ON chargers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "bookings_all" ON bookings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "reviews_all" ON reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Seed: 6 demo chargers
-- ============================================================
INSERT INTO chargers (owner_id, owner_name, owner_avatar, owner_rating, title, description, image_url, address, city, lat, lng, connector_type, power, price_per_hour, price_per_kwh, available, available_hours, rating, review_count, amenities, instructions, verified)
VALUES
  ('seed_host_01','Priya Sharma','https://i.pravatar.cc/150?img=5',4.8,'Koramangala Home Charger','Level 2 charger in my garage, easily accessible from the main road. Covered parking spot with good lighting. Available most evenings and weekends.','https://images.unsplash.com/photo-1765272088009-100c96a4cd4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080','4th Cross, 6th Block, Koramangala','Bangalore, KA',12.9352,77.6245,'J1772',7.2,80,12,true,'6 PM - 8 AM weekdays, All day weekends',4.8,23,ARRAY['Covered Parking','Well Lit','WiFi Nearby','Pet Friendly'],'Enter from the 4th Cross side gate. Park on the left side. The charger is mounted on the wall.',true),
  ('seed_host_02','Rahul Verma','https://i.pravatar.cc/150?img=12',4.6,'Fast Charge Hub - Indiranagar','High-power Level 2 charger perfect for a quick top-up. Located in a secure gated community with 24/7 camera surveillance.','https://images.unsplash.com/photo-1762117360986-9753aef7680f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080','12th Main, HAL 2nd Stage, Indiranagar','Bangalore, KA',12.9784,77.6408,'Tesla Wall Connector',11.5,120,15,true,'24/7',4.6,41,ARRAY['Gated Access','Security Camera','Covered Parking','Restroom Nearby'],'Enter gate code #4523. Parking spot B12. Charger is on the right wall.',true),
  ('seed_host_03','Ananya Reddy','https://i.pravatar.cc/150?img=23',4.9,'Jayanagar Driveway Charger','Convenient residential charger with easy street access. Perfect for overnight charging while you explore the neighbourhood.','https://images.unsplash.com/photo-1631347826177-de288776ed3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080','32nd Cross, 4th Block, Jayanagar','Bangalore, KA',12.9250,77.5838,'CCS',9.6,100,14,true,'8 AM - 10 PM daily',4.9,17,ARRAY['Street Parking','Well Lit','Coffee Shop Nearby','Parks Nearby'],'Park in the designated spot on the driveway. Please text when you arrive.',true),
  ('seed_host_04','Vikram Nair','https://i.pravatar.cc/150?img=15',4.7,'Whitefield Tech Park Charger','Charger in my building''s parking garage near ITPL. Great location if you want to charge while at work.','https://images.unsplash.com/photo-1752830132482-def8649b6432?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080','ITPL Main Road, Whitefield','Bangalore, KA',12.9698,77.7500,'J1772',7.2,90,13,false,'7 AM - 11 PM daily',4.7,31,ARRAY['Underground Parking','Security Camera','Tech Park Access','Restroom'],'Enter underground garage from ITPL Main Road entrance. Spot G-14.',true),
  ('seed_host_05','Deepa Iyer','https://i.pravatar.cc/150?img=44',4.5,'HSR Layout Quick Charge','High-speed charger in my apartment building''s basement. Central HSR location, close to restaurants and cafes.','https://images.unsplash.com/photo-1765272088039-a6f6b9188199?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080','27th Main, Sector 2, HSR Layout','Bangalore, KA',12.9116,77.6389,'Tesla Wall Connector',11.5,130,16,true,'6 AM - 12 AM daily',4.5,19,ARRAY['Garage Parking','Elevator Access','Security','EV Friendly Building'],'Text me when you arrive. I''ll meet you at the basement entrance.',false),
  ('seed_host_06','Karthik Rao','https://i.pravatar.cc/150?img=51',4.8,'Malleshwaram Premium Charger','Premium residential charger in a quiet heritage neighbourhood.','https://images.unsplash.com/photo-1651688730796-151972ba8f87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080','15th Cross, Malleshwaram','Bangalore, KA',12.9965,77.5713,'CCS',9.6,150,18,true,'9 AM - 9 PM daily',4.8,12,ARRAY['Private Driveway','Scenic View','Quiet Area','Well Lit'],'Drive up to the house and park in the second spot. The charger is clearly marked.',true);

-- ============================================================
-- Seed: Reviews (references chargers by title)
-- ============================================================
INSERT INTO reviews (charger_id, user_id, user_name, user_avatar, rating, comment)
SELECT id,'seed_u08','Rohan Kulkarni','https://i.pravatar.cc/150?img=8',5,'Excellent charger! Priya was super friendly. Covered parking is a huge plus. Will definitely book again.' FROM chargers WHERE title='Koramangala Home Charger';

INSERT INTO reviews (charger_id, user_id, user_name, user_avatar, rating, comment)
SELECT id,'seed_u09','Sneha Patel','https://i.pravatar.cc/150?img=20',5,'Great location and the charger worked perfectly. Left my car for 3 hours and came back to a full charge!' FROM chargers WHERE title='Koramangala Home Charger';

INSERT INTO reviews (charger_id, user_id, user_name, user_avatar, rating, comment)
SELECT id,'seed_u10','Aditya Joshi','https://i.pravatar.cc/150?img=60',4,'Good charger, easy to find. The cable was a bit short but we made it work. Nice neighbourhood.' FROM chargers WHERE title='Koramangala Home Charger';

INSERT INTO reviews (charger_id, user_id, user_name, user_avatar, rating, comment)
SELECT id,'seed_u11','Kavya Srinivas','https://i.pravatar.cc/150?img=32',5,'Fast charging speed and super secure location. Rahul is a great host!' FROM chargers WHERE title='Fast Charge Hub - Indiranagar';

INSERT INTO reviews (charger_id, user_id, user_name, user_avatar, rating, comment)
SELECT id,'seed_u12','Nikhil Hegde','https://i.pravatar.cc/150?img=53',4,'Solid charger with good power output. The gate code system works well.' FROM chargers WHERE title='Fast Charge Hub - Indiranagar';

INSERT INTO reviews (charger_id, user_id, user_name, user_avatar, rating, comment)
SELECT id,'seed_u13','Meera Gupta','https://i.pravatar.cc/150?img=41',5,'Ananya is the best host! She texted me detailed instructions. Perfect experience.' FROM chargers WHERE title='Jayanagar Driveway Charger';

INSERT INTO reviews (charger_id, user_id, user_name, user_avatar, rating, comment)
SELECT id,'seed_u14','Suresh Baliga','https://i.pravatar.cc/150?img=14',5,'Amazing location right by ITPL. Charged my car while working at the tech park!' FROM chargers WHERE title='Whitefield Tech Park Charger';

INSERT INTO reviews (charger_id, user_id, user_name, user_avatar, rating, comment)
SELECT id,'seed_u15','Divya Krishnan','https://i.pravatar.cc/150?img=26',4,'Good central location in HSR. Deepa was helpful getting me into the basement.' FROM chargers WHERE title='HSR Layout Quick Charge';

-- ============================================================
-- Storage bucket: charger-images
-- Create this manually in Supabase → Storage → New bucket
-- Name: charger-images  |  Public: YES
-- ============================================================
