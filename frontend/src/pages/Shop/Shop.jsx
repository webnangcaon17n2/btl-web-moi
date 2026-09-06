import FeaturedProducts from '../../components/FeaturedProducts/FeaturedProducts'
import Categories from '../../components/Categories/Categories'
import './Shop.css'

function Shop() {
  return (
    <>
      <main className="shop-page">
        {/* Shop Hero Banner */}
        <section className="shop-hero">
          <div className="container">
            <div className="shop-hero__content">
              <span className="shop-hero__tag">Our Collection</span>
              <h1 className="shop-hero__title">Explore Our Plants</h1>
              <p className="shop-hero__subtitle">
                Discover our curated collection of premium indoor and outdoor plants for every space and lifestyle.
              </p>
            </div>
          </div>
          <div className="shop-hero__bg-blob"></div>
        </section>

        <FeaturedProducts />
        <Categories />
      </main>
    </>
  )
}

export default Shop
