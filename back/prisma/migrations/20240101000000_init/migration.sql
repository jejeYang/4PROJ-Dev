-- CreateTable
CREATE TABLE IF NOT EXISTS "compte" (
    "idCompte" SERIAL PRIMARY KEY,
    "nomCompte" VARCHAR(100) NOT NULL,
    "adresseMailCompte" VARCHAR(255) NOT NULL UNIQUE,
    "mdpCompte" VARCHAR(255) NOT NULL,
    "stockageCompte" BIGINT NOT NULL DEFAULT 0,
    "avatarBlobCompte" BYTEA
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "liengenere" (
    "idLienGenere" SERIAL PRIMARY KEY,
    "idCompte" INTEGER NOT NULL,
    "cheminDaccesLien" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateExpiration" TIMESTAMP(3),
    "mdpLienGenere" VARCHAR(255),
    "urlLienGenere" TEXT,
    CONSTRAINT "fk_compte_lien" FOREIGN KEY ("idCompte") REFERENCES "compte"("idCompte") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "dossier" (
    "idDossier" SERIAL PRIMARY KEY,
    "idCompteCreateur" INTEGER NOT NULL,
    "idCompteAcces" INTEGER,
    "idDossierParent" INTEGER,
    "cheminDaccesDossier" TEXT NOT NULL,
    "status" VARCHAR(50),
    CONSTRAINT "fk_compte_createur" FOREIGN KEY ("idCompteCreateur") REFERENCES "compte"("idCompte") ON DELETE CASCADE,
    CONSTRAINT "fk_compte_acces" FOREIGN KEY ("idCompteAcces") REFERENCES "compte"("idCompte") ON DELETE SET NULL,
    CONSTRAINT "fk_dossier_parent" FOREIGN KEY ("idDossierParent") REFERENCES "dossier"("idDossier") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_liengenere_compte" ON "liengenere"("idCompte");
CREATE INDEX IF NOT EXISTS "idx_dossier_createur" ON "dossier"("idCompteCreateur");
CREATE INDEX IF NOT EXISTS "idx_dossier_acces" ON "dossier"("idCompteAcces");