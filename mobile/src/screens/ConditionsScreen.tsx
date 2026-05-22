import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';
import { createStyles } from '../styles/ConditionsScreen.styles';

export default function ConditionsScreen() {
  const { theme } = useMobileTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* En-tête */}
      <View style={styles.entete}>
        <Text style={styles.titre}>Conditions d'utilisation de SUPFile</Text>
        <Text style={styles.sousTitre}>Dernière mise à jour : 15 Mai 2026</Text>
      </View>

      {/* Section 1 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>1. Acceptation des conditions</Text>
        <Text style={styles.sectionTexte}>
          En accédant et en utilisant la plateforme SUPFile, vous acceptez d'être lié par les
          présentes conditions d'utilisation. Si vous n'acceptez pas ces termes, veuillez ne pas
          utiliser nos services. Ces conditions s'appliquent à tous les visiteurs, utilisateurs et
          autres personnes qui accèdent au service.
        </Text>
      </View>

      {/* Section 2 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>2. Description du service</Text>
        <Text style={styles.sectionTexte}>
          SUPFile est un service de stockage, de gestion et de partage de fichiers en ligne destiné
          principalement aux étudiants. Le service vous permet de télécharger, stocker et partager
          des documents numériques sous réserve de respecter l'espace de stockage alloué (30 Go par
          compte) et la légalité des fichiers hébergés.
        </Text>
      </View>

      {/* Section 3 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>3. Création et sécurité du compte</Text>
        <Text style={styles.sectionTexte}>
          Pour utiliser SUPFile, vous devez créer un compte. Vous êtes responsable de la
          confidentialité de votre mot de passe et de toutes les activités qui se produisent sous
          votre compte. Vous vous engagez à nous informer immédiatement de toute utilisation non
          autorisée de votre compte ou de toute autre faille de sécurité.
        </Text>
      </View>

      {/* Section 4 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>4. Règles de conduite et fichiers interdits</Text>
        <Text style={styles.sectionTexte}>
          Vous vous engagez à ne pas utiliser la plateforme pour stocker ou partager :
        </Text>
        <View style={styles.liste}>
          <Text style={styles.listeItem}>
            • Des contenus illégaux, piratés ou soumis à des droits d'auteur sans autorisation.
          </Text>
          <Text style={styles.listeItem}>
            • Des logiciels malveillants, virus ou scripts destructeurs.
          </Text>
          <Text style={styles.listeItem}>
            • Des contenus diffamatoires, discriminatoires ou offensants.
          </Text>
        </View>
        <Text style={styles.sectionTexte}>
          SUPFile se réserve le droit de supprimer tout fichier enfreignant ces règles sans préavis
          et de suspendre le compte de l'utilisateur concerné.
        </Text>
      </View>

      {/* Section 5 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>5. Disponibilité du service</Text>
        <Text style={styles.sectionTexte}>
          Nous nous efforçons de maintenir SUPFile accessible 24h/24 et 7j/7. Toutefois, l'accès
          peut être temporairement suspendu pour des raisons de maintenance, de mises à jour ou en
          cas de force majeure. Nous ne pourrons être tenus responsables de toute perte de données
          ou préjudice lié à une indisponibilité temporaire du service.
        </Text>
      </View>

      {/* Section 6 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>6. Confidentialité et données personnelles</Text>
        <Text style={styles.sectionTexte}>
          Vos fichiers sont stockés de manière sécurisée. Nous ne consultons pas vos fichiers
          personnels sauf en cas d'obligation légale ou de signalement d'un contenu abusif. Les
          métadonnées de vos fichiers sont utilisées uniquement dans le but d'assurer le bon
          fonctionnement de la plateforme (statistiques de stockage, affichage du dashboard).
        </Text>
      </View>

      {/* Pied de page */}
      <View style={styles.piedDePage}>
        <Text style={styles.piedDePageTexte}>© 2026 SUPFile</Text>
      </View>
    </ScrollView>
  );
}
