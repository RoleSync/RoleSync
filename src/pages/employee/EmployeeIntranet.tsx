import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Globe, Send, Image as ImageIcon, Award, ThumbsUp, MessageSquare, 
  MoreVertical, Cake, Sparkles, PartyPopper, Calendar as CalendarIcon, 
  Heart, Smile, Share2, CheckCircle2, User, ChevronDown, Trophy, 
  HelpCircle, Megaphone, Flame, Paperclip, Pin
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PostComment {
  id: string;
  author_name: string;
  author_role: string;
  created_at: string;
  content: string;
}

interface FeedPost {
  id: string;
  author_name: string;
  author_role: string;
  author_dept: string;
  created_at: string;
  content: string;
  badge?: {
    type: string;
    recipient_name: string;
    recipient_role: string;
    title: string;
    icon: string;
  };
  likes: number;
  liked_by_me: boolean;
  comments: PostComment[];
  pinned?: boolean;
}

export default function EmployeeIntranet() {
  const { user } = useAuth();

  // Social Feed State
  const [postText, setPostText] = useState('');
  const [postingAs, setPostingAs] = useState('myself');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Right Widget Tab State: 'birthdays' | 'anniversaries'
  const [rightTab, setRightTab] = useState<'birthdays' | 'anniversaries'>('birthdays');

  // Badge Dialog State
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [badgeRecipient, setBadgeRecipient] = useState('Vamshika Jadav');
  const [badgeRecipientRole, setBadgeRecipientRole] = useState('Talent Acquisition Specialist · Human Resource');
  const [badgeType, setBadgeType] = useState('Applause');
  const [badgeNote, setBadgeNote] = useState('');

  // Feed Posts Data with local storage persistence
  const [posts, setPosts] = useState<FeedPost[]>(() => {
    const saved = localStorage.getItem('rolesync_intranet_posts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'post-1',
        author_name: 'Harsha Bachani',
        author_role: 'Team Lead · Human Resource',
        author_dept: 'Bengaluru',
        created_at: 'Today at 10:30 AM',
        content: `Hi All,\n\nJust a quick reminder that our Referral Drive is ongoing. This is a fantastic opportunity to help grow our team with talented individuals and earn referral rewards of up to ₹50,000.\n\n⭐ ₹3,000 – 1st referral\n⭐ ₹4,000 – 2nd referral\n⭐ ₹5,000 – 3rd & onwards\n\nTo refer, simply fill out the Google Form (https://forms.office.com/r/TNw9Adhsje). For more details, please check the poster attached on the notice board.\n\nLet's continue to build a stronger team together!`,
        likes: 12,
        liked_by_me: true,
        comments: [
          {
            id: 'c-1',
            author_name: 'Anil Dhakar',
            author_role: 'Frontend Developer Intern',
            created_at: '11:15 AM',
            content: 'Great initiative! Just referred two candidates for the React & Python roles.'
          }
        ]
      },
      {
        id: 'post-2',
        author_name: 'Harsha Bachani',
        author_role: 'Team Lead · Human Resource',
        author_dept: 'Bengaluru',
        created_at: 'Yesterday at 04:15 PM',
        content: `Walk-In Drive — September 20th!\nKnow someone looking for a great opportunity? Bring them in!\n\nWe're hosting a Walk-In Drive on September 20th and this is your chance to help a friend land a great role and walk away with an offer on the same day!\n\nWhat to do:\n• Spread the word\n• Encourage friends/family to bring an updated resume\n• Walk in, interview and go home with an offer!\n\nLet's help great talent find a great opportunity.`,
        likes: 8,
        liked_by_me: false,
        comments: []
      },
      {
        id: 'post-3',
        author_name: 'Bhaskar B S',
        author_role: 'Senior Manager · Human Resources',
        author_dept: 'Bengaluru',
        created_at: '2 days ago',
        content: `Congratulations on your first selection! 🎉 That's a great milestone—well done! Keep up the good work and continue building on this momentum.`,
        badge: {
          type: 'Applause',
          recipient_name: 'Vamshika Jadav',
          recipient_role: 'Talent Acquisition Specialist · Human Resource · Bengaluru',
          title: 'Applause',
          icon: '👏'
        },
        likes: 15,
        liked_by_me: true,
        comments: [
          {
            id: 'c-2',
            author_name: 'Vamshika Jadav',
            author_role: 'Talent Acquisition Specialist',
            created_at: 'Yesterday',
            content: 'Thank you so much Bhaskar! Excited to contribute more to the team! ✨'
          }
        ]
      },
      {
        id: 'post-4',
        author_name: 'Mahesh T',
        author_role: 'Senior Talent Acquisition Specialist',
        author_dept: 'Bengaluru',
        created_at: '3 days ago',
        content: `CPL Draft Night — Join the action! Feel the thrill. Watch the teams take shape in real-time.\n\n📍 Venue: UV - 5th floor\n📅 Date: 24th September 2026\n⏰ Time: 7:30 PM sharp\n\nThis isn't just an auction. This is the CPL Draft Night. And it's going to be LEGENDARY.\n\nLet the bidding begin! 🔥🏏`,
        likes: 19,
        liked_by_me: true,
        comments: []
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('rolesync_intranet_posts', JSON.stringify(posts));
  }, [posts]);

  // Handle Publish Post
  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) {
      toast.error('Please write something to post.');
      return;
    }

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      author_name: user?.name || 'Anil Dhakar',
      author_role: user?.role === 'employee' ? 'Frontend Developer Intern · Product Engineering' : 'Staff Software Engineer',
      author_dept: 'Bengaluru',
      created_at: 'Just now',
      content: postText.trim(),
      likes: 0,
      liked_by_me: false,
      comments: []
    };

    setPosts(prev => [newPost, ...prev]);
    setPostText('');
    toast.success('Post published to Intranet wall!');
  };

  // Handle Give Badge & Post
  const handleGiveBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeNote.trim()) {
      toast.error('Please write an appreciation note.');
      return;
    }

    const badgeIconMap: Record<string, string> = {
      'Applause': '👏',
      'Star Performer': '⭐',
      'Superstar': '🚀',
      'Innovator': '💡',
      'Team Player': '🤝',
      'MVP': '👑'
    };

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      author_name: user?.name || 'Anil Dhakar',
      author_role: user?.role === 'employee' ? 'Frontend Developer Intern · Product Engineering' : 'Staff Software Engineer',
      author_dept: 'Bengaluru',
      created_at: 'Just now',
      content: badgeNote.trim(),
      badge: {
        type: badgeType,
        recipient_name: badgeRecipient,
        recipient_role: badgeRecipientRole,
        title: badgeType,
        icon: badgeIconMap[badgeType] || '👏'
      },
      likes: 1,
      liked_by_me: true,
      comments: []
    };

    setPosts(prev => [newPost, ...prev]);
    setBadgeDialogOpen(false);
    setBadgeNote('');
    toast.success(`Awarded ${badgeType} badge to ${badgeRecipient}! 🏆`);
  };

  // Handle Like Post
  const handleToggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const liked = !p.liked_by_me;
        return {
          ...p,
          liked_by_me: liked,
          likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1)
        };
      }
      return p;
    }));
  };

  // Handle Add Comment
  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment: PostComment = {
      id: `c-${Date.now()}`,
      author_name: user?.name || 'Anil Dhakar',
      author_role: user?.role === 'employee' ? 'Frontend Developer Intern' : 'Staff Engineer',
      created_at: 'Just now',
      content: text
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    toast.success('Comment added!');
  };

  // Birthday Wish Action
  const handleWishBirthday = (personName: string) => {
    toast.success(`Birthday greeting & confetti sent to ${personName}! 🎂🎉`, {
      description: "Automated greeting posted to team announcements."
    });
  };

  // Anniversary Wish Action
  const handleWishAnniversary = (personName: string, years: number) => {
    toast.success(`Congratulations sent to ${personName} for completing ${years} years! 🏆✨`, {
      description: "Work anniversary celebration note sent."
    });
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Top Header & Sub-Navigation (Wall tab) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Intranet</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Internal company social wall, official broadcasts, badge recognition, and team celebrations
          </p>
        </div>
      </div>

      {/* Sub-tab Pill: Wall (Matching screenshot) */}
      <div className="flex items-center justify-center border-b border-border/70 pb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm border border-primary/20 shadow-sm">
          <Globe className="h-4 w-4" />
          <span>Wall</span>
          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded-full font-extrabold">
            Live
          </span>
        </div>
      </div>

      {/* ─── Two-Column Layout Grid (Left: Feed & Composer, Right: Celebrations Widget) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─── Left Column (8 cols): Composer & Social Feed ─── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Post Composer Card (Matching screenshot) */}
          <Card className="p-4 sm:p-5 border-border/70 shadow-sm bg-card">
            <form onSubmit={handlePublishPost} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Share an update</span>
                <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
                  Posting as Myself ▾
                </span>
              </div>

              <Textarea 
                placeholder="What's on your mind?"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                rows={3}
                className="resize-none border-border/60 bg-background text-xs sm:text-sm focus-visible:ring-primary placeholder:text-muted-foreground/60"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toast.info("Image/Video upload ready. Select files to attach.")}
                    className="h-8 text-xs font-medium gap-1.5 border-border/80 hover:border-primary/40"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-indigo-500" />
                    Photo/Video
                  </Button>

                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setBadgeDialogOpen(true)}
                    className="h-8 text-xs font-medium gap-1.5 border-border/80 hover:border-amber-500/40 text-amber-600 dark:text-amber-500"
                  >
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                    Give A Badge
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  size="sm" 
                  className="h-8 px-5 text-xs font-semibold bg-gradient-to-r from-primary to-indigo-600 gap-1.5 shadow-sm"
                >
                  Post <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </Card>

          {/* Feed Posts Stream */}
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="p-5 border-border/70 shadow-sm bg-card hover:border-primary/30 transition-colors">
                
                {/* Post Author Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm">
                      {post.author_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        {post.author_name}
                        {post.pinned && <Pin className="h-3 w-3 text-amber-500 fill-current" />}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {post.author_role} · {post.author_dept} · <span className="font-medium">{post.created_at}</span>
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Post link copied!"); }} className="text-xs gap-2">
                        <Share2 className="h-3.5 w-3.5" /> Copy Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Post Content Body */}
                <div className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line mb-4 font-normal">
                  {post.content}
                </div>

                {/* Badge Embed Card (If this post is a peer recognition award) */}
                {post.badge && (
                  <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center text-3xl shadow-inner shrink-0">
                      {post.badge.icon}
                    </div>
                    <div className="space-y-1 text-center sm:text-left flex-1">
                      <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40 text-[10px] uppercase tracking-wider font-extrabold">
                        {post.badge.title} Award
                      </Badge>
                      <h5 className="font-bold text-foreground text-sm mt-0.5">{post.badge.recipient_name}</h5>
                      <p className="text-[11px] text-muted-foreground">{post.badge.recipient_role}</p>
                    </div>
                  </div>
                )}

                {/* Engagement Bar: Like & Comment Counters */}
                <div className="flex items-center justify-between py-2 border-y border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                      👍
                    </span>
                    <span className="font-semibold text-foreground">{post.likes}</span>
                  </div>

                  <span className="font-medium">
                    {post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}
                  </span>
                </div>

                {/* Action Buttons: Like & Comment Trigger */}
                <div className="flex items-center gap-3 pt-2 pb-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleToggleLike(post.id)}
                    className={`h-8 px-3 text-xs font-semibold gap-1.5 ${
                      post.liked_by_me ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ThumbsUp className={`h-3.5 w-3.5 ${post.liked_by_me ? 'fill-current text-primary' : ''}`} />
                    Like
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const input = document.getElementById(`comment-input-${post.id}`);
                      input?.focus();
                    }}
                    className="h-8 px-3 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Comment
                  </Button>
                </div>

                {/* Comments List */}
                {post.comments.length > 0 && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-border/40">
                    {post.comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/40 text-xs">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] shrink-0">
                          {c.author_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{c.author_name}</span>
                            <span className="text-[10px] text-muted-foreground">{c.created_at}</span>
                          </div>
                          <p className="text-muted-foreground mt-0.5 leading-relaxed">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Comment Input Box */}
                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/30">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <Input 
                    id={`comment-input-${post.id}`}
                    placeholder="Write a comment…"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                    className="h-8 text-xs bg-muted/20 border-border/60"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleAddComment(post.id)}
                    className="h-8 px-2.5 bg-primary text-primary-foreground"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>

              </Card>
            ))}
          </div>

        </div>

        {/* ─── Right Column (4 cols): Celebrations & Anniversaries Widget (Matching screenshot) ─── */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 border-border/70 shadow-sm bg-card">
            
            {/* Widget Header Tabs: BIRTHDAY(S) (1) vs WORK ANNIVERSARIES (1) */}
            <div className="flex items-center justify-between border-b border-border/70 pb-3 mb-4">
              <button
                onClick={() => setRightTab('birthdays')}
                className={`text-xs font-bold uppercase tracking-wider transition-all pb-1 ${
                  rightTab === 'birthdays'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                BIRTHDAY(S) (1)
              </button>

              <button
                onClick={() => setRightTab('anniversaries')}
                className={`text-xs font-bold uppercase tracking-wider transition-all pb-1 ${
                  rightTab === 'anniversaries'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                WORK ANNIVERSARIES (1)
              </button>
            </div>

            {/* TAB: BIRTHDAYS */}
            {rightTab === 'birthdays' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Date indicator */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary bg-primary/5 py-1.5 rounded-lg border border-primary/10">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>16-Sep-2026</span>
                </div>

                {/* Featured Birthday Hero Card */}
                <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-gradient-to-b from-primary/5 via-background to-accent/20 border border-border/70 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-xl animate-bounce">
                    🎂
                  </div>

                  <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center font-bold text-xl text-primary mb-3 shadow-sm">
                    ST
                  </div>

                  <h4 className="font-heading font-extrabold text-base text-foreground">Somnath Tiwary</h4>
                  <p className="text-xs text-muted-foreground font-medium">Senior Manager</p>
                  <p className="text-[11px] text-muted-foreground">Growth & Marketing · Bengaluru</p>

                  <Button 
                    onClick={() => handleWishBirthday('Somnath Tiwary')}
                    className="mt-4 w-full h-9 rounded-full bg-gradient-to-r from-primary to-indigo-600 font-semibold text-xs gap-1.5 shadow-md shadow-primary/20"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Wish Happy Birthday
                  </Button>
                </div>

                {/* Upcoming Birthdays Strip */}
                <div className="pt-2 border-t border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                    Upcoming Birthday(s)
                  </span>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-muted/30 border border-border/40">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-1 text-xs font-bold">
                        AY
                      </div>
                      <p className="font-semibold text-[11px] text-foreground truncate">Amit Kumar</p>
                      <p className="text-[9px] text-muted-foreground font-mono">21-Sep</p>
                    </div>

                    <div className="p-2 rounded-xl bg-muted/30 border border-border/40">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-1 text-xs font-bold">
                        SK
                      </div>
                      <p className="font-semibold text-[11px] text-foreground truncate">Sankalp K</p>
                      <p className="text-[9px] text-muted-foreground font-mono">22-Sep</p>
                    </div>

                    <div className="p-2 rounded-xl bg-muted/30 border border-border/40">
                      <div className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-1 text-xs font-bold">
                        SK
                      </div>
                      <p className="font-semibold text-[11px] text-foreground truncate">Srashti K</p>
                      <p className="text-[9px] text-muted-foreground font-mono">26-Sep</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: WORK ANNIVERSARIES */}
            {rightTab === 'anniversaries' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Date indicator */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/5 py-1.5 rounded-lg border border-amber-500/10">
                  <Trophy className="h-3.5 w-3.5" />
                  <span>16-Sep-2026 Milestone</span>
                </div>

                {/* Featured Anniversary Hero Card */}
                <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-gradient-to-b from-amber-500/5 via-background to-accent/20 border border-border/70 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-xl animate-bounce">
                    🏆
                  </div>

                  <div className="h-16 w-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center font-bold text-xl text-amber-600 mb-3 shadow-sm">
                    PS
                  </div>

                  <h4 className="font-heading font-extrabold text-base text-foreground">Priya Sharma</h4>
                  <p className="text-xs text-muted-foreground font-medium">Head of Human Resources</p>
                  <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] uppercase font-bold mt-1">
                    3 Years at RoleSync
                  </Badge>

                  <Button 
                    onClick={() => handleWishAnniversary('Priya Sharma', 3)}
                    className="mt-4 w-full h-9 rounded-full bg-gradient-to-r from-amber-500 to-primary text-white font-semibold text-xs gap-1.5 shadow-md"
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    Congratulate Milestone
                  </Button>
                </div>

                {/* Upcoming Anniversaries Strip */}
                <div className="pt-2 border-t border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                    Upcoming Anniversaries
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                      <p className="font-semibold text-xs text-foreground">Ananya Singh</p>
                      <p className="text-[10px] text-amber-500 font-bold">2 Years · 24-Sep</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                      <p className="font-semibold text-xs text-foreground">Rajesh Kumar</p>
                      <p className="text-[10px] text-amber-500 font-bold">4 Years · 29-Sep</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </Card>
        </div>

      </div>

      {/* ─── Give Badge Modal Dialog ─── */}
      <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Award a Peer Recognition Badge
            </DialogTitle>
            <DialogDescription>
              Publicly recognize a teammate's contribution on the company Intranet wall.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGiveBadge} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Teammate to Recognize</Label>
              <Input 
                required 
                placeholder="Teammate Name (e.g. Vamshika Jadav)" 
                value={badgeRecipient} 
                onChange={e => setBadgeRecipient(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Role & Department</Label>
              <Input 
                placeholder="e.g. Talent Acquisition Specialist · HR" 
                value={badgeRecipientRole} 
                onChange={e => setBadgeRecipientRole(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Badge Category</Label>
              <Select value={badgeType} onValueChange={setBadgeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Applause">👏 Applause (Great job & dedication)</SelectItem>
                  <SelectItem value="Star Performer">⭐ Star Performer (High impact results)</SelectItem>
                  <SelectItem value="Superstar">🚀 Superstar (Out of this world execution)</SelectItem>
                  <SelectItem value="Innovator">💡 Innovator (Creative problem solver)</SelectItem>
                  <SelectItem value="Team Player">🤝 Team Player (Outstanding collaboration)</SelectItem>
                  <SelectItem value="MVP">👑 MVP (Most valuable player)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Recognition Message</Label>
              <Textarea 
                required 
                rows={3} 
                placeholder="Share specific details of why they deserve this recognition…" 
                value={badgeNote} 
                onChange={e => setBadgeNote(e.target.value)} 
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setBadgeDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-amber-500 to-primary text-white">
                Award Badge & Post to Wall
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
