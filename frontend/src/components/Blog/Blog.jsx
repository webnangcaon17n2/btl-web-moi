import { FiHeart, FiBookmark } from 'react-icons/fi'
import blogPlantCare from '../../assets/images/blog_plant_care.png'
import blogIndoorGarden from '../../assets/images/blog_indoor_garden.png'
import blogSucculent from '../../assets/images/blog_succulent.png'
import blogRepotting from '../../assets/images/blog_repotting.png'
import './Blog.css'

const blogPosts = [
  {
    id: 1,
    category: 'Plant Care',
    title: 'The Benefits of Hydration for Your Plants',
    excerpt: 'Discover how proper watering can support your plant growth goals and improve overall health.',
    image: blogPlantCare,
    author: 'Emily Johnson',
    date: '23 May 2025',
    readTime: '5 min read',
    color: '#c5e1a5',
  },
  {
    id: 2,
    category: 'Indoor Garden',
    title: 'Cultivating a Healthy Indoor Garden',
    excerpt: 'Learn how creating a mindful indoor garden can help you develop a healthier relationship with nature.',
    image: blogIndoorGarden,
    author: 'Sarah Thompson',
    date: '23 May 2025',
    readTime: '5 min read',
    color: '#a5d6a7',
  },
  {
    id: 3,
    category: 'Succulents',
    title: 'Understanding Succulents and Cacti',
    excerpt: 'Get a comprehensive understanding of succulents and their role in home decoration for optimal living spaces.',
    image: blogSucculent,
    author: 'Mark Wilson',
    date: '23 May 2025',
    readTime: '5 min read',
    color: '#c8e6c9',
  },
  {
    id: 4,
    category: 'Plant Tips',
    title: 'Quick and Easy Repotting Guide',
    excerpt: 'Explore a variety of convenient and helpful repotting ideas to keep your plants thriving throughout the year.',
    image: blogRepotting,
    author: 'Emily Johnson',
    date: '23 May 2025',
    readTime: '5 min read',
    color: '#dcedc8',
  },
]

function Blog() {
  return (
    <section className="blog section-padding" id="blog">
      <div className="container">
        <div className="blog__header">
          <h2 className="blog__title">Our Blogs</h2>
          <p className="blog__subtitle">
            Our blog is a treasure trove of informative and engaging articles written by our team of plant experts and wellness enthusiasts. Here's what you can expect from our blog.
          </p>
        </div>

        <div className="blog__grid">
          {blogPosts.map((post, index) => (
            <article
              key={post.id}
              className="blog-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <a href="#" className="blog-card__image-link">
                <div
                  className="blog-card__image-wrapper"
                  style={{ backgroundColor: post.color }}
                >
                  <img
                    src={post.image}
                    alt={post.title}
                    className="blog-card__image"
                  />
                </div>
              </a>

              <div className="blog-card__content">
                <span className="blog-card__category">{post.category}</span>
                <h3 className="blog-card__title">
                  <a href="#">{post.title}</a>
                </h3>
                <p className="blog-card__excerpt">{post.excerpt}</p>

                <div className="blog-card__footer">
                  <div className="blog-card__author">
                    <div className="blog-card__avatar">
                      {post.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="blog-card__author-info">
                      <span className="blog-card__author-name">{post.author}</span>
                      <span className="blog-card__meta">{post.date} · {post.readTime}</span>
                    </div>
                  </div>
                  <div className="blog-card__actions">
                    <button className="blog-card__action-btn" aria-label="Like">
                      <FiHeart size={16} />
                    </button>
                    <button className="blog-card__action-btn" aria-label="Bookmark">
                      <FiBookmark size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Blog
