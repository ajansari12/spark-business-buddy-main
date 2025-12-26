/**
 * Individual Blog Post Page
 */

import { useParams, Link, Navigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SEO } from '@/components/SEO';
import { getBlogPostBySlug, getRelatedPosts } from '@/data/blogPosts';
import { getCategoryInfo } from '@/types/blog';
import ReactMarkdown from 'react-markdown';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const categoryInfo = getCategoryInfo(post.category);
  const relatedPosts = getRelatedPosts(post);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const shareUrl = `${window.location.origin}/blog/${post.slug}`;
  const shareTitle = post.title;

  const handleShare = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <>
      <SEO
        title={post.seo?.metaTitle || `${post.title} | SPARK Business Buddy Blog`}
        description={post.seo?.metaDescription || post.excerpt}
        keywords={post.seo?.keywords || post.tags}
        image={post.coverImage}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-8">
          <div className="container mx-auto px-4">
            <Link to="/blog">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>

        <article className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Article Header */}
          <header className="mb-8">
            <Badge variant="secondary" className="mb-4">
              {categoryInfo.icon} {categoryInfo.label}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{post.author.name}</p>
                  {post.author.bio && <p className="text-xs">{post.author.bio}</p>}
                </div>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(post.publishedAt)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readingTime} min read
              </div>
            </div>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="aspect-video rounded-lg overflow-hidden mb-8">
                <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Share Buttons */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-sm text-muted-foreground">Share:</span>
              <Button variant="outline" size="sm" onClick={() => handleShare('facebook')}>
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')}>
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="my-12" />

          {/* Author Bio */}
          <Card className="mb-12">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>About {post.author.name}</CardTitle>
                  {post.author.bio && <CardDescription>{post.author.bio}</CardDescription>}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      {relatedPost.coverImage && (
                        <div className="aspect-video overflow-hidden rounded-t-lg">
                          <img
                            src={relatedPost.coverImage}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <Badge variant="secondary" className="w-fit mb-2">
                          {getCategoryInfo(relatedPost.category).icon} {getCategoryInfo(relatedPost.category).label}
                        </Badge>
                        <CardTitle className="text-base line-clamp-2">{relatedPost.title}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">{relatedPost.excerpt}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <Card className="mt-12 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="text-center">
              <CardTitle>Ready to Start Your Business?</CardTitle>
              <CardDescription>Use SPARK Business Buddy to turn your idea into reality</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Link to="/wizard">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline">
                  View Pricing
                </Button>
              </Link>
            </CardContent>
          </Card>
        </article>
      </div>
    </>
  );
}
