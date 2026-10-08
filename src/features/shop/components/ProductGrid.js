import ProductCard from './ProductCard';

export default function ProductGrid({ products, empty = 'No products found.' }) {
  if (!products.length) return <p className="py-10 text-center text-default-600">{empty}</p>;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
