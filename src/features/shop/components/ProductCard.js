import NextLink from 'next/link';
import Image from 'next/image';
import { formatPoints, formatTaka } from '@/lib/format';
import Rating from './Rating';
import AddToCartButtons from './AddToCartButtons';

export default function ProductCard({ product }) {
  const inStock = product.stock > 0;
  const href = `/product/${product.slug}`;
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-divider bg-content1">
      <NextLink href={href} className="relative block aspect-square bg-content2" aria-label={product.name}>
        {product.image && <Image src={product.image} alt={product.name} fill sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" className="object-cover" />}
      </NextLink>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-snug">
          <NextLink href={href} className="hover:text-primary">
            {product.name}
          </NextLink>
        </h3>
        <Rating avg={product.ratingAvg} count={product.ratingCount} />
        <p>
          <span className="text-lg font-bold">{formatTaka(product.pricePaisa)}</span>{' '}
          <span className="text-sm font-medium text-primary">{formatPoints(product.pointsX100)} Point</span>
        </p>
        <p className={`text-sm ${inStock ? 'text-success-700' : 'text-danger'}`}>{inStock ? 'In Stock' : 'Out of Stock'}</p>
        <AddToCartButtons product={product} />
      </div>
    </article>
  );
}
