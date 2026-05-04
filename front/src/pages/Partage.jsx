import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Partage.css';

function Partage() {
    const navigate = useNavigate();
    const [liens_partage, setLiensPartage] = useState([]);
    const [chargement_en_cours, setChargementEnCours] = useState(true);

    // Vérification de la connexion et chargement des données
    useEffect(() => {
        const token_utilisateur = localStorage.getItem('token');
        if (!token_utilisateur) {
            navigate('/login'); // Redirection si non connecté
            return;
        }

        chargerDonneesTest();
    }, [navigate]);

    const chargerDonneesTest = () => {
        // Simulation de données provenant de l'API
        const fausses_donnees = [
            {
                id_lien: 1,
                chemin_acces: "Mon Espace › Documents › rapport_2026.pdf",
                date_creation: "2026-04-15T10:00:00",
                date_expiration: "2026-05-15T10:00:00",
                id_utilisateur_cible: 42,
                mot_de_passe: "123456"
            },
            {
                id_lien: 2,
                chemin_acces: "Mon Espace › Images › logo.png",
                date_creation: "2026-04-20T14:30:00",
                date_expiration: null,
                id_utilisateur_cible: null, // Lien invité
                mot_de_passe: "" // Pas de mot de passe
            }
        ];
        setLiensPartage(fausses_donnees);
        setChargementEnCours(false);
    };

    const supprimerLien = (id_lien_a_supprimer) => {
        if (window.confirm('Voulez-vous vraiment supprimer ce lien de partage ?')) {
            // Logique de suppression (mise à jour du state pour le front)
            const nouvelle_liste = liens_partage.filter(lien => lien.id_lien !== id_lien_a_supprimer);
            setLiensPartage(nouvelle_liste);
        }
    };

    const formaterDate = (date_string) => {
        if (!date_string) return "Aucune";
        const date_obj = new Date(date_string);
        return date_obj.toLocaleDateString('fr-FR');
    };

    if (chargement_en_cours) {
        return <div className="partage-container">Chargement de vos liens...</div>;
    }

    return (
        <div className="partage-container">
            <div className="partage-header">
                <h1>Mes partages</h1>
                <p>Gérez vos liens d'invitation et vos fichiers partagés.</p>
            </div>

            {liens_partage.length === 0 ? (
                <p>Vous n'avez aucun lien de partage actif.</p>
            ) : (
                <table className="tableau-partage">
                    <thead>
                        <tr>
                            <th>Élément partagé</th>
                            <th>Création</th>
                            <th>Expiration</th>
                            <th>Partagé avec</th>
                            <th>Mot de passe</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {liens_partage.map((lien) => (
                            <tr key={lien.id_lien}>
                                <td className="chemin-acces">{lien.chemin_acces}</td>
                                <td>{formaterDate(lien.date_creation)}</td>
                                <td>{formaterDate(lien.date_expiration)}</td>
                                <td>
                                    {lien.id_utilisateur_cible ? (
                                        <span>Utilisateur #{lien.id_utilisateur_cible}</span>
                                    ) : (
                                        <span className="tag-invite">Invité (Public)</span>
                                    )}
                                </td>
                                <td>
                                    {lien.mot_de_passe ? (
                                        <span className="mdp-cache">••••••••</span>
                                    ) : (
                                        <span className="tag-invite">Aucun</span>
                                    )}
                                </td>
                                <td>
                                    <button 
                                        className="btn-supprimer-lien"
                                        onClick={() => supprimerLien(lien.id_lien)}
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Partage;