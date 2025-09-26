import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { 
  Code, 
  GitBranch,
  Github, 
  Download, 
  Folder,
  Plus,
  CheckCircle,
  Star,
  Users,
  ExternalLink,
  AlertCircle
} from "lucide-react";

export default function Developers() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [clonePath, setClonePath] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch GitHub projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ["/api/github-projects"],
  });

  // Clone repository mutation
  const cloneRepoMutation = useMutation({
    mutationFn: async ({ url, path }: { url: string; path: string }) => {
      setIsCloning(true);
      const response = await apiRequest("POST", "/api/github/clone", {
        repoUrl: url,
        clonePath: path,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Repository Cloned Successfully! 🎉",
        description: `Repository has been cloned to ${data.path}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/github-projects"] });
      setShowCloneDialog(false);
      setRepoUrl("");
      setClonePath("");
      setIsCloning(false);
    },
    onError: (error: any) => {
      toast({
        title: "Clone Failed",
        description: error.message || "Failed to clone repository. Please check the URL and try again.",
        variant: "destructive",
      });
      setIsCloning(false);
    },
  });

  const handleCloneRepo = () => {
    if (!repoUrl) {
      toast({
        title: "Repository URL Required",
        description: "Please enter a valid GitHub repository URL",
        variant: "destructive",
      });
      return;
    }

    // Extract repo name from URL for default path
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repository';
    const finalPath = clonePath || `./projects/${repoName}`;

    cloneRepoMutation.mutate({
      url: repoUrl,
      path: finalPath,
    });
  };

  // Validate GitHub URL
  const isValidGithubUrl = (url: string) => {
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+\/?(\?.*)?$/;
    return githubPattern.test(url);
  };

  const stats = [
    { label: "Projects Contributed", value: "15", icon: Code },
    { label: "Repositories Cloned", value: "8", icon: Download },
    { label: "Collaborators", value: "42", icon: Users },
    { label: "Stars Earned", value: "127", icon: Star },
  ];

  const featuredProjects = [
    {
      id: 1,
      name: "disaster-relief-tracker",
      description: "Real-time disaster response coordination system",
      url: "https://github.com/lumina-org/disaster-relief-tracker",
      language: "TypeScript",
      stars: 89,
      forks: 23,
      status: "Active"
    },
    {
      id: 2,
      name: "food-distribution-app",
      description: "Mobile app for coordinating food distribution to communities in need",
      url: "https://github.com/lumina-org/food-distribution-app",
      language: "React Native",
      stars: 156,
      forks: 41,
      status: "Active"
    },
    {
      id: 3,
      name: "volunteer-management-system",
      description: "Comprehensive system for managing volunteers and activities",
      url: "https://github.com/lumina-org/volunteer-management-system",
      language: "Python",
      stars: 203,
      forks: 67,
      status: "Seeking Contributors"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-4 lg:p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
            >
              <Code size={16} />
              <span>Tech Volunteers & Developers</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-bold text-foreground"
            >
              Build Technology for Good
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Contribute your coding skills to create impactful solutions for disaster relief, community support, and charitable initiatives.
            </motion.p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>

          {/* Clone Repository Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Github className="w-5 h-5" />
                  <span>Clone GitHub Repository</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Clone GitHub repositories to collaborate on open source projects that support our charitable mission.
                </p>
                
                <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Download className="w-4 h-4 mr-2" />
                      Clone Repository
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Clone GitHub Repository</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Repository URL</label>
                        <Input
                          placeholder="https://github.com/username/repository"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          className={!isValidGithubUrl(repoUrl) && repoUrl ? "border-red-500" : ""}
                        />
                        {repoUrl && !isValidGithubUrl(repoUrl) && (
                          <div className="flex items-center space-x-1 text-red-500 text-sm mt-1">
                            <AlertCircle size={14} />
                            <span>Please enter a valid GitHub URL</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Clone Path (Optional)</label>
                        <Input
                          placeholder="./projects/my-project"
                          value={clonePath}
                          onChange={(e) => setClonePath(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave empty to use default path
                        </p>
                      </div>
                      
                      <Button 
                        onClick={handleCloneRepo} 
                        disabled={!repoUrl || !isValidGithubUrl(repoUrl) || isCloning}
                        className="w-full"
                      >
                        {isCloning ? "Cloning..." : "Clone Repository"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </motion.div>

          {/* Featured Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-foreground">Featured Open Source Projects</h2>
            
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {featuredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Folder className="w-4 h-4" />
                        <span>{project.name}</span>
                      </CardTitle>
                      <Badge variant={project.status === "Active" ? "default" : "secondary"}>
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>{project.language}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Star size={14} />
                        <span>{project.stars}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <GitBranch size={14} />
                        <span>{project.forks}</span>
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setRepoUrl(project.url);
                          setShowCloneDialog(true);
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Clone
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={project.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* How to Contribute */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>How to Get Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</div>
                      <h3 className="font-medium">Clone a Repository</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use our clone tool to download project repositories to your local machine.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</div>
                      <h3 className="font-medium">Set Up Development</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Follow the project's README to install dependencies and set up your development environment.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">3</div>
                      <h3 className="font-medium">Start Contributing</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Look for issues labeled "good first issue" or "help wanted" to begin contributing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>

      <AIChatbot />
    </div>
  );
}