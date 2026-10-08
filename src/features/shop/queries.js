import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";

/**
 * 1. Fetch Featured Products for Homepage Grid
 */
export async function getFeaturedProducts(limit = 8) {
  try {
    await dbConnect();
    
    // First attempt: Check for featured products that are active
    let products = await Product.find({ isFeatured: true, isActive: { $ne: false } })
      .limit(limit)
      .lean();

    // Fallback: If no featured products marked, return latest active products
    if (!products || products.length === 0) {
      products = await Product.find({ isActive: { $ne: false } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }

    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

/**
 * 2. Fetch All Active Categories
 */
export async function getCategories() {
  try {
    await dbConnect();
    const categories = await Category.find({ isActive: { $ne: false } })
      .sort({ name: 1 })
      .lean();
    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * 3. Fetch Products for Shop Listing Page (With Filters & Pagination)
 */
export async function getShopProducts({ page = 1, limit = 12, category, search } = {}) {
  try {
    await dbConnect();
    const query = { isActive: { $ne: false } };

    if (category && category !== "all-products") {
      // Handles both ObjectId or category slug/string
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return {
      products: JSON.parse(JSON.stringify(products)),
      totalPages: Math.ceil(total / limit) || 1,
      totalProducts: total,
    };
  } catch (error) {
    console.error("Error fetching shop products:", error);
    return {
      products: [],
      totalPages: 0,
      totalProducts: 0,
    };
  }
}

/**
 * 4. List Products by Category Slug (Includes Category Info)
 */
export async function listProducts({ q = '', categorySlug = '', page = 1, limit = 12 } = {}) {
  try {
    await dbConnect();

    const query = { isActive: { $ne: false } };
    let category = null;

    if (categorySlug && categorySlug !== "all-products") {
      category = await Category.findOne({ 
        slug: categorySlug, 
        isActive: { $ne: false } 
      }).lean();

      if (category) {
        // Query by Category ID or Slug string match
        query.$or = [
          { category: category._id },
          { category: categorySlug }
        ];
      } else {
        query.category = categorySlug;
      }
    }

    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      category: category ? JSON.parse(JSON.stringify(category)) : null,
      products: JSON.parse(JSON.stringify(products)),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  } catch (error) {
    console.error('Error listing products:', error);
    return { category: null, products: [], total: 0, page: 1, pages: 0 };
  }
}