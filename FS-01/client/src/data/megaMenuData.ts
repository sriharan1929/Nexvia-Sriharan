export interface MegaMenuColumn {
  title: string;
  items: { label: string; query: string }[];
}

export interface MegaMenuCategory {
  id: string;
  label: string;
  color?: string;
  columns: MegaMenuColumn[];
}

export const MEGA_MENU_DATA: MegaMenuCategory[] = [
  {
    id: 'men',
    label: 'MEN',
    columns: [
      {
        title: 'Topwear',
        items: [
          { label: 'T-Shirts', query: 'tshirt' },
          { label: 'Casual Shirts', query: 'shirt' },
          { label: 'Formal Shirts', query: 'formal shirt' },
          { label: 'Sweatshirts', query: 'sweatshirt' },
          { label: 'Jackets', query: 'jacket' },
        ],
      },
      {
        title: 'Bottomwear',
        items: [
          { label: 'Jeans', query: 'jeans' },
          { label: 'Casual Trousers', query: 'trousers' },
          { label: 'Shorts', query: 'shorts' },
          { label: 'Track Pants', query: 'track pants' },
        ],
      },
      {
        title: 'Footwear',
        items: [
          { label: 'Casual Shoes', query: 'shoes' },
          { label: 'Sports Shoes', query: 'sports shoes' },
          { label: 'Sneakers', query: 'sneakers' },
          { label: 'Sandals & Floaters', query: 'sandals' },
        ],
      },
      {
        title: 'Fashion Accessories',
        items: [
          { label: 'Wallets & Belts', query: 'wallet' },
          { label: 'Watches', query: 'watch' },
          { label: 'Sunglasses', query: 'sunglasses' },
          { label: 'Bags & Backpacks', query: 'backpack' },
        ],
      },
    ],
  },
  {
    id: 'women',
    label: 'WOMEN',
    columns: [
      {
        title: 'Indian & Fusion Wear',
        items: [
          { label: 'Kurtas & Suits', query: 'kurta' },
          { label: 'Sarees', query: 'saree' },
          { label: 'Ethnic Dresses', query: 'ethnic' },
          { label: 'Pashmina Shawls', query: 'pashmina' },
          { label: 'Dupattas & Shawls', query: 'shawl' },
        ],
      },
      {
        title: 'Western Wear',
        items: [
          { label: 'Dresses', query: 'dress' },
          { label: 'Tops & T-Shirts', query: 'top' },
          { label: 'Jeans & Jeggings', query: 'jeans' },
          { label: 'Trousers & Capris', query: 'trousers' },
          { label: 'Jackets & Coats', query: 'jacket' },
        ],
      },
      {
        title: 'Footwear',
        items: [
          { label: 'Flats & Bellies', query: 'flats' },
          { label: 'Heels & Wedges', query: 'heels' },
          { label: 'Casual Shoes & Sneakers', query: 'sneakers' },
          { label: 'Boots', query: 'boots' },
        ],
      },
      {
        title: 'Jewellery & Handbags',
        items: [
          { label: 'Fashion Jewellery', query: 'jewellery' },
          { label: 'Handbags & Clutches', query: 'handbag' },
          { label: 'Watches', query: 'watch' },
        ],
      },
    ],
  },
  {
    id: 'kids',
    label: 'KIDS',
    columns: [
      {
        title: 'Boys Clothing',
        items: [
          { label: 'T-Shirts & Polos', query: 'kids tshirt' },
          { label: 'Shirts', query: 'kids shirt' },
          { label: 'Jeans & Trousers', query: 'kids jeans' },
          { label: 'Ethnic Wear', query: 'kids ethnic' },
        ],
      },
      {
        title: 'Girls Clothing',
        items: [
          { label: 'Dresses & Frocks', query: 'girls dress' },
          { label: 'Tops & T-Shirts', query: 'girls top' },
          { label: 'Ethnic Wear & Lehengas', query: 'girls ethnic' },
          { label: 'Skirts & Shorts', query: 'girls skirt' },
        ],
      },
      {
        title: 'Footwear & Toys',
        items: [
          { label: 'Casual Shoes', query: 'kids shoes' },
          { label: 'School Shoes', query: 'school shoes' },
          { label: 'Action Toys & Games', query: 'toys' },
        ],
      },
    ],
  },
  {
    id: 'home',
    label: 'HOME & LIVING',
    columns: [
      {
        title: 'Bed Linen & Furnishing',
        items: [
          { label: 'Bedspreads & Bedcovers', query: 'bedspread' },
          { label: 'Pure Cotton Bedsheets', query: 'bedsheet' },
          { label: 'Blankets & Quilts', query: 'quilt' },
          { label: 'Cushions & Covers', query: 'cushion' },
        ],
      },
      {
        title: 'Kitchen & Tableware',
        items: [
          { label: 'Ceramic Dinner Sets', query: 'dinner set' },
          { label: 'Cups & Mugs', query: 'mugs' },
          { label: 'Table Mats & Runners', query: 'table mat' },
          { label: 'Cookware', query: 'cookware' },
        ],
      },
      {
        title: 'Home Decor',
        items: [
          { label: 'Handcrafted Terracotta', query: 'terracotta' },
          { label: 'Wall Art & Clocks', query: 'wall decor' },
          { label: 'Lamps & Lighting', query: 'lamp' },
          { label: 'Aroma Diffusers', query: 'diffuser' },
        ],
      },
    ],
  },
  {
    id: 'beauty',
    label: 'BEAUTY',
    columns: [
      {
        title: 'Skincare',
        items: [
          { label: 'Face Moisturizers', query: 'moisturizer' },
          { label: 'Cleansers & Face Wash', query: 'face wash' },
          { label: 'Sunscreens', query: 'sunscreen' },
          { label: 'Face Serums', query: 'serum' },
        ],
      },
      {
        title: 'Haircare & Grooming',
        items: [
          { label: 'Shampoos & Conditioners', query: 'shampoo' },
          { label: 'Hair Oils', query: 'hair oil' },
          { label: 'Beard Care & Shaving', query: 'grooming' },
          { label: 'Perfumes & Deos', query: 'perfume' },
        ],
      },
      {
        title: 'Top Brands',
        items: [
          { label: 'Lakme', query: 'lakme' },
          { label: 'Maybelline', query: 'maybelline' },
          { label: 'The Body Shop', query: 'body shop' },
          { label: 'Forest Essentials', query: 'forest essentials' },
        ],
      },
    ],
  },
];
