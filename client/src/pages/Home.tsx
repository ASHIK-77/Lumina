import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { CategoryGrid } from "@/components/cards/CategoryCard";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { AIChatbot } from "@/components/chat/AIChatbot";

import {
  ChevronDown,
  Heart,
  Users,
  Building,
  Store,
  Hospital,
  Leaf,
  Shirt,
  Calendar,
  Home as HomeIcon,
  AlertTriangle,
  Code,
} from "lucide-react";

// ✅ Category data added back
const categoryData = [
  {
    key: "donors",
    title: "Donors",
    description:
      "Make monetary donations with secure payments. Track your impact and see exactly how your contributions help communities in need.",
    icon: Heart,
    color: "bg-primary/10 text-primary",
    stats: "2.1K Active Donors",
    actionText: "Join Now",
    href: "/donors",
    imageUrl:
      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=600&q=300",
  },
  {
    key: "volunteers",
    title: "Volunteers",
    description:
      "Offer your time and skills to help local communities. Schedule activities, coordinate with teams, and make a hands-on difference.",
    icon: Users,
    color: "bg-accent/10 text-accent",
    actionText: "Volunteer Today",
    href: "/volunteers",
    imageUrl:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=400",
    nextEvent: {
      title: "Food Distribution - Tomorrow 2:00 PM",
      time: "Tomorrow 2:00 PM",
    },
  },
  {
    key: "ngos",
    title: "NGOs & Orphanages",
    description:
      "Connect with donors and volunteers. Post needs, coordinate resources, and amplify your mission's reach.",
    icon: Building,
    color: "bg-primary/10 text-primary",
    stats: "150+ Organizations",
    actionText: "Register",
    href: "/ngos",
    imageUrl:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=250",
  },
  {
    key: "businesses",
    title: "Business Partners",
    description:
      "Supermarkets, hotels, and restaurants can donate surplus food and resources. Reduce waste while feeding communities.",
    icon: Store,
    color: "bg-accent/10 text-accent",
    actionText: "Partner With Us",
    href: "/businesses",
    imageUrl:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=350",
    tags: ["Real-time expiry tracking"],
  },
  {
    key: "medical",
    title: "Healthcare Providers",
    description:
      "Medical facilities can offer free healthcare services, donate medical supplies, and coordinate emergency response.",
    icon: Hospital,
    color: "bg-primary/10 text-primary",
    actionText: "Join Network",
    href: "/medical",
    imageUrl:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=600&q=300",
    tags: ["Emergency Care", "Medical Supplies"],
  },
  {
    key: "disaster",
    title: "Disaster Relief",
    description:
      "Coordinate emergency response during natural disasters. Quick mobilization of resources and volunteers when it matters most.",
    icon: AlertTriangle,
    color: "bg-destructive/10 text-destructive",
    actionText: "Emergency Response",
    href: "/disaster",
    imageUrl:
      "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?auto=format&fit=crop&w=600&q=400",
    tags: ["Active Relief Efforts: 3"],
  },
  {
    key: "developers",
    title: "Tech Volunteers & Developers",
    description:
      "Contribute your coding skills to build technology solutions for disaster relief, community support, and charitable initiatives. Clone GitHub repositories and collaborate on open source projects.",
    icon: Code,
    color: "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    actionText: "Start Coding",
    href: "/developers",
    imageUrl:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=400",
    tags: ["Open Source", "GitHub Integration"],
  },
];

// 🎨 Font: Add Outfit or Poppins via index.html <link>
// Example: <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">

// 🔄 Hero background images
<div className="relative bg-green-50 min-h-[400px] flex flex-col justify-center items-center overflow-hidden p-8"></div>
const heroImages = [
  "https://i.pinimg.com/736x/8e/1c/c5/8e1cc5f8793af07729cff5cf2d2a2f41.jpg",
  "https://i.pinimg.com/736x/a8/da/44/a8da447c5cea0c0e9c30c6308795a2cf.jpg",
  "https://i.pinimg.com/736x/b1/ab/66/b1ab66313ba7016a14043ddf028882fc.jpg",
];

// 🔄 Rotating hero headline words
const headlineWords = ["𝙏𝙝𝙚 𝙝𝙚𝙖𝙧𝙩 𝙩𝙝𝙖𝙩 𝙜𝙞𝙫𝙚𝙨, 𝙜𝙖𝙩𝙝𝙚𝙧𝙨.","𝘽𝙚 𝙖 𝙧𝙖𝙞𝙣𝙗𝙤𝙬 𝙞𝙣 𝙨𝙤𝙢𝙚𝙤𝙣𝙚 𝙚𝙡𝙨𝙚’𝙨 𝙘𝙡𝙤𝙪𝙙.","𝙂𝙚𝙣𝙚𝙧𝙤𝙨𝙞𝙩𝙮 𝙞𝙨 𝙩𝙝𝙚 𝙥𝙤𝙚𝙩𝙧𝙮 𝙤𝙛 𝙡𝙞𝙛𝙚." ];

export default function Home() {
  const [imageIndex, setImageIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);

  // Background carousel
  useEffect(() => {
    const interval = setInterval(
      () => setImageIndex((prev) => (prev + 1) % heroImages.length),
      6000
    );
    return () => clearInterval(interval);
  }, []);

  // Headline words animation
  useEffect(() => {
    const interval = setInterval(
      () => setWordIndex((prev) => (prev + 1) % headlineWords.length),
      2500
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background font-[Outfit]">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background images with crossfade */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence>
            <motion.img
              key={imageIndex}
              src={heroImages[imageIndex]}
              alt="Hero background"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </div>

        {/* Center content */}
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.h1
            className="text-6xl md:text-7xl font-bold text-white leading-tight tracking-tight drop-shadow-lg"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="block"
              >
                {headlineWords[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </motion.h1>

          <motion.p
            className="mt-6 text-xl md:text-2xl text-white/90 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            A community-driven platform where donors, volunteers, and
            organizations unite to make a real difference.
          </motion.p>

          

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all"
              >
                Get Started
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-white/80 text-white backdrop-blur-md bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl hover:bg-white hover:text-black transition-all"
            >
              Learn More
            </Button>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="text-white drop-shadow" size={36} />
        </motion.div>
      </section>

      {/* Category Cards Section */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How You Can Help
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your path to making a difference. Every contribution
              matters, every action counts.
            </p>
          </motion.div>

          <CategoryGrid categories={categoryData} />
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-20 bg-secondary">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">Find Help Near You</h2>
            <p className="text-xl text-muted-foreground">
              See live requests and donations happening in your community
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <InteractiveMap />
          </motion.div>
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">Live Activity Feed</h2>
            <p className="text-xl text-muted-foreground">
              Real-time updates from our community
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <ActivityFeed limit={5} />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Heart className="text-primary-foreground" size={16} />
                </div>
                <span className="text-xl font-bold text-primary">Lumina</span>
              </div>
              <p className="text-muted-foreground">
                Connecting communities through compassion and creating
                meaningful impact together.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Safety
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Trust & Safety
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Success Stories
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Events
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 Lumina. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <i className="fab fa-facebook"></i>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
}
