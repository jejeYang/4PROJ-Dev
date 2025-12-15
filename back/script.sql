
-- Table Compte
CREATE TABLE Compte (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    adresseMail VARCHAR(255) UNIQUE NOT NULL,
    mdp VARCHAR(255) NOT NULL,
    stockage BIGINT DEFAULT 0,
    avatarBlob BYTEA
);

-- Table LienGenere
CREATE TABLE LienGenere (
    id SERIAL PRIMARY KEY,
    idCompte INT NOT NULL,
    cheminDacces TEXT NOT NULL,
    dateCreation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dateExpiration TIMESTAMP,
    mdp VARCHAR(255),
    url TEXT,
    CONSTRAINT fk_compte FOREIGN KEY(idCompte) REFERENCES Compte(id) ON DELETE CASCADE
);

-- Table Dossier
CREATE TABLE Dossier (
    id SERIAL PRIMARY KEY,
    idCompteCreateur INT NOT NULL,
    idCompteAcces INT,
    cheminDacces TEXT NOT NULL,
    status VARCHAR(50),
    CONSTRAINT fk_compte_createur FOREIGN KEY(idCompteCreateur) REFERENCES Compte(id) ON DELETE CASCADE,
    CONSTRAINT fk_compte_acces FOREIGN KEY(idCompteAcces) REFERENCES Compte(id) ON DELETE SET NULL
);
