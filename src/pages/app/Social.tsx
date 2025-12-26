/**
 * Social Features Page
 * Share ideas, collaborate, and get community feedback
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Heart, MessageCircle, Users, Send, TrendingUp, Award } from 'lucide-react';

// Sample shared ideas
const sharedIdeas = [
  {
    id: '1',
    title: 'Eco-Friendly Packaging Solutions',
    description: 'Biodegradable packaging for e-commerce businesses',
    author: {
      name: 'Sarah Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    },
    likes: 42,
    comments: 12,
    shares: 8,
    trending: true,
  },
  {
    id: '2',
    title: 'Virtual Fitness Coaching Platform',
    description: 'AI-powered personalized workout plans and nutrition guidance',
    author: {
      name: 'Mike Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    },
    likes: 35,
    comments: 9,
    shares: 5,
    trending: false,
  },
  {
    id: '3',
    title: 'Local Artisan Marketplace',
    description: 'Connect local craftspeople with customers in their area',
    author: {
      name: 'Emily Rodriguez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    },
    likes: 28,
    comments: 15,
    shares: 10,
    trending: true,
  },
];

export default function Social() {
  const [activeTab, setActiveTab] = useState('discover');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Community</h1>
        <p className="text-muted-foreground">Share ideas, collaborate, and get feedback from fellow entrepreneurs</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-shares">My Shares</TabsTrigger>
          <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-4 mt-6">
          <div className="flex gap-4 mb-6">
            <Input placeholder="Search ideas..." className="flex-1" />
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {sharedIdeas.map((idea) => (
              <Card key={idea.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={idea.author.avatar} />
                        <AvatarFallback>{idea.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{idea.author.name}</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                    {idea.trending && <Badge variant="secondary"><TrendingUp className="h-3 w-3 mr-1" />Trending</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">{idea.title}</CardTitle>
                  <CardDescription>{idea.description}</CardDescription>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex gap-4">
                    <Button variant="ghost" size="sm">
                      <Heart className="h-4 w-4 mr-1" />
                      {idea.likes}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {idea.comments}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      {idea.shares}
                    </Button>
                  </div>
                  <Button size="sm">View Details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Shares Tab */}
        <TabsContent value="my-shares" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Share Your Business Idea</CardTitle>
              <CardDescription>Get feedback from the community and find potential collaborators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Idea title" />
              <Textarea placeholder="Describe your business idea..." rows={4} />
              <div className="flex gap-2">
                <Input placeholder="Add tags (e.g., tech, sustainability)" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Share with Community
              </Button>
            </CardFooter>
          </Card>

          <div className="text-center text-muted-foreground py-8">
            <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>You haven't shared any ideas yet.</p>
            <p className="text-sm">Share your first idea to get community feedback!</p>
          </div>
        </TabsContent>

        {/* Collaborations Tab */}
        <TabsContent value="collaborations" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Collaborations
                </CardTitle>
                <CardDescription>Projects you're currently working on with others</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-6">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active collaborations</p>
                  <p className="text-sm">Connect with others to start collaborating</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Collaboration Invites
                </CardTitle>
                <CardDescription>People who want to collaborate with you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-6">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending invites</p>
                  <p className="text-sm">Share your ideas to receive collaboration requests</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader>
              <CardTitle>Why Collaborate?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Share expertise and skills</p>
                  <p className="text-sm text-muted-foreground">Combine strengths with complementary partners</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Accelerate development</p>
                  <p className="text-sm text-muted-foreground">Move faster with collaborative effort</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Get valuable feedback</p>
                  <p className="text-sm text-muted-foreground">Improve your ideas with community insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
