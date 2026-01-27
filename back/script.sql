-- Table Compte
CREATE TABLE IF NOT EXISTS Compte (
    idCompte SERIAL PRIMARY KEY,
    nomCompte VARCHAR(100) NOT NULL,
    adresseMailCompte VARCHAR(255) UNIQUE NOT NULL,
    mdpCompte VARCHAR(255) NOT NULL,
    stockageCompte BIGINT DEFAULT 0,
    avatarBlobCompte BYTEA
);

-- Table LienGenere
CREATE TABLE IF NOT EXISTS LienGenere (
    idLienGenere SERIAL PRIMARY KEY,
    idCompte INT NOT NULL,
    cheminDaccesLien TEXT NOT NULL,
    dateCreation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dateExpiration TIMESTAMP,
    mdpLienGenere VARCHAR(255),
    urlLienGenere TEXT,
    CONSTRAINT fk_compte_lien FOREIGN KEY(idCompte) REFERENCES Compte(idCompte) ON DELETE CASCADE
);

-- Table Dossier
CREATE TABLE IF NOT EXISTS Dossier (
    idDossier SERIAL PRIMARY KEY,
    idCompteCreateur INT NOT NULL,
    idCompteAcces INT,
    idDossierParent INT,
    cheminDaccesDossier TEXT NOT NULL,
    status VARCHAR(50),
    CONSTRAINT fk_compte_createur FOREIGN KEY(idCompteCreateur) REFERENCES Compte(idCompte) ON DELETE CASCADE,
    CONSTRAINT fk_compte_acces FOREIGN KEY(idCompteAcces) REFERENCES Compte(idCompte) ON DELETE SET NULL,
    CONSTRAINT fk_dossier_parent FOREIGN KEY(idDossierParent) REFERENCES Dossier(idDossier) ON DELETE CASCADE
);

-- Index pour améliorer les performances (créés seulement s'ils n'existent pas)
CREATE INDEX IF NOT EXISTS idx_liengenere_compte ON LienGenere(idCompte);
CREATE INDEX IF NOT EXISTS idx_dossier_createur ON Dossier(idCompteCreateur);
CREATE INDEX IF NOT EXISTS idx_dossier_acces ON Dossier(idCompteAcces);

-- Insertion de données de test (uniquement si elles n'existent pas déjà)
INSERT INTO Compte (nomCompte, adresseMailCompte, mdpCompte, stockageCompte) 
VALUES 
    ('Admin', 'admin@supfile.com', '$2b$10$X.QD4ujHKJGv3I4IcxIPw.vUqH5wgKPHqIu0VaU9XNYGdB35vb24m', 1073741824),
    ('User Test', 'user@test.com', '$2b$10$Zk6jpVPkTlETh14xa5epquImN0Ol6Yh1AgUGjfkL2c6NWyMDiz3rm', 5368709120)
ON CONFLICT (adresseMailCompte) DO NOTHING;

-- Message de confirmation
SELECT 'Tables vérifiées/créées avec succès !' AS message;
