// Route API robuste pour la completion de profil
// À ajouter dans server/routes.ts ou server/authRoutes.ts

export function addProfileCompletionRoutes(app: any) {
  // Route de completion de profil avec haute disponibilité
  app.put("/api/profile/complete", async (req: any, res: any) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ 
          message: "Authentification requise",
          code: "AUTH_REQUIRED" 
        });
      }

      const userId = user.id;
      const profileData = {
        ...req.body,
        profileCompleted: true,
        updatedAt: new Date()
      };

      console.log(`Profile completion request for user ${userId}`);

      try {
        // Tentative mise à jour dans la base de données principale
        const updatedUser = await storage.updateUser(userId, profileData);
        
        // Mise à jour de la session
        if (req.session?.user) {
          req.session.user = { ...req.session.user, profileCompleted: true };
        }

        console.log(`Profile completed successfully for user ${userId}`);
        
        res.json({ 
          success: true,
          message: "Profil complété avec succès",
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: updatedUser.role,
            profileCompleted: true
          }
        });

      } catch (dbError) {
        console.error("Database error during profile completion:", dbError);
        
        // Fallback: Mise à jour session seulement (pour continuité de service)
        if (req.session?.user) {
          req.session.user = { ...req.session.user, profileCompleted: true };
        }
        
        console.log(`Profile completion saved in session for user ${userId} (DB unavailable)`);
        
        res.json({
          success: true,
          message: "Profil complété (sauvegarde temporaire)",
          fallback: true,
          user: {
            ...user,
            profileCompleted: true
          }
        });
      }

    } catch (error) {
      console.error("Profile completion error:", error);
      res.status(500).json({ 
        message: "Erreur lors de la completion du profil",
        error: process.env.NODE_ENV === 'development' ? error.message : "Erreur interne"
      });
    }
  });

  // Route de vérification du statut de completion
  app.get("/api/profile/status", async (req: any, res: any) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      // Vérifier le statut dans la DB ou session
      let profileCompleted = user.profileCompleted || false;
      
      try {
        const dbUser = await storage.getUser(user.id);
        if (dbUser) {
          profileCompleted = dbUser.profileCompleted || false;
        }
      } catch (dbError) {
        console.warn("Could not check DB for profile status, using session");
      }

      res.json({
        userId: user.id,
        profileCompleted,
        canBypass: process.env.NODE_ENV === 'development'
      });

    } catch (error) {
      console.error("Profile status check error:", error);
      res.status(500).json({ message: "Erreur de vérification du statut" });
    }
  });

  // Route de bypass pour développement (URGENCE)
  app.post("/api/profile/bypass", async (req: any, res: any) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: "Route de développement seulement" });
    }

    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      // Bypass immediat pour les tests
      if (req.session?.user) {
        req.session.user.profileCompleted = true;
      }

      console.log(`Profile completion bypassed for user ${user.id} (development)`);

      res.json({
        success: true,
        message: "Profil marqué comme complété (développement)",
        bypass: true
      });

    } catch (error) {
      console.error("Profile bypass error:", error);
      res.status(500).json({ message: "Erreur lors du bypass" });
    }
  });
}

// Middleware de vérification de completion avec flexibilité
export function checkProfileCompletion(req: any, res: any, next: any) {
  const user = req.session?.user || req.user;
  
  if (!user) {
    return next(); // Laisser l'authentification gérer cela
  }

  // Candidats doivent avoir un profil complété
  if (user.role === 'candidate') {
    const isProfileCompleted = user.profileCompleted || 
                             (process.env.NODE_ENV === 'development' && 
                              req.headers['x-bypass-profile'] === 'true');

    if (!isProfileCompleted && !req.path.includes('/profile/complete')) {
      return res.status(403).json({
        message: "Profil non complété",
        requiresProfileCompletion: true,
        redirectTo: '/profile/complete'
      });
    }
  }

  next();
}