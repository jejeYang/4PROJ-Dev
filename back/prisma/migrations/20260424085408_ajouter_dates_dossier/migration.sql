/*
  Warnings:

  - You are about to alter the column `stockageCompte` on the `compte` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - A unique constraint covering the columns `[idDossierParent,cheminDaccesDossier]` on the table `dossier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `modifieLe` to the `dossier` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "dossier" DROP CONSTRAINT "fk_compte_acces";

-- DropForeignKey
ALTER TABLE "dossier" DROP CONSTRAINT "fk_compte_createur";

-- DropForeignKey
ALTER TABLE "dossier" DROP CONSTRAINT "fk_dossier_parent";

-- DropForeignKey
ALTER TABLE "liengenere" DROP CONSTRAINT "fk_compte_lien";

-- DropIndex
DROP INDEX "idx_dossier_acces";

-- DropIndex
DROP INDEX "idx_dossier_createur";

-- DropIndex
DROP INDEX "idx_liengenere_compte";

-- AlterTable
ALTER TABLE "compte" ALTER COLUMN "stockageCompte" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "dossier" ADD COLUMN     "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "modifieLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

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
