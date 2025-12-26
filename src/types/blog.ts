/**
 * Blog Post Types
 */

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  category: BlogCategory;
  tags: string[];
  coverImage?: string;
  publishedAt: string;
  updatedAt?: string;
  readingTime: number; // in minutes
  featured?: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

export type BlogCategory =
  | 'business-ideas'
  | 'entrepreneurship'
  | 'marketing'
  | 'finance'
  | 'legal'
  | 'guides'
  | 'success-stories'
  | 'news';

export interface BlogCategoryInfo {
  id: BlogCategory;
  label: string;
  description: string;
  icon: string;
}

export const BLOG_CATEGORIES: BlogCategoryInfo[] = [
  {
    id: 'business-ideas',
    label: 'Business Ideas',
    description: 'Innovative business ideas and opportunities',
    icon: '💡',
  },
  {
    id: 'entrepreneurship',
    label: 'Entrepreneurship',
    description: 'Tips and insights for entrepreneurs',
    icon: '🚀',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Marketing strategies and tactics',
    icon: '📈',
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Financial planning and management',
    icon: '💰',
  },
  {
    id: 'legal',
    label: 'Legal',
    description: 'Legal requirements and compliance',
    icon: '⚖️',
  },
  {
    id: 'guides',
    label: 'Guides',
    description: 'Step-by-step guides and tutorials',
    icon: '📚',
  },
  {
    id: 'success-stories',
    label: 'Success Stories',
    description: 'Inspiring entrepreneurship stories',
    icon: '🏆',
  },
  {
    id: 'news',
    label: 'News',
    description: 'Latest business news and updates',
    icon: '📰',
  },
];

export function getCategoryInfo(category: BlogCategory): BlogCategoryInfo {
  return BLOG_CATEGORIES.find((c) => c.id === category) || BLOG_CATEGORIES[0];
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
