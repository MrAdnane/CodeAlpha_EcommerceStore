import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Toys', 'Other'];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const category = params.get('category') || 'All';
  const search = params.get('search') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 1);
  const [minPrice, setMinPrice] = useState(params.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') || '');
  const [searchInput, setSearchInput] = useState(search);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    if (!patch.page) next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 12, sort });
    if (category !== 'All') q.set('category', category);
    if (search) q.set('search', search);
    if (params.get('minPrice')) q.set('minPrice', params.get('minPrice'));
    if (params.get('maxPrice')) q.set('maxPrice', params.get('maxPrice'));
    api.getProducts(`?${q}`)
      .then((d) => { setProducts(d.products); setTotal(d.total); setPages(d.pages); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category, search, sort, page, params]);

  return (
    <div className="container page">
      <h1 className="page-title">Shop All Products</h1>
      <p className="page-sub">{total} product{total !== 1 ? 's' : ''} found</p>
      <div className="shop-layout">
        <aside className="filters" aria-label="Filters">
          <h3>Category</h3>
          {CATEGORIES.map((c) => (
            <label key={c}><input type="radio" name="cat" checked={category === c} onChange={() => update({ category: c === 'All' ? '' : c })} /> {c}</label>
          ))}
          <h3 style={{ marginTop: 20 }}>Price</h3>
          <input type="number" min="0" placeholder="Min $" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <input type="number" min="0" placeholder="Max $" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          <button className="btn btn-sm" style={{ width: '100%' }} onClick={() => update({ minPrice, maxPrice })}>Apply Price</button>
          <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => { setMinPrice(''); setMaxPrice(''); setParams({}); }}>Clear all filters</button>
        </aside>
        <div>
          <div className="toolbar">
            <input type="search" placeholder="Search…" value={searchInput} aria-label="Search products"
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') update({ search: searchInput }); }} />
            <select value={sort} aria-label="Sort products" onChange={(e) => update({ sort: e.target.value })}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
          {error && <p className="error">{error}</p>}
          {loading ? (
            <div className="products-grid">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" />)}</div>
          ) : products.length === 0 ? (
            <div className="empty"><h3>No products found</h3><p>Try a different search or clear the filters.</p></div>
          ) : (
            <div className="products-grid">{products.map((p) => <ProductCard key={p._id} product={p} />)}</div>
          )}
          {pages > 1 && (
            <div className="pagination">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button key={n} className={n === page ? 'active' : ''} onClick={() => update({ page: String(n) })}>{n}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
