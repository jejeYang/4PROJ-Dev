-- CreateTable
CREATE TABLE "compte" (
    "idCompte" SERIAL NOT NULL,
    "nomCompte" VARCHAR(100) NOT NULL,
    "adresseMailCompte" VARCHAR(255) NOT NULL,
    "mdpCompte" VARCHAR(255) NOT NULL,
    "stockageCompte" BIGINT NOT NULL DEFAULT 0,
    "avatarBlobCompte" BYTEA,

    CONSTRAINT "compte_pkey" PRIMARY KEY ("idCompte")
);

-- CreateTable
CREATE TABLE "liengenere" (
    "idLienGenere" SERIAL NOT NULL,
    "idCompte" INTEGER NOT NULL,
    "cheminDaccesLien" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateExpiration" TIMESTAMP(3),
    "mdpLienGenere" VARCHAR(255),
    "urlLienGenere" TEXT,

    CONSTRAINT "liengenere_pkey" PRIMARY KEY ("idLienGenere")
);

-- CreateTable
CREATE TABLE "dossier" (
    "idDossier" SERIAL NOT NULL,
    "idCompteCreateur" INTEGER NOT NULL,
    "idCompteAcces" INTEGER,
    "idDossierSource" INTEGER,
    "idDossierParent" INTEGER,
    "cheminDaccesDossier" TEXT NOT NULL,
    "status" VARCHAR(50),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossier_pkey" PRIMARY KEY ("idDossier")
);

-- CreateIndex
CREATE UNIQUE INDEX "compte_adresseMailCompte_key" ON "compte"("adresseMailCompte");

-- CreateIndex
CREATE UNIQUE INDEX "dossier_idDossierParent_cheminDaccesDossier_key" ON "dossier"("idDossierParent", "cheminDaccesDossier");

-- AddForeignKey
ALTER TABLE "liengenere" ADD CONSTRAINT "liengenere_idCompte_fkey" FOREIGN KEY ("idCompte") REFERENCES "compte"("idCompte") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier" ADD CONSTRAINT "dossier_idCompteCreateur_fkey" FOREIGN KEY ("idCompteCreateur") REFERENCES "compte"("idCompte") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier" ADD CONSTRAINT "dossier_idCompteAcces_fkey" FOREIGN KEY ("idCompteAcces") REFERENCES "compte"("idCompte") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier" ADD CONSTRAINT "dossier_idDossierParent_fkey" FOREIGN KEY ("idDossierParent") REFERENCES "dossier"("idDossier") ON DELETE CASCADE ON UPDATE CASCADE;
