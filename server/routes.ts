import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertDonationSchema, insertRequestSchema, insertActivitySchema, insertVolunteerRegistrationSchema, insertPaymentSchema, insertOrganizationSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import { generateSmartMatches, chatWithAI, analyzeImage, generateDonationSuggestions } from "./services/openai";
import { supabaseStorage, realtimeService } from "../client/supabase";
import { razorpayService } from "./services/razorpay";
import { twilioService } from "./services/twilio";

const JWT_SECRET = process.env.SESSION_SECRET || 'dev-secret-key';
const upload = multer({ storage: multer.memoryStorage() });

// Authentication middleware
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      res.status(201).json({ user: userResponse, token });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      const { password: _, ...userResponse } = user;
      
      res.json({ user: userResponse, token });
    } catch (error) {
      res.status(400).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: any, res) => {
    const { password, ...userResponse } = req.user;
    res.json({ user: userResponse });
  });

  // Organization routes
  app.post("/api/organizations", authenticate, async (req: any, res) => {
    try {
      const orgData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization({
        ...orgData,
        userId: req.user.id,
      });
      res.status(201).json(organization);
    } catch (error) {
      res.status(400).json({ message: "Failed to create organization" });
    }
  });

  app.get("/api/organizations/my", authenticate, async (req: any, res) => {
    try {
      const organization = await storage.getOrganizationByUserId(req.user.id);
      res.json(organization);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Donation routes
  app.post("/api/donations", authenticate, upload.array('images', 5), async (req: any, res) => {
    try {
      const donationData = insertDonationSchema.parse(req.body);
      
      // Handle image uploads
      const imageUrls: string[] = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileName = `donations/${Date.now()}-${file.originalname}`;
          const imageUrl = await supabaseStorage.uploadFile(file.buffer, fileName, file.mimetype);
          imageUrls.push(imageUrl);
        }
      }

      const donation = await storage.createDonation({
        ...donationData,
        donorId: req.user.id,
        images: imageUrls,
      });

      // Generate smart matches
      const matches = await generateSmartMatches(req.user, [donation]);
      for (const match of matches) {
        await storage.createMatch({
          donationId: donation.id,
          userId: req.user.id,
          score: match.score.toString(),
          reason: match.reason,
          status: "pending",
        });
      }

      // Send SMS notification if phone provided
      if (req.user.phone && donationData.amount) {
        await twilioService.sendDonationAlert(
          req.user.phone,
          donation.title,
          `₹${donationData.amount}`
        );
      }

      // Broadcast real-time update
      realtimeService.broadcastActivity({
        type: 'donation',
        donation,
        user: { name: req.user.name, avatar: req.user.avatar },
      });

      res.status(201).json(donation);
    } catch (error) {
      console.error('Donation creation error:', error);
      res.status(400).json({ message: "Failed to create donation" });
    }
  });

  app.get("/api/donations", async (req, res) => {
    try {
      const filters = {
        type: req.query.type as string,
        location: req.query.lat && req.query.lng ? {
          lat: parseFloat(req.query.lat as string),
          lng: parseFloat(req.query.lng as string),
          radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
        } : undefined,
      };

      const donations = await storage.getDonations(filters);
      res.json(donations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });

  app.get("/api/donations/:id", async (req, res) => {
    try {
      const donation = await storage.getDonation(req.params.id);
      if (!donation) {
        return res.status(404).json({ message: "Donation not found" });
      }
      res.json(donation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch donation" });
    }
  });

  // Request routes
  app.post("/api/requests", authenticate, upload.array('images', 5), async (req: any, res) => {
    try {
      const requestData = insertRequestSchema.parse(req.body);
      
      // Handle image uploads
      const imageUrls: string[] = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileName = `requests/${Date.now()}-${file.originalname}`;
          const imageUrl = await supabaseStorage.uploadFile(file.buffer, fileName, file.mimetype);
          imageUrls.push(imageUrl);
        }
      }

      const request = await storage.createRequest({
        ...requestData,
        requesterId: req.user.id,
        images: imageUrls,
      });

      // Generate smart matches
      const matches = await generateSmartMatches(req.user, [request]);
      for (const match of matches) {
        await storage.createMatch({
          requestId: request.id,
          userId: req.user.id,
          score: match.score.toString(),
          reason: match.reason,
          status: "pending",
        });
      }

      // Broadcast real-time update
      realtimeService.broadcastActivity({
        type: 'request',
        request,
        user: { name: req.user.name, avatar: req.user.avatar },
      });

      res.status(201).json(request);
    } catch (error) {
      console.error('Request creation error:', error);
      res.status(400).json({ message: "Failed to create request" });
    }
  });

  app.get("/api/requests", async (req, res) => {
    try {
      const filters = {
        type: req.query.type as string,
        urgency: req.query.urgency as string,
        location: req.query.lat && req.query.lng ? {
          lat: parseFloat(req.query.lat as string),
          lng: parseFloat(req.query.lng as string),
          radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
        } : undefined,
      };

      const requests = await storage.getRequests(filters);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  // Activity routes (volunteer opportunities)
  app.post("/api/activities", authenticate, async (req: any, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity({
        ...activityData,
        organizerId: req.user.id,
      });

      // Broadcast real-time update
      realtimeService.broadcastActivity({
        type: 'volunteer',
        activity,
        user: { name: req.user.name, avatar: req.user.avatar },
      });

      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ message: "Failed to create activity" });
    }
  });

  app.get("/api/activities", async (req, res) => {
    try {
      const filters = {
        location: req.query.lat && req.query.lng ? {
          lat: parseFloat(req.query.lat as string),
          lng: parseFloat(req.query.lng as string),
          radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
        } : undefined,
      };

      const activities = await storage.getActivities(filters);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities/:id/register", authenticate, async (req: any, res) => {
    try {
      const registrationData = insertVolunteerRegistrationSchema.parse({
        ...req.body,
        activityId: req.params.id,
      });

      const registration = await storage.createVolunteerRegistration({
        ...registrationData,
        volunteerId: req.user.id,
      });

      // Update activity volunteer count
      const activity = await storage.getActivity(req.params.id);
      if (activity) {
        await storage.updateActivity(req.params.id, {
          currentVolunteers: activity.currentVolunteers + 1,
        });

        // Send reminder SMS
        if (req.user.phone) {
          await twilioService.sendVolunteerReminder(
            req.user.phone,
            activity.title,
            activity.startTime.toLocaleString(),
            activity.location.address
          );
        }
      }

      res.status(201).json(registration);
    } catch (error) {
      res.status(400).json({ message: "Failed to register for activity" });
    }
  });

  // Matches routes
  app.get("/api/matches", authenticate, async (req: any, res) => {
    try {
      const matches = await storage.getMatches(req.user.id);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Activity feed routes
  app.get("/api/activity-feed", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const feed = await storage.getActivityFeed(limit);
      res.json(feed);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity feed" });
    }
  });

  // Payment routes
  app.post("/api/payments/create-order", authenticate, async (req: any, res) => {
    try {
      const { amount, donationId, requestId } = req.body;
      
      const order = await razorpayService.createOrder({
        amount: amount * 100, // Convert to paise
        receipt: `donation_${Date.now()}`,
        notes: {
          userId: req.user.id,
          donationId: donationId || '',
          requestId: requestId || '',
        },
      });

      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to create payment order" });
    }
  });

  app.post("/api/payments/verify", authenticate, async (req: any, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, recipientId, donationId, requestId } = req.body;
      
      const isValid = razorpayService.verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!isValid) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      // Save payment record
      const payment = await storage.createPayment({
        payerId: req.user.id,
        recipientId,
        donationId,
        requestId,
        amount: amount.toString(),
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        status: 'completed',
      });

      // Update request if applicable
      if (requestId) {
        const request = await storage.getRequest(requestId);
        if (request) {
          const newRaisedAmount = parseFloat(request.raisedAmount) + amount;
          await storage.updateRequest(requestId, {
            raisedAmount: newRaisedAmount.toString(),
          });

          // Check if target reached
          if (request.targetAmount && newRaisedAmount >= parseFloat(request.targetAmount)) {
            await storage.updateRequest(requestId, { status: 'completed' });
            
            // Notify requester
            const requester = await storage.getUser(request.requesterId);
            if (requester?.phone) {
              await twilioService.sendRequestFulfilled(
                requester.phone,
                request.title,
                req.user.name
              );
            }
          }
        }
      }

      res.json({ payment, verified: true });
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(400).json({ message: "Payment verification failed" });
    }
  });

  // AI Chat routes
  app.post("/api/chat", authenticate, async (req: any, res) => {
    try {
      const { message } = req.body;
      const response = await chatWithAI(message, req.user);
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Chat service temporarily unavailable" });
    }
  });

  // Image analysis route
  app.post("/api/analyze-image", authenticate, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image provided" });
      }

      const base64Image = req.file.buffer.toString('base64');
      const analysis = await analyzeImage(base64Image);
      
      res.json({ analysis });
    } catch (error) {
      res.status(500).json({ message: "Image analysis failed" });
    }
  });

  // Donation suggestions route
  app.get("/api/suggestions", authenticate, async (req: any, res) => {
    try {
      const suggestions = await generateDonationSuggestions(req.user.userType, req.user.location);
      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticate, async (req: any, res) => {
    try {
      const notifications = await storage.getNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", authenticate, async (req: any, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Emergency routes
  app.post("/api/emergency/alert", authenticate, async (req: any, res) => {
    try {
      const { alertType, location, instructions } = req.body;
      
      // Create emergency request
      const emergencyRequest = await storage.createRequest({
        requesterId: req.user.id,
        type: 'other',
        title: `EMERGENCY: ${alertType}`,
        description: instructions,
        urgency: 'emergency',
        location,
      });

      // Send emergency SMS to nearby users (mock implementation)
      if (req.user.phone) {
        await twilioService.sendEmergencyAlert(
          req.user.phone,
          alertType,
          location.address,
          instructions
        );
      }

      // Broadcast emergency alert
      realtimeService.broadcastActivity({
        type: 'emergency',
        request: emergencyRequest,
        user: { name: req.user.name, avatar: req.user.avatar },
      });

      res.status(201).json(emergencyRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to send emergency alert" });
    }
  });

  // GitHub routes
  app.post("/api/github/clone", authenticate, async (req: any, res) => {
    try {
      const { repoUrl, clonePath } = req.body;

      if (!repoUrl) {
        return res.status(400).json({ message: "Repository URL is required" });
      }

      // Validate GitHub URL
      const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+\/?(\?.*)?$/;
      if (!githubPattern.test(repoUrl)) {
        return res.status(400).json({ message: "Invalid GitHub repository URL" });
      }

      // Extract repo name for default path
      const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repository';
      const finalPath = clonePath || `./projects/${repoName}`;

      // Import child_process dynamically
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      try {
        // Execute git clone command
        const command = `git clone "${repoUrl}" "${finalPath}"`;
        const { stdout, stderr } = await execAsync(command);

        // Log the clone operation (in a real app, you might want to store this in a database)
        console.log(`Repository cloned by user ${req.user.id}: ${repoUrl} -> ${finalPath}`);

        res.status(201).json({
          message: "Repository cloned successfully",
          path: finalPath,
          repoUrl,
          output: stdout,
          timestamp: new Date().toISOString()
        });
      } catch (gitError: any) {
        console.error('Git clone error:', gitError);
        
        // Handle common git errors
        let errorMessage = "Failed to clone repository";
        if (gitError.message.includes("not found")) {
          errorMessage = "Repository not found or access denied";
        } else if (gitError.message.includes("already exists")) {
          errorMessage = "Directory already exists";
        } else if (gitError.message.includes("permission denied")) {
          errorMessage = "Permission denied";
        }

        res.status(400).json({ 
          message: errorMessage,
          details: gitError.message
        });
      }
    } catch (error) {
      console.error('Clone operation error:', error);
      res.status(500).json({ message: "Failed to clone repository" });
    }
  });

  // Get GitHub projects (mock data for now)
  app.get("/api/github-projects", authenticate, async (req: any, res) => {
    try {
      // In a real implementation, this would fetch from a database or GitHub API
      const mockProjects = [
        {
          id: 1,
          name: "disaster-relief-tracker",
          description: "Real-time disaster response coordination system",
          url: "https://github.com/lumina-org/disaster-relief-tracker",
          language: "TypeScript",
          stars: 89,
          forks: 23,
          status: "Active",
          userId: req.user.id,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "food-distribution-app",
          description: "Mobile app for coordinating food distribution to communities in need",
          url: "https://github.com/lumina-org/food-distribution-app",
          language: "React Native",
          stars: 156,
          forks: 41,
          status: "Active",
          userId: req.user.id,
          createdAt: new Date().toISOString()
        }
      ];

      res.json(mockProjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch GitHub projects" });
    }
  });

  const httpServer = createServer(app);

  // Set up WebSocket for real-time updates
  httpServer.on('upgrade', (request, socket, head) => {
    // Handle WebSocket connections for real-time features
    console.log('WebSocket connection upgrade requested');
  });

  return httpServer;
}
