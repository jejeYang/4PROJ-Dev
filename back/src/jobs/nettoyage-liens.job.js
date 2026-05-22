import cron from 'node-cron';
import LienService from '../services/lien.service.js';

const lienService = new LienService();

export function lancerNettoyageLiensExpires() {
    cron.schedule('0 3 * * *', async () => {
        try {
            const result = await lienService.supprimerLiensExpires();
            console.log(`[CRON] Liens expirés supprimés : ${result.count ?? 0}`);
        } catch (error) {
            console.error('[CRON] Erreur nettoyage liens expirés :', error);
        }
    });
}
