import bcrypt from 'bcryptjs';
import { query } from './src/config/db.js';

async function seedFormation() {
  try {
    console.log("⏳ Nettoyage des anciennes données de test...");
    // On nettoie les tables de contenu pour éviter les doublons (on garde les utilisateurs)
    await query("TRUNCATE TABLE formation, session, module, lecon, ressource, evaluation, question, proposition, inscription, soumission, tentative, reponse_tentative, attestation, affectation, notification RESTART IDENTITY CASCADE");

    const hash = await bcrypt.hash('test123', 10);

    // 1. Créer les utilisateurs
    console.log("👤 Création des comptes...");
    await query("DELETE FROM utilisateur WHERE identifiant IN ('prof_devops', 'etudiant_devops')");
    
    const resF = await query("INSERT INTO utilisateur (identifiant, mot_de_passe, nom, prenom) VALUES ($1, $2, $3, $4) RETURNING id_utilisateur", ["prof_devops", hash, "Rakoto", "Jean"]);
    const idFormateur = resF.rows[0].id_utilisateur;
    await query("INSERT INTO utilisateur_role (id_utilisateur, id_role) VALUES ($1, (SELECT id_role FROM role WHERE nom_role = 'formateur'))", [idFormateur]);

    const resA = await query("INSERT INTO utilisateur (identifiant, mot_de_passe, nom, prenom) VALUES ($1, $2, $3, $4) RETURNING id_utilisateur", ["etudiant_devops", hash, "Rabe", "Alice"]);
    const idApprenant = resA.rows[0].id_utilisateur;
    await query("INSERT INTO utilisateur_role (id_utilisateur, id_role) VALUES ($1, (SELECT id_role FROM role WHERE nom_role = 'apprenant'))", [idApprenant]);

    // 2. Créer la Formation et la Session
    console.log("🏗️ Création de la formation DevOps...");
    const resForm = await query("INSERT INTO formation (intitule, description, duree, public_vise, statut_formation) VALUES ($1, $2, $3, $4, $5) RETURNING id_formation", 
      ["Formation DevOps Innov-T", "Parcours complet de A à Z : Linux, Docker, K8s, CI/CD, Cloud et Monitoring.", 120, "Développeurs / Ops", "publiee"]);
    const idFormation = resForm.rows[0].id_formation;

    const resSess = await query("INSERT INTO session (id_formation, date_debut, date_fin, capacite_max) VALUES ($1, '2026-10-01', '2026-12-31', 20) RETURNING id_session", [idFormation]);
    const idSession = resSess.rows[0].id_session;

    await query("INSERT INTO affectation (id_session, id_utilisateur) VALUES ($1, $2)", [idSession, idFormateur]);
    await query("INSERT INTO inscription (id_utilisateur, id_session, statut_inscription) VALUES ($1, $2, 'validee')", [idApprenant, idSession]);

    // 3. Les 9 Modules
    const modulesData = [
      {
        titre: "1. Linux & Shell (fondations)",
        desc: "Maîtriser le terminal, les scripts bash et l'automatisation système.",
        contenu: `# Introduction à Linux et Bash\n\nUn script shell est une suite de commandes exécutées par l'interpréteur.\n\n## Le Shebang\n\`\`\`bash\n#!/bin/bash\n# Ceci est un commentaire\necho "Bonjour le monde !"\n\`\`\`\n\n## Variables\n\`\`\`bash\nnom="Alice"\nage=25\necho "Bonjour $nom, tu as $age ans"\n\`\`\`\n\n## Conditions et Boucles\n\`\`\`bash\nif [ $age -ge 18 ]; then\n  echo "Majeur"\nfi\n\nfor i in {1..5}; do\n  echo "Numéro $i"\ndone\n\`\`\`\n\n## Bonnes pratiques\n- Toujours quoter les variables : \`"$var"\`\n- Utiliser \`set -euo pipefail\` en début de script`,
        qcm: { enonce: "Quelle commande permet de rendre un script exécutable ?", options: ["chmod +x script.sh", "bash script.sh", "chown +x script.sh"], correct: 0 }
      },
      {
        titre: "2. Réseaux & SSH (connexion sécurisée)",
        desc: "Comprendre TCP/IP, le DNS et sécuriser les accès avec SSH.",
        contenu: `# Réseaux et SSH\n\n## Commandes réseau de base\n- \`ping google.com\` : tester la connectivité\n- \`curl -I https://exemple.com\` : voir les entêtes HTTP\n- \`netstat -tulpn\` : voir les ports ouverts\n\n## Connexion SSH\nLe protocole SSH (port 22) permet de se connecter à distance de manière chiffrée.\n\n\`\`\`bash\n# Générer une paire de clés\nssh-keygen -t rsa -b 4096\n\n# Copier la clé publique sur le serveur\nssh-copy-id user@192.168.1.100\n\n# Se connecter\nssh user@192.168.1.100\n\`\`\``,
        qcm: { enonce: "Quel est le port par défaut du protocole SSH ?", options: ["21", "22", "80", "443"], correct: 1 }
      },
      {
        titre: "3. Docker (conteneurisation)",
        desc: "Créer, exécuter et orchestrer des conteneurs avec Docker et Compose.",
        contenu: `# Docker de A à Z\n\nDocker est une plateforme de conteneurisation.\n\n## Commandes de base\n\`\`\`bash\ndocker pull nginx\ndocker run -d -p 8080:80 --name mon-nginx nginx\ndocker ps\ndocker logs mon-nginx\n\`\`\`\n\n## Dockerfile\n\`\`\`dockerfile\nFROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]\n\`\`\`\n\n## Docker Compose\n\`\`\`yaml\nversion: '3.9'\nservices:\n  web:\n    build: .\n    ports:\n      - "3000:3000"\n  db:\n    image: postgres:16\n\`\`\``,
        qcm: { enonce: "Quelle commande permet de lancer un conteneur en arrière-plan (detached) ?", options: ["docker run -it", "docker run -d", "docker start", "docker exec"], correct: 1 }
      },
      {
        titre: "4. Kubernetes & Helm (orchestration)",
        desc: "Déployer et gérer des applications à grande échelle.",
        contenu: `# Kubernetes & Helm\n\nKubernetes (K8s) orchestre les conteneurs.\n\n## Concepts clés\n- **Pod** : plus petite unité (1 ou plusieurs conteneurs)\n- **Deployment** : gère les réplicas et mises à jour\n- **Service** : expose les pods\n- **Ingress** : route le trafic HTTP externe\n\n## Commandes kubectl\n\`\`\`bash\nkubectl get pods\nkubectl apply -f deployment.yaml\nkubectl logs mon-pod\n\`\`\`\n\n## Helm\nHelm est le gestionnaire de paquets K8s.\n\`\`\`bash\nhelm repo add bitnami https://charts.bitnami.com/bitnami\nhelm install my-release bitnami/nginx\n\`\`\``,
        qcm: { enonce: "Quelle commande liste les pods en cours d'exécution ?", options: ["kubectl get pods", "docker ps", "kubectl list pods", "helm list"], correct: 0 }
      },
      {
        titre: "5. CI/CD GitLab (automatisation)",
        desc: "Automatiser les tests, builds et déploiements avec GitLab CI.",
        contenu: `# GitLab CI/CD\n\nLe fichier \`.gitlab-ci.yml\` définit le pipeline.\n\n## Structure de base\n\`\`\`yaml\nstages:\n  - build\n  - test\n  - deploy\n\nbuild-job:\n  stage: build\n  script:\n    - echo "Building..."\n    - make build\n\ntest-job:\n  stage: test\n  script:\n    - npm test\n\`\`\`\n\n## Les Runners\nLe Runner est l'agent qui exécute les jobs. Il peut être installé sur un serveur (Shell Executor) ou utiliser Docker.`,
        qcm: { enonce: "Quel fichier est utilisé par GitLab pour définir le pipeline CI/CD ?", options: [".github/workflows.yml", "Jenkinsfile", ".gitlab-ci.yml", "docker-compose.yml"], correct: 2 }
      },
      {
        titre: "6. GitOps & ArgoCD (déploiement continu)",
        desc: "Le Git comme unique source de vérité pour le déploiement.",
        contenu: `# GitOps & ArgoCD\n\nLe GitOps consiste à décrire l'état désiré de l'infrastructure dans Git. ArgoCD compare en continu cet état avec le cluster.\n\n## Architecture\n1. Commit dans Git\n2. ArgoCD détecte le changement\n3. Synchronisation automatique vers K8s\n\n## Manifest ArgoCD\n\`\`\`yaml\napiVersion: argoproj.io/v1alpha1\nkind: Application\nmetadata:\n  name: mon-app\nspec:\n  syncPolicy:\n    automated:\n      prune: true\n      selfHeal: true\n\`\`\``,
        qcm: { enonce: "Quel outil est le standard pour faire du GitOps avec Kubernetes ?", options: ["Jenkins", "ArgoCD", "Terraform", "Ansible"], correct: 1 }
      },
      {
        titre: "7. AWS (cloud)",
        desc: "Découvrir EC2, S3, IAM et les bases du cloud computing.",
        contenu: `# Amazon Web Services\n\n## Les services essentiels\n- **IAM** : Gestion des identités et accès\n- **VPC** : Réseau privé virtuel\n- **EC2** : Serveurs virtuels (instances)\n- **S3** : Stockage d'objets\n- **RDS** : Bases de données managées\n\n## AWS CLI\n\`\`\`bash\naws configure\naws ec2 run-instances --image-id ami-0abcd1234 --instance-type t2.micro\naws s3 ls\naws s3 cp fichier.txt s3://mon-bucket/\n\`\`\``,
        qcm: { enonce: "Quel service AWS permet de stocker des fichiers de manière illimitée ?", options: ["EC2", "RDS", "S3", "Lambda"], correct: 2 }
      },
      {
        titre: "8. Monitoring (Prometheus/Grafana)",
        desc: "Collecter des métriques et créer des dashboards.",
        contenu: `# Monitoring avec Prometheus & Grafana\n\n## Prometheus\nBase de données de séries temporelles. Il "scrape" les métriques exposées sur \`/metrics\`.\n\n## Grafana\nOutil de visualisation. Il se connecte à Prometheus pour créer des dashboards.\n\n## AlertManager\nGère les alertes (envoi d'emails, Slack, etc.).\n\n## Déploiement via Helm\n\`\`\`bash\nhelm repo add prometheus-community https://prometheus-community.github.io/helm-charts\nhelm install kube-prom prometheus-community/kube-prometheus-stack\n\`\`\``,
        qcm: { enonce: "Quel outil est utilisé pour la visualisation de métriques ?", options: ["Prometheus", "Grafana", "AlertManager", "Node Exporter"], correct: 1 }
      },
      {
        titre: "9. Serveurs Web (Apache/Nginx)",
        desc: "Configurer Nginx comme reverse proxy et serveur de fichiers.",
        contenu: `# Serveurs Web (Nginx)\n\nNginx est un serveur web très performant.\n\n## Configuration de base\n\`\`\`nginx\nserver {\n    listen 80;\n    server_name mon-site.com;\n\n    location / {\n        root /var/www/html;\n        index index.html;\n    }\n\n    location /api/ {\n        proxy_pass http://localhost:3000/;\n    }\n}\n\`\`\`\n\n## Commandes utiles\n\`\`\`bash\nsudo systemctl restart nginx\nsudo nginx -t\n\`\`\``,
        qcm: { enonce: "Quelle directive Nginx permet de rediriger le trafic vers une application backend ?", options: ["root", "index", "proxy_pass", "listen"], correct: 2 }
      }
    ];

    console.log("📚 Insertion des modules, leçons et QCM...");
    for (let i = 0; i < modulesData.length; i++) {
      const m = modulesData[i];
      
      // Module
      const resMod = await query("INSERT INTO module (id_formation, id_auteur, titre, description, ordre, statut_module) VALUES ($1, $2, $3, $4, $5, 'publie') RETURNING id_module", [idFormation, idFormateur, m.titre, m.desc, i + 1]);
      const idModule = resMod.rows[0].id_module;

      // Leçon (Markdown)
      await query("INSERT INTO lecon (id_module, titre, contenu) VALUES ($1, $2, $3)", [idModule, `Cours : ${m.titre}`, m.contenu]);

      // Évaluation (QCM)
      const resEval = await query("INSERT INTO evaluation (id_module, intitule, consigne, note_maximale, type_evaluation, duree_minutes, seuil_reussite, nb_tentatives_max) VALUES ($1, $2, $3, 20, 'qcm', 15, 50, 3) RETURNING id_evaluation", [idModule, `QCM ${m.titre}`, "Testez vos connaissances."]);
      const idEval = resEval.rows[0].id_evaluation;

      // Question
      const resQ = await query("INSERT INTO question (id_evaluation, enonce, type_question, ordre) VALUES ($1, $2, 'choix_unique', 1) RETURNING id_question", [idEval, m.qcm.enonce]);
      const idQ = resQ.rows[0].id_question;

      // Propositions
      for (let j = 0; j < m.qcm.options.length; j++) {
        await query("INSERT INTO proposition (id_question, texte, est_correcte, ordre) VALUES ($1, $2, $3, $4)", [idQ, m.qcm.options[j], j === m.qcm.correct, j + 1]);
      }
    }

    console.log("✅ SUCCÈS TOTAL ! La formation DevOps est prête.");
    console.log("--------------------------------------------------");
    console.log("👨‍🏫 Formateur : prof_devops / test123");
    console.log("🎓 Apprenant  : etudiant_devops / test123");
    console.log("--------------------------------------------------");
    process.exit(0);

  } catch (err) {
    console.error("❌ Erreur :", err);
    process.exit(1);
  }
}

seedFormation();
