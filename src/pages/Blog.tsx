/**
 * Blog Listing Page
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEO } from '@/components/SEO';
import { getAllBlogPosts, getFeaturedPosts } from '@/data/blogPosts';
import { BLOG_CATEGORIES, getCategoryInfo } from '@/types/blog';
import type { BlogPost, BlogCategory } from '@/types/blog';

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | 'all'>('all');

  const allPosts = getAllBlogPosts();
  const featuredPosts = getFeaturedPosts();

  const filteredPosts = allPosts.filter((post) => {
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <SEO
        title="Business Blog - Tips, Guides & Success Stories | SPARK Business Buddy"
        description="Expert business advice, entrepreneurship guides, and success stories to help you start and grow your business in Canada."
        keywords={['business blog', 'entrepreneurship tips', 'business guides', 'startup advice']}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">SPARK Blog</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Expert insights, practical guides, and inspiring stories to fuel your entrepreneurial journey
              </p>

              {/* Search */}
              <div className="relative max-w-md mx-auto">
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <svg
                  className="absolute left-3 top-3 h-5 w-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {/* Featured Posts */}
          {featuredPosts.length > 0 && searchQuery === '' && selectedCategory === 'all' && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Featured Articles</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {featuredPosts.map((post) => (
                  <FeaturedPostCard key={post.id} post={post} formatDate={formatDate} />
                ))}
              </div>
            </section>
          )}

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory('all')}
                    >
                      All Articles
                    </Button>
                    {BLOG_CATEGORIES.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <span className="mr-2">{category.icon}</span>
                        {category.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                {/* Newsletter CTA */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Stay Updated</CardTitle>
                    <CardDescription>Get the latest business tips delivered to your inbox</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input placeholder="Your email" type="email" />
                    <Button className="w-full mt-3">Subscribe</Button>
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Blog Posts Grid */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedCategory === 'all'
                    ? 'All Articles'
                    : getCategoryInfo(selectedCategory as BlogCategory).label}
                </h2>
                <p className="text-muted-foreground">{filteredPosts.length} articles</p>
              </div>

              {filteredPosts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">No articles found matching your criteria.</p>
                    <Button variant="outline" onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredPosts.map((post) => (
                    <BlogPostCard key={post.id} post={post} formatDate={formatDate} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FeaturedPostCard({ post, formatDate }: { post: BlogPost; formatDate: (date: string) => string }) {
  const categoryInfo = getCategoryInfo(post.category);

  return (
    <Link to={`/blog/${post.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
        {post.coverImage && (
          <div className="aspect-video overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">
              {categoryInfo.icon} {categoryInfo.label}
            </Badge>
            <Badge variant="outline">Featured</Badge>
          </div>
          <CardTitle className="text-xl group-hover:text-primary transition-colors">{post.title}</CardTitle>
          <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(post.publishedAt)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.readingTime} min read
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

function BlogPostCard({ post, formatDate }: { post: BlogPost; formatDate: (date: string) => string }) {
  const categoryInfo = getCategoryInfo(post.category);

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow group">
      {post.coverImage && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardHeader className="flex-1">
        <Badge variant="secondary" className="w-fit mb-2">
          {categoryInfo.icon} {categoryInfo.label}
        </Badge>
        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </CardTitle>
        <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col gap-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground w-full">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(post.publishedAt)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.readingTime} min
          </div>
        </div>
        <Link to={`/blog/${post.slug}`} className="w-full">
          <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            Read More <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
