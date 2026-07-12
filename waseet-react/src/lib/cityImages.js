// Real, city-accurate photos (Wikimedia Commons lead images, 800px thumbs).
// Loaded by the browser at runtime; if one fails the caller falls back to a gradient.
export const CITY_IMAGES = {
  Jeddah: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/%D8%A7%D9%84%D9%88%D8%A7%D8%AC%D9%87%D8%A9_%D8%A7%D9%84%D8%A8%D8%AD%D8%B1%D9%8A%D8%A9_%D9%81%D9%8A_%D9%85%D8%AF%D9%8A%D9%86%D8%A9_%D8%AC%D8%AF%D8%A9_%D8%BA%D8%B1%D8%A8_%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9_%282025%29_%28cropped%29.jpg/800px-%D8%A7%D9%84%D9%88%D8%A7%D8%AC%D9%87%D8%A9_%D8%A7%D9%84%D8%A8%D8%AD%D8%B1%D9%8A%D8%A9_%D9%81%D9%8A_%D9%85%D8%AF%D9%8A%D9%86%D8%A9_%D8%AC%D8%AF%D8%A9_%D8%BA%D8%B1%D8%A8_%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9_%282025%29_%28cropped%29.jpg',
  Riyadh: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Riyadh_Skyline.jpg/800px-Riyadh_Skyline.jpg',
  Dubai: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c7/Burj_Khalifa_2021.jpg/800px-Burj_Khalifa_2021.jpg',
  Lahore: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Lahore_Fort_view_from_Baradari.jpg/800px-Lahore_Fort_view_from_Baradari.jpg',
  Mecca: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Great_Mosque_of_Mecca1.jpg/800px-Great_Mosque_of_Mecca1.jpg',
  Medina: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Al-Masjid_An-Nabawi_%28Bird%27s_Eye_View%29.jpg/800px-Al-Masjid_An-Nabawi_%28Bird%27s_Eye_View%29.jpg',
  Dammam: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/%D9%88%D8%B3%D8%B7_%D8%A7%D9%84%D8%AF%D9%85%D8%A7%D9%85.jpg/800px-%D9%88%D8%B3%D8%B7_%D8%A7%D9%84%D8%AF%D9%85%D8%A7%D9%85.jpg',
  Khobar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Khobar_water_tower.jpg/800px-Khobar_water_tower.jpg',
}

export const cityImage = (city) => CITY_IMAGES[city] || null
