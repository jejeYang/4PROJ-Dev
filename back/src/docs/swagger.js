export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SupFile API',
    version: '1.0.0',
    description: 'Documentation OpenAPI des endpoints backend SupFile.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Serveur local',
    },
  ],
  tags: [
    { name: 'Authentification' },
    { name: 'Utilisateurs' },
    { name: 'Dossiers' },
    { name: 'Fichiers' },
    { name: 'Corbeille' },
    { name: 'Partage' },
    { name: 'Liens publics' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      lienPassword: {
        type: 'apiKey',
        in: 'header',
        name: 'x-lien-password',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Une erreur est survenue' },
          error: { type: 'string', example: 'Une erreur est survenue' },
          protege: { type: 'boolean', example: true },
        },
      },
      MessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operation effectuee avec succes' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nom: { type: 'string', example: 'Alex Martin' },
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          avatarUrl: {
            type: 'string',
            example: 'http://localhost:3000/api/users/avatar/1?t=1710000000000',
          },
          stockageCompte: { type: 'integer', format: 'int64', example: 1073741824 },
          idCompte: { type: 'integer', example: 1 },
          nomCompte: { type: 'string', example: 'Alex Martin' },
          adresseMailCompte: { type: 'string', format: 'email', example: 'alex@example.com' },
        },
      },
      Compte: {
        type: 'object',
        properties: {
          idCompte: { type: 'integer', example: 1 },
          nomCompte: { type: 'string', example: 'Alex Martin' },
          adresseMailCompte: { type: 'string', format: 'email', example: 'alex@example.com' },
          stockageCompte: { type: 'integer', format: 'int64', example: 1073741824 },
        },
      },
      Dossier: {
        type: 'object',
        properties: {
          idDossier: { type: 'integer', example: 12 },
          idCompteCreateur: { type: 'integer', example: 1 },
          idCompteAcces: { type: 'integer', nullable: true, example: null },
          idDossierSource: { type: 'integer', nullable: true, example: null },
          idDossierParent: { type: 'integer', nullable: true, example: 3 },
          cheminDaccesDossier: { type: 'string', example: 'Documents' },
          status: { type: 'string', nullable: true, example: null },
          modifieLe: { type: 'string', format: 'date-time' },
        },
      },
      Fichier: {
        type: 'object',
        properties: {
          nom: { type: 'string', example: 'rapport.pdf' },
          taille: { type: 'integer', example: 245760 },
          dateModification: { type: 'string', format: 'date-time' },
          type: { type: 'string', example: 'fichier' },
          idDossier: { type: 'integer', example: 12 },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'mdp'],
        properties: {
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          mdp: { type: 'string', format: 'password', example: 'secret123' },
        },
      },
      GoogleLoginRequest: {
        type: 'object',
        required: ['idToken'],
        properties: {
          idToken: { type: 'string', example: 'google-id-token' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['nom', 'email', 'mdp'],
        properties: {
          nom: { type: 'string', maxLength: 100, example: 'Alex Martin' },
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          mdp: { type: 'string', format: 'password', minLength: 6, example: 'secret123' },
          stockage: { type: 'integer', format: 'int64', example: 1073741824 },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Connexion reussie' },
          utilisateur: { $ref: '#/components/schemas/User' },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
      CheckEmailResponse: {
        type: 'object',
        properties: {
          exists: { type: 'boolean', example: true },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          nom: { type: 'string', example: 'Alex Martin' },
          email: { type: 'string', format: 'email', example: 'alex.new@example.com' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['ancienMdp', 'nouveauMdp', 'confirmationMdp'],
        properties: {
          ancienMdp: { type: 'string', format: 'password', example: 'ancien123' },
          nouveauMdp: { type: 'string', format: 'password', example: 'nouveau123' },
          confirmationMdp: { type: 'string', format: 'password', example: 'nouveau123' },
        },
      },
      DeleteUserRequest: {
        type: 'object',
        required: ['mot_de_passe'],
        properties: {
          mot_de_passe: { type: 'string', format: 'password', example: 'secret123' },
        },
      },
      CreateDossierRequest: {
        type: 'object',
        required: ['cheminDaccesDossier'],
        properties: {
          cheminDaccesDossier: { type: 'string', example: 'Documents' },
          idDossierParent: { type: 'integer', example: 3 },
        },
      },
      UpdateDossierRequest: {
        type: 'object',
        required: ['cheminDaccesDossier'],
        properties: {
          cheminDaccesDossier: { type: 'string', example: 'Photos' },
        },
      },
      MoveRequest: {
        type: 'object',
        required: ['idNouveauDossierParent'],
        properties: {
          idNouveauDossierParent: { type: 'integer', example: 8 },
        },
      },
      RenameFileRequest: {
        type: 'object',
        required: ['nouveauNom'],
        properties: {
          nouveauNom: { type: 'string', example: 'rapport-final.pdf' },
        },
      },
      UploadResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Fichier televerse avec succes' },
          file: {
            type: 'object',
            properties: {
              originalName: { type: 'string', example: 'rapport.pdf' },
              filename: { type: 'string', example: 'rapport.pdf' },
              size: { type: 'integer', example: 245760 },
              mimetype: { type: 'string', example: 'application/pdf' },
              path: { type: 'string', example: 'storage/files/user_1/Documents/rapport.pdf' },
            },
          },
          dossierId: { type: 'string', example: '12' },
        },
      },
      MultipleUploadResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Fichiers televerses avec succes' },
          files: {
            type: 'array',
            items: { $ref: '#/components/schemas/UploadResponse' },
          },
        },
      },
      TailleDossierResponse: {
        type: 'object',
        properties: {
          dossierId: { type: 'string', example: '12' },
          taille: { type: 'integer', example: 458752 },
        },
      },
      HomeStatsResponse: {
        type: 'object',
        additionalProperties: true,
        example: {
          totalFichiers: 42,
          totalDossiers: 8,
          stockageUtilise: 104857600,
        },
      },
      SearchResults: {
        type: 'object',
        properties: {
          dossiers: {
            type: 'array',
            items: { $ref: '#/components/schemas/Dossier' },
          },
          fichiers: {
            type: 'array',
            items: { $ref: '#/components/schemas/Fichier' },
          },
        },
      },
      TrashDossierResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Dossier deplace a la corbeille' },
          dossier: { $ref: '#/components/schemas/Dossier' },
        },
      },
      TrashFileResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Fichier deplace a la corbeille' },
          fichier: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
      ShareUserRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'contact@example.com' },
          fileName: {
            type: 'string',
            nullable: true,
            description: 'Non supporte pour le partage interne actuel.',
            example: null,
          },
        },
      },
      ShareLinkRequest: {
        type: 'object',
        properties: {
          fileName: { type: 'string', example: 'rapport.pdf' },
          motDePasse: { type: 'string', example: 'secret-public' },
          dateExpiration: { type: 'string', format: 'date-time', example: '2026-12-31T23:59:59.000Z' },
        },
      },
      ShareLinkResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Lien de partage genere.' },
          url: { type: 'string', example: '/liens/2f1d3c...' },
          token: { type: 'string', example: '2f1d3c4b5a6e7f8a9b0c1d2e3f4a5b6c' },
        },
      },
      PublicLinkSummary: {
        type: 'object',
        properties: {
          idLien: { type: 'integer', example: 4 },
          token: { type: 'string', example: '2f1d3c4b5a6e7f8a9b0c1d2e3f4a5b6c' },
          url: { type: 'string', example: '/liens/2f1d3c4b5a6e7f8a9b0c1d2e3f4a5b6c' },
          type: { type: 'string', enum: ['dossier', 'fichier'], example: 'dossier' },
          nom: { type: 'string', example: 'Documents' },
          dateExpiration: { type: 'string', format: 'date-time', nullable: true },
          protege: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PublicLinkDetails: {
        oneOf: [
          {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'fichier' },
              nom: { type: 'string', example: 'rapport.pdf' },
              taille: { type: 'integer', example: 245760 },
              dateModification: { type: 'string', format: 'date-time' },
            },
          },
          {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'dossier' },
              nom: { type: 'string', example: 'Documents' },
              idDossier: { type: 'integer', example: 12 },
              isRacinePartage: { type: 'boolean', example: true },
              fichiers: {
                type: 'array',
                items: { $ref: '#/components/schemas/Fichier' },
              },
              sousDossiers: {
                type: 'array',
                items: { $ref: '#/components/schemas/Dossier' },
              },
            },
          },
        ],
      },
    },
    responses: {
      Unauthorized: {
        description: 'Token manquant ou mot de passe de lien requis.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Forbidden: {
        description: 'Acces refuse.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      NotFound: {
        description: 'Ressource introuvable.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Conflict: {
        description: 'Conflit de nom ou de ressource.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      BadRequest: {
        description: 'Requete invalide.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['Authentification'],
        summary: 'Verifier que l API est disponible',
        responses: {
          200: {
            description: 'API disponible.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'API SupFile' },
                    port: { type: 'integer', example: 3000 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/login': {
      post: {
        tags: ['Authentification'],
        summary: 'Connecter un utilisateur avec email et mot de passe',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Connexion reussie.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/google': {
      post: {
        tags: ['Authentification'],
        summary: 'Connecter un utilisateur via Google',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GoogleLoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Connexion Google reussie.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/register': {
      post: {
        tags: ['Authentification'],
        summary: 'Creer un compte',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Compte cree.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/check-email': {
      get: {
        tags: ['Authentification'],
        summary: 'Verifier si une adresse email existe deja',
        parameters: [
          {
            in: 'query',
            name: 'email',
            required: true,
            schema: { type: 'string', format: 'email' },
          },
        ],
        responses: {
          200: {
            description: 'Resultat de la verification.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CheckEmailResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Utilisateurs'],
        summary: 'Lister les utilisateurs',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Liste des utilisateurs.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Compte' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      delete: {
        tags: ['Utilisateurs'],
        summary: 'Supprimer le compte authentifie',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DeleteUserRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Compte supprime.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/users/{id}': {
      put: {
        tags: ['Utilisateurs'],
        summary: 'Mettre a jour son profil',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Profil mis a jour.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    utilisateur: { $ref: '#/components/schemas/Compte' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/users/avatar': {
      post: {
        tags: ['Utilisateurs'],
        summary: 'Televerser son avatar',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: {
                  avatar: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Avatar mis a jour.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/users/avatar/{id}': {
      get: {
        tags: ['Utilisateurs'],
        summary: 'Recuperer un avatar',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Image avatar.',
            content: {
              'image/png': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/change-password': {
      post: {
        tags: ['Utilisateurs'],
        summary: 'Changer son mot de passe',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Mot de passe change.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    utilisateur: { $ref: '#/components/schemas/Compte' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/dossiers': {
      get: {
        tags: ['Dossiers'],
        summary: 'Lister tous les dossiers',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Liste des dossiers.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Dossier' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Dossiers'],
        summary: 'Creer un dossier',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateDossierRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Dossier cree.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Dossier' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/dossiers/stats/home': {
      get: {
        tags: ['Dossiers'],
        summary: 'Recuperer les statistiques de la page accueil',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Statistiques utilisateur.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HomeStatsResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/dossiers/{dossierId}': {
      get: {
        tags: ['Dossiers'],
        summary: 'Recuperer un dossier par id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Dossier.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Dossier' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Dossiers'],
        summary: 'Renommer un dossier',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateDossierRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Dossier mis a jour.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Dossier' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
      delete: {
        tags: ['Dossiers'],
        summary: 'Supprimer definitivement un dossier',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Dossier supprime.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Dossier' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/comptes/{idCompteCreateurDossier}/dossiers': {
      get: {
        tags: ['Dossiers'],
        summary: 'Lister les dossiers racine d un compte',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'idCompteCreateurDossier',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Dossiers racine.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Dossier' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/dossiers/{dossierId}/sous-dossiers': {
      get: {
        tags: ['Dossiers'],
        summary: 'Lister les sous-dossiers',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Sous-dossiers.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Dossier' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/dossiers/{dossierId}/taille': {
      get: {
        tags: ['Dossiers'],
        summary: 'Calculer la taille d un dossier',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Taille du dossier en octets.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TailleDossierResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/dossiers/{dossierId}/deplacer': {
      put: {
        tags: ['Dossiers'],
        summary: 'Deplacer un dossier',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MoveRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Dossier deplace.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Dossier' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/dossiers/{dossierId}/rechercher': {
      get: {
        tags: ['Dossiers'],
        summary: 'Rechercher des fichiers dans un dossier',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
          {
            in: 'query',
            name: 'q',
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'type',
            schema: {
              type: 'string',
              enum: ['tout', 'images', 'videos', 'audio', 'pdf', 'zip'],
            },
          },
          {
            in: 'query',
            name: 'date',
            description: 'Filtre par date de modification.',
            schema: {
              type: 'string',
              enum: ['tout', 'semaine', 'mois'],
            },
          },
        ],
        responses: {
          200: {
            description: 'Resultats de recherche.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SearchResults' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/dossiers/{dossierId}/fichiers': {
      get: {
        tags: ['Fichiers'],
        summary: 'Lister les fichiers d un dossier',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Fichiers du dossier.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Fichier' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/dossiers/{dossierId}/fichiers/{nomFichier}': {
      get: {
        tags: ['Fichiers'],
        summary: 'Recuperer ou visualiser un fichier',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
          {
            in: 'path',
            name: 'nomFichier',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Contenu binaire du fichier.',
            content: {
              'application/octet-stream': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Fichiers'],
        summary: 'Supprimer definitivement un fichier',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
          {
            in: 'path',
            name: 'nomFichier',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Fichier supprime.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    dossierId: { type: 'string' },
                    fileName: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/dossiers/{dossierId}/fichiers/{nomFichier}/renommer': {
      put: {
        tags: ['Fichiers'],
        summary: 'Renommer un fichier',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
          {
            in: 'path',
            name: 'nomFichier',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RenameFileRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Fichier renomme.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/dossiers/{dossierId}/fichiers/{nomFichier}/deplacer': {
      put: {
        tags: ['Fichiers'],
        summary: 'Deplacer un fichier',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
          {
            in: 'path',
            name: 'nomFichier',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MoveRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Fichier deplace.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/dossiers/{dossierId}/televerser': {
      post: {
        tags: ['Fichiers'],
        summary: 'Televerser un fichier',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['fichier'],
                properties: {
                  fichier: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Fichier televerse.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UploadResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/dossiers/{dossierId}/televerser-multiple': {
      post: {
        tags: ['Fichiers'],
        summary: 'Televerser plusieurs fichiers',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['fichiers'],
                properties: {
                  fichiers: {
                    type: 'array',
                    maxItems: 10,
                    items: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Fichiers televerses.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MultipleUploadResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/telechargerZip': {
      get: {
        tags: ['Fichiers'],
        summary: 'Telecharger une selection de fichiers ou dossiers en ZIP',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'listeFichier',
            schema: {
              oneOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
            description: 'Chemins de fichiers, repetes ou separes selon le client.',
          },
          {
            in: 'query',
            name: 'listeDossier',
            schema: {
              oneOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
            description: 'Chemins de dossiers, repetes ou separes selon le client.',
          },
        ],
        responses: {
          200: {
            description: 'Archive ZIP.',
            content: {
              'application/zip': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/corbeille': {
      get: {
        tags: ['Corbeille'],
        summary: 'Lister les dossiers dans la corbeille',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dossiers de la corbeille.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Dossier' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/dossiers/{dossierId}/vers-corbeille': {
      delete: {
        tags: ['Corbeille'],
        summary: 'Deplacer un dossier vers la corbeille',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Dossier deplace a la corbeille.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TrashDossierResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/dossiers/{dossierId}/fichiers/{nomFichier}/vers-corbeille': {
      delete: {
        tags: ['Corbeille'],
        summary: 'Deplacer un fichier vers la corbeille',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
          {
            in: 'path',
            name: 'nomFichier',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Fichier deplace a la corbeille.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TrashFileResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/dossiers/{dossierId}/restaurer': {
      post: {
        tags: ['Corbeille'],
        summary: 'Restaurer un dossier depuis la corbeille',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Dossier restaure.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TrashDossierResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/corbeille/fichiers/{nomFichier}/restaurer': {
      post: {
        tags: ['Corbeille'],
        summary: 'Restaurer un fichier depuis la corbeille',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'nomFichier',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Fichier restaure.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TrashFileResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/corbeille/vider': {
      delete: {
        tags: ['Corbeille'],
        summary: 'Vider la corbeille',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Corbeille videe.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    dossiersSupprimes: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Dossier' },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/partage/utilisateur/{dossierId}': {
      post: {
        tags: ['Partage'],
        summary: 'Partager un dossier avec un utilisateur',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierId',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ShareUserRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Dossier partage.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    partage: { $ref: '#/components/schemas/Dossier' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/partage/envoyes': {
      get: {
        tags: ['Partage'],
        summary: 'Lister les partages envoyes',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Partages envoyes.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    allOf: [
                      { $ref: '#/components/schemas/Dossier' },
                      {
                        type: 'object',
                        properties: {
                          emailContact: { type: 'string', format: 'email' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/partage/recus': {
      get: {
        tags: ['Partage'],
        summary: 'Lister les partages recus',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Partages recus.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    allOf: [
                      { $ref: '#/components/schemas/Dossier' },
                      {
                        type: 'object',
                        properties: {
                          emailContact: { type: 'string', format: 'email' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/partage/interne/{dossierIdPartage}': {
      delete: {
        tags: ['Partage'],
        summary: 'Supprimer un partage interne',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'dossierIdPartage',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Partage supprime.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/partage/lien/{id}': {
      post: {
        tags: ['Partage'],
        summary: 'Creer un lien public pour un dossier ou fichier',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'Identifiant du dossier a partager.',
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ShareLinkRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Lien cree.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ShareLinkResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      delete: {
        tags: ['Partage'],
        summary: 'Supprimer un lien public',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'Identifiant du lien public a supprimer.',
          },
        ],
        responses: {
          200: {
            description: 'Lien public supprime.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/partage/mes-liens': {
      get: {
        tags: ['Partage'],
        summary: 'Lister les liens publics crees par l utilisateur',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Liens publics.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PublicLinkSummary' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/liens/{token}': {
      get: {
        tags: ['Liens publics'],
        summary: 'Acceder a une ressource partagee',
        security: [{ lienPassword: [] }, {}],
        parameters: [
          {
            in: 'path',
            name: 'token',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'password',
            schema: { type: 'string' },
            description: 'Mot de passe du lien, alternative au header x-lien-password.',
          },
          {
            in: 'query',
            name: 'download',
            schema: { type: 'boolean' },
          },
          {
            in: 'query',
            name: 'idDossier',
            schema: { type: 'integer' },
          },
          {
            in: 'query',
            name: 'fileName',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Fichier, dossier ZIP ou contenu partage.',
            content: {
              'application/octet-stream': {
                schema: { type: 'string', format: 'binary' },
              },
              'application/zip': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          410: {
            description: 'Lien expire.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/liens/{token}/details': {
      get: {
        tags: ['Liens publics'],
        summary: 'Obtenir les details navigables d un lien public',
        security: [{ lienPassword: [] }, {}],
        parameters: [
          {
            in: 'path',
            name: 'token',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'password',
            schema: { type: 'string' },
            description: 'Mot de passe du lien, alternative au header x-lien-password.',
          },
          {
            in: 'query',
            name: 'idSousDossier',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Details du lien public.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicLinkDetails' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          410: {
            description: 'Lien expire.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
};

export default swaggerSpec;
