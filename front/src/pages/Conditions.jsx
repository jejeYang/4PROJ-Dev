import React from 'react';
import '../styles/Conditions.css';

function Conditions() {
    return (
        <div className="conditions-conteneur-page">
            <div className="conditions-enveloppe-document">
                <div className="conditions-entete">
                    <h1>Conditions d'utilisation de SUPFile</h1>
                    <p>Dernière mise à jour : 15 Mai 2026</p>
                </div>

                <div className="conditions-corps-texte">
                    <section className="conditions-section">
                        <h2>1. Acceptation des conditions</h2>
                        <p>
                            En accédant et en utilisant la plateforme SUPFile, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces termes, veuillez ne pas utiliser nos services. Ces conditions s'appliquent à tous les visiteurs, utilisateurs et autres personnes qui accèdent au service.
                        </p>
                    </section>

                    <section className="conditions-section">
                        <h2>2. Description du service</h2>
                        <p>
                            SUPFile est un service de stockage, de gestion et de partage de fichiers en ligne destiné principalement aux étudiants. Le service vous permet de télécharger, stocker et partager des documents numériques sous réserve de respecter l'espace de stockage alloué (30 Go par compte) et la légalité des fichiers hébergés.
                        </p>
                    </section>

                    <section className="conditions-section">
                        <h2>3. Création et sécurité du compte</h2>
                        <p>
                            Pour utiliser SUPFile, vous devez créer un compte. Vous êtes responsable de la confidentialité de votre mot de passe et de toutes les activités qui se produisent sous votre compte. Vous vous engagez à nous informer immédiatement de toute utilisation non autorisée de votre compte ou de toute autre faille de sécurité.
                        </p>
                    </section>

                    <section className="conditions-section">
                        <h2>4. Règles de conduite et fichiers interdits</h2>
                        <p>
                            Vous vous engagez à ne pas utiliser la plateforme pour stocker ou partager :
                        </p>
                        <ul className="conditions-liste">
                            <li>Des contenus illégaux, piratés ou soumis à des droits d'auteur sans autorisation.</li>
                            <li>Des logiciels malveillants, virus ou scripts destructeurs.</li>
                            <li>Des contenus diffamatoires, discriminatoires ou offensants.</li>
                        </ul>
                        <p>
                            SUPFile se réserve le droit de supprimer tout fichier enfreignant ces règles sans préavis et de suspendre le compte de l'utilisateur concerné.
                        </p>
                    </section>

                    <section className="conditions-section">
                        <h2>5. Disponibilité du service</h2>
                        <p>
                            Nous nous efforçons de maintenir SUPFile accessible 24h/24 et 7j/7. Toutefois, l'accès peut être temporairement suspendu pour des raisons de maintenance, de mises à jour ou en cas de force majeure. Nous ne pourrons être tenus responsables de toute perte de données ou préjudice lié à une indisponibilité temporaire du service.
                        </p>
                    </section>

                    <section className="conditions-section">
                        <h2>6. Confidentialité et données personnelles</h2>
                        <p>
                            Vos fichiers sont stockés de manière sécurisée. Nous ne consultons pas vos fichiers personnels sauf en cas d'obligation légale ou de signalement d'un contenu abusif. Les métadonnées de vos fichiers sont utilisées uniquement dans le but d'assurer le bon fonctionnement de la plateforme (statistiques de stockage, affichage du dashboard).
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Conditions;